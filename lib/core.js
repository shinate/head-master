'use strict';

var defaults = require('defaults');
var directoryTree = require('directory-tree').directoryTree;
var path = require('path');
var fs = require('fs');
var uglifyjs = require('uglify-js');
var pmkdir = require('mkdir-p').sync;
var util = require('util');
var uniqueID = require('random-string');
var dropComments = require('drop-comments');
var map = require('map-stream');
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

var SOURCE_TREE = {};

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
var HeadMaster = function (opts) {
    this.options = defaults(opts, DEFAULT_OPTIONS);
    this.parseParam(this.options);
    this.sourceTree = SOURCE_TREE;
    this.dependList = [];
};

HeadMaster.config = function (opts) {
    DEFAULT_OPTIONS = defaults(opts, DEFAULT_OPTIONS);
};

var HMP = HeadMaster.prototype;

HMP.parseParam = function (opts) {
    if (opts.sourceDir == null) {
        throw new Error('sourceDir');
    }
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
HMP.pack = function (content, namespace) {

    this.options.namespace = namespace || this.options.namespace || uniqueID({
            length: 20,
            numeric: false,
            letters: true
        });

    return this.walker(content, this.options.namespace).organize().addBoxWrapper().uglify();
};

HMP.packFromFile = function (packageName, namespace) {
    var s = this.packageRealPath(packageName);
    if (!s) {
        throw new TypeError('Package does not exists!');
    }
    return this.pack(fs.readFileSync(s).toString(), namespace || packageName);
};

HMP.toString = function () {
    return this.contents;
};

HMP.toBuffer = function () {
    return new Buffer(this.contents, 'utf8');
};

HMP.uglify = function (config) {

    var config = config || this.options.uglify;

    if (config) {
        this.contents = uglifyjs.minify(this.contents, {
            fromString: true
        }).code;
    }
    return this;
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
HMP.packBundle = function (source, namespace, options) {
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
HMP.packIsolated = function (opts) {

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
 * @public
 */
HMP.toFile = function (packagePath) {
    var packagePath = packagePath || path.join(this.options.outputDir, this.options.namespace + '.js');
    return fs.writeFileSync(this.mkFile(packagePath), this.toBuffer());
};

/**
 * @param {object|array|string} source
 * @returns {*}
 * @private
 * TODO package name => propname [tree]
 */
HMP.fixSource = function (source) {
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
 * @public
 */
HMP.packageRealPath = function (packageName) {
    var p = path.join(this.options.sourceDir, packageName) + '.js'
    return fs.existsSync(p) ? p : false;
};

/**
 * Recursively create directories, files needed
 *
 * @param {string} file
 * @returns {string}
 * @public
 */
HMP.mkFile = function (file) {
    pmkdir(path.dirname(file));
    return file;
}

/**
 * Beautify text Indent
 *
 * @param {string} content
 * @param {number} depth, default:1
 * @returns {string}
 * @public
 */
HMP.indentCharacter = function (content, depth) {
    return content.replace(/\n/g, '\n' + this.options.tab.repeat(depth || 1));
};

/**
 * @param {string} content
 * @param {string} packageName
 * @param {number} type
 * @returns {string}
 * @public
 */
HMP.addBoxWrapper = function (content, type) {
    var type = type || this.options.type;

    if (type > 0) {

        var headers = [], namespace = this.options.namespace;

        // AMD
        (type & 4) === 4 && headers.push($T('header-AMD', {
            NAME: namespace
        }));
        // CMD
        (type & 2) === 2 && headers.push($T('header-CMD'));

        // GLOBAL
        (type & 1) === 1 && headers.push($T('header-GLOBAL', {
            NAME: namespace.replace(/\//g, '_')
        }));

        this.contents = $T('header-wrapper', {
            HEADER: this.indentCharacter(headers.join(' else ')),
            CONTENT: this.contents
        });
    }

    return this;
};

/**
 * Organizer
 *
 * @returns {HeadMaster}
 * @public
 */
HMP.organize = function () {

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

        this.contents = $T('variablify-wrap', {
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

        this.contents = $T('require-wrap', {
            EXPORT: this.dependList.slice(-1)[0],
            CONTENT: this.indentCharacter(s.join(',\n'), 2)
        });
    }

    return this;
};


HMP.walker = function (content, packageName) {
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

                this.walker(fs.readFileSync(this.packageRealPath(dep)).toString(), dep);
                this.sourceTree[packageName].deps.push(dep);

                // replace to unqire name
                return 'require(\'' + dep + '\')';
            }.bind(this));
    }
    // depend
    this.dependList.indexOf(packageName) < 0 && this.dependList.push(packageName);

    return this;
};

module.exports = HeadMaster;