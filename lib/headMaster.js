'use strict';

var directoryTree = require('directory-tree').directoryTree;
var path = require('path');
var fs = require('fs');
var uglifyjs = require('uglify-js');
var pmkdir = require('mkdir-p').sync;
var util = require('util');
var uniqueID = require('simple-unique-id').generate;
var dropComments = require('drop-comments');

var extend = require('./core/obj/extend');
var $T = require('./core/util/template');

/**
 * @type {bject}
 */
var defaultOptions = {
    baseDir: './src',
    //outputDir: './dist', // no need to set! no need! if you set this, will output to a file
    tab: '\t',
    uglify: true,
    type: 7,
    mainfile: '',
    variablify: false
};

/**
 * @constructor
 * @type {Function}
 */
var headMaster = module.exports = function (options) {

    this.options = extend({}, defaultOptions, options || {});

    this.sourceTree = {};
    this.tmpl = {};
    this.dependList = [];
};

/**
 * Pack one package(file) or from text content
 *
 * @param {string} source
 * @param {string} namespace
 * @param {object} opts
 * @returns {string}
 * @public
 */
headMaster.prototype.pack = function (source, namespace, opts) {

    var opts = extend({}, this.options, opts || {});

    this.dependList = [];

    if (this.packageRealPath(source)) {
        namespace = namespace || source;
        this.packageWalker(source);
    } else {
        namespace = namespace || uniqueID();
        this.dependenceRouter(namespace, source);
        this.dependList.push(namespace);
    }

    var s = this.addBoxWrapper(this.organize(), namespace, opts.type);
    if (opts.uglify)
        s = uglifyjs.minify(s, {
            fromString: true
        }).code;

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
headMaster.prototype.packBundle = function (source, namespace, options) {
    var args = Array.prototype.slice.call(arguments);
    args.splice(0, 1, this.fixSource(source));
    return this.pack.apply(this, args);
};

/**
 * Pack all 'js' file ty themself dependencies from options.baseDir.
 * Output to options.outputDir, will keep directory tree structure.
 *
 * !! File system dependency, used for cli mode
 *
 * @param {object} opts
 * @public
 */
headMaster.prototype.packIsolated = function (opts) {

    opts = extend({}, this.options, opts || {});

    var tree = directoryTree(opts.baseDir, ['.js']);

    function parser(t) {

        if (t == null) {
            return;
        }

        if (t.type === 'directory' && t.children.length) {
            t.children.forEach(parser.bind(this));
        } else {
            console.log('Pack [%s] %s => %s', path.join(path.dirname(t.path), path.basename(t.path, '.js')), path.join(this.options.baseDir, t.path), path.join(this.options.outputDir, t.path));
            this.pack(path.join(path.dirname(t.path), path.basename(t.path, '.js')));
        }
    }

    parser.bind(this)(tree);
};

/**
 * Get template and create cache
 *
 * @param {string} name
 * @returns {string}
 */
headMaster.prototype.getTpl = function (name) {
    if (!(name in this.tmpl)) {
        var file = __dirname + '/tmpl/' + name + '.tpl.js';
        if (fs.existsSync(file))
            this.tmpl[name] = fs.readFileSync(file).toString();
    }
    return this.tmpl[name];
};

/**
 * output to file
 *
 * @param {string} packageName
 * @param {string} content
 * @private
 */
headMaster.prototype.outputFile = function (packageName, content) {
    fs.writeFileSync(this.mkFile(path.join(this.options.outputDir, packageName + '.js')), new Buffer(content));
};

/**
 * @param {object|array|string} source
 * @returns {*}
 * @private
 * TODO package name => propname [tree]
 */
headMaster.prototype.fixSource = function (source) {
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
headMaster.prototype.packageRealPath = function (packageName) {
    var p = path.join(this.options.baseDir, packageName) + '.js'
    return fs.existsSync(p) ? p : false;
};

/**
 * Recursively create directories, files needed
 *
 * @param {string} file
 * @returns {string}
 */
headMaster.prototype.mkFile = function (file) {
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
headMaster.prototype.indentCharacter = function (content, depth) {
    return content.replace(/\n/g, '\n' + this.options.tab.repeat(depth || 1));
};

/**
 * @param {string} content
 * @param {string} packageName
 * @param {number} type
 * @returns {string}
 * @private
 */
headMaster.prototype.addBoxWrapper = function (content, packageName, type) {
    var headers = [];
    // AMD
    (type & 4) === 4 && headers.push($T(this.getTpl('AMD-box-header'), {
        NAME: packageName
    }));
    // CMD
    (type & 2) === 2 && headers.push(this.getTpl('CMD-box-header'));

    // GLOBAL
    (type & 1) === 1 && headers.push($T(this.getTpl('GLOBAL-box-header'), {
        NAME: packageName.replace(/\//g, '_')
    }));

    return headers.length ? $T(this.getTpl('X-box-body'), {
        HEADER: this.indentCharacter(headers.join(' else ')),
        CONTENT: content
    }) : content;
}

/**
 * Organizer
 *
 * @returns {string}
 */
headMaster.prototype.organize = function () {

    var s = [];

    // variablify
    if (this.options.variablify) {
        var packages = this.dependList.join(', ').replace(/\//g, '_');
        this.dependList.forEach(function (name) {
            s.push($T(this.getTpl('variablifyPartWrapper'), {
                NAME: name.replace(/\//g, '_'),
                DEPENDS: this.sourceTree[name].deps.join(', ').replace(/\//g, '_'),
                CONTENT: this.indentCharacter(this.sourceTree[name].contents.replace(/require\(([\"\']{1})([^\)]+)\1\)/g, function (dep) {
                    return arguments[2].replace(/\//g, '_');
                }))
            }))
        }.bind(this));

        s = $T(this.getTpl('variablifyWrapper'), {
            PACKAGES: packages,
            CONTENT: this.indentCharacter(s.join('\n\n')),
            EXPORT: this.dependList.slice(-1)[0].replace(/\//g, '_')
        });
    } else {
        this.dependList.forEach(function (name) {
            s.push($T(this.getTpl('requirePartWrapper'), {
                NAME: name,
                CONTENT: this.indentCharacter(this.sourceTree[name].contents)
            }))
        }.bind(this));

        s = $T(this.getTpl('requireWrapper'), {
            EXPORT: this.dependList.slice(-1)[0],
            CONTENT: this.indentCharacter(s.join(',\n'), 2)
        });
    }

    return s;
};

/**
 * Walker, iterative rely crawling
 *
 * @param {string} packageName
 * @private
 */
headMaster.prototype.packageWalker = function (packageName) {
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
headMaster.prototype.dependenceRouter = function (packageName, content) {
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