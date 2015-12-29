'use strict';

var defaults = require('defaults');
var directoryTree = require('directory-tree').directoryTree;
var path = require('path');
var fs = require('fs');
var uglifyjs = require('uglify-js');
var pmkdir = require('mkdir-p').sync;
var util = require('util');
var uniqueID = require('simple-unique-id').generate;
var dropComments = require('drop-comments');
var map = require('map-stream');

var template = require('./core/util/template');
var requireDir = require('require-dir');

var TEMPLATE_CACHE = requireDir('./tpl');

/**
 * @type {bject}
 */
var DEFAULT_OPTIONS = {
    sourceDir: null,
    outputDir: null,
    package: null,
    namespace: null,
    tab: '\t',
    uglify: true,
    type: 7,
    mainfile: '',
    variablify: false
};

/**
 * Get template and create cache
 *
 * @param {string} name
 * @returns {string}
 * @public
 */
function $T(name, data) {
    return TEMPLATE_CACHE[name](data || {});
}

/**
 * @constructor
 * @type {Function}
 */
var HM = function (opts) {
    this.options = defaults(opts, DEFAULT_OPTIONS);
    this.parseParam();
    this.sourceTree = {};
    this.dependList = [];
};

HM.config = function (opts) {
    DEFAULT_OPTIONS = defaults(opts, DEFAULT_OPTIONS);
};

HM.prototype.parseParam = function (opts) {
    console.log(this.options);
};

/**
 * Pack one package(file) or from text content
 *
 * @param {string} content
 * @param {string} namespace
 * @param {object} opts
 * @returns {string}
 * @public
 */
HM.prototype.pack = function (content, namespace, opts) {

    var opts = defaults(opts, this.options);
    var namespace = opts.namespace || namespace || uniqueID();

    this.walker(namespace, content);

    var s = this.addBoxWrapper(this.organize(), namespace, opts.type);

    if (opts.uglify) {
        s = uglifyjs.minify(s, {
            fromString: true
        }).code;
    }

    if (this.options.outputDir) {
        this.outputFile(namespace, s);
    } else {
        return s;
    }
};

/**
 * Pack from config : Array/Object/JsonString
 * Organized as a single package(file)
 *
 * @param {object|array|string} source
 * @param {string} namespace
 * @param {object} options
 * @returns {string}
 * @public
 * TODO to be optimized, package register
 */
HM.prototype.packBundle = function (source, namespace, options) {
    var args = [].slice.call(arguments);
    args.splice(0, 1, this.fixSource(source));
    return this.pack.apply(this, args);
};

/**
 * Pack all 'js' file ty themself dependencies from options.sourceDir.
 * Output to options.outputDir, will keep directory tree structure.
 *
 * !! File system dependency, used for cli mode
 *
 * @param {object} opts
 * @public
 */
HM.prototype.packIsolated = function (opts) {

    opts = extend({}, this.options, opts || {});

    var tree = directoryTree(opts.sourceDir, ['.js']);

    function parser(t) {

        if (t == null) {
            return;
        }

        if (t.type === 'directory' && t.children.length) {
            t.children.forEach(parser.bind(this));
        } else {
            console.log('Pack [%s] %s => %s', path.join(path.dirname(t.path), path.basename(t.path, '.js')), path.join(this.options.sourceDir, t.path), path.join(this.options.outputDir, t.path));
            this.pack(path.join(path.dirname(t.path), path.basename(t.path, '.js')));
        }
    }

    parser.bind(this)(tree);
};

/**
 * output to file
 *
 * @param {string} packageName
 * @param {string} content
 * @private
 */
HM.prototype.outputFile = function (packageName, content) {
    fs.writeFileSync(this.mkFile(path.join(this.options.outputDir, packageName + '.js')), new Buffer(content));
};

/**
 * @param {object|array|string} source
 * @returns {*}
 * @private
 * TODO package name => propname [tree]
 */
HM.prototype.fixSource = function (source) {
    if (util.isString(source)) {
        source = JSON.parse(source);
    }
    if (util.isArray(source)) {
        source = 'module.exports = [\n' + this.options.tab + 'require(\'' + source.join('\'),\n' + this.options.tab + 'require(\'') + '\')\n];';
    } else if (util.isObject(source)) {
        var s = [];
        for (var ns in source) {
            s.push('\'' + ns + '\': require(\'' + source[ns] + '\')');
        }
        source = 'module.exports = {\n' + this.options.tab + s.join(',\n' + this.options.tab) + '\n};';
    }
    return source;
};

/**
 * Get real path of package
 *
 * @param {string} packageName
 * @returns {string}
 */
HM.prototype.packageRealPath = function (packageName) {
    var p = path.join(this.options.sourceDir, packageName) + '.js'
    return fs.existsSync(p) ? p : false;
};

/**
 * Recursively create directories, files needed
 *
 * @param {string} file
 * @returns {string}
 */
HM.prototype.mkFile = function (file) {
    pmkdir(path.dirname(file));
    return file;
}

/**
 * Beautify text Indent
 *
 * @param {string} content
 * @param {number} depth, default:1
 * @returns {string}
 */
HM.prototype.indentCharacter = function (content, depth) {
    return content.replace(/\n/g, '\n' + this.options.tab.repeat(depth || 1));
};

/**
 * @param {string} content
 * @param {string} packageName
 * @param {number} type
 * @returns {string}
 * @private
 */
HM.prototype.addBoxWrapper = function (content, packageName, type) {
    var headers = [];
    // AMD
    (type & 4) === 4 && headers.push($T('export-AMD', {
        NAME: packageName
    }));
    // CMD
    (type & 2) === 2 && headers.push($T('export-CMD'));

    // GLOBAL
    (type & 1) === 1 && headers.push($T('export-GLOBAL', {
        NAME: packageName.replace(/\//g, '_')
    }));

    return headers.length ? $T('wrapper', {
        HEADER: this.indentCharacter(headers.join(' else ')),
        CONTENT: content
    }) : content;
}

/**
 * Organizer
 *
 * @returns {string}
 */
HM.prototype.organize = function () {

    var s = [];

    // variablify
    if (this.options.variablify) {
        var packages = this.dependList.join(', ').replace(/\//g, '_');
        this.dependList.forEach(function (name) {
            s.push($T('variablify-part-wrap', {
                NAME: name.replace(/\//g, '_'),
                DEPENDS: this.sourceTree[name].deps.join(', ').replace(/\//g, '_'),
                CONTENT: this.indentCharacter(this.sourceTree[name].contents.replace(/require\(([\"\']{1})([^\)]+)\1\)/g, function (dep) {
                    return arguments[2].replace(/\//g, '_');
                }))
            }))
        }.bind(this));

        s = $T('variablify-wrap', {
            PACKAGES: packages,
            CONTENT: this.indentCharacter(s.join('\n\n')),
            EXPORT: this.dependList.slice(-1)[0].replace(/\//g, '_')
        });
    } else {
        this.dependList.forEach(function (name) {
            s.push($T('require-part-wrap', {
                NAME: name,
                CONTENT: this.indentCharacter(this.sourceTree[name].contents)
            }))
        }.bind(this));

        s = $T('require-wrap', {
            EXPORT: this.dependList.slice(-1)[0],
            CONTENT: this.indentCharacter(s.join(',\n'), 2)
        });
    }

    return s;
};


HM.prototype.walker = function (packageName, content) {
    if (!this.sourceTree.hasOwnProperty(packageName)) {
        this.sourceTree[packageName] = {deps: []};
        this.sourceTree[packageName].contents = dropComments(content)
            .replace(/require\(([\"\']{1})([^\)]+)\1\)/g, function () {
                var dep = arguments[2];
                // get depend "name"
                if (/^\.{1,2}\//.test(dep)) {
                    dep = path.join(path.dirname(packageName), dep);
                } else if (/^\//.test(dep)) {
                    dep = dep.substr(1);
                }

                this.walker(dep, fs.readFileSync(this.packageRealPath(dep)).toString());
                this.sourceTree[packageName].deps.push(dep);

                // replace to unqire name
                return 'require(\'' + dep + '\')';
            }.bind(this));
    }
    // depend
    this.dependList.indexOf(packageName) < 0 && this.dependList.push(packageName);
};

/**
 * Walker, iterative rely crawling
 *
 * @param {string} packageName
 * @private
 */
HM.prototype.packageWalker = function (packageName) {
    if (packageName in this.sourceTree) {
        this.sourceTree[packageName].deps.forEach(this.packageWalker.bind(this));
    } else {
        this.dependenceRouter(packageName, fs.readFileSync(this.packageRealPath(packageName)).toString());
    }
    // add to depend list
    this.dependList.indexOf(packageName) < 0 && this.dependList.push(packageName);
};

/**
 * Analysis package relies
 *
 * @param {string} packageName
 * @param {string} content
 * @private
 */
HM.prototype.dependenceRouter = function (packageName, content) {
    this.sourceTree[packageName] = {deps: []};
    this.sourceTree[packageName].contents = dropComments(content)
        .replace(/require\(([\"\']{1})([^\)]+)\1\)/g, function () {
            var dep = arguments[2];
            // get depend "name"
            if (/^\.{1,2}\//.test(dep)) {
                dep = path.join(path.dirname(packageName), dep);
            } else if (/^\//.test(dep)) {
                dep = dep.substr(1);
            }

            this.packageWalker(dep);
            this.sourceTree[packageName].deps.push(dep);

            // replace to unqire name
            return 'require(\'' + dep + '\')';
        }.bind(this));
};

module.exports = HM;