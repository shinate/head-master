'use strict';

var extend = require('extend-object');
var directoryTree = require('directory-tree').directoryTree;
var path = require('path');
var fs = require('fs');
var uglifyjs = require('uglify-js');
var mkdirp = require('mkdirp').sync;
var util = require('util');
var uniqueID = require('random-string');
var dropComments = require('drop-comments');
var requireDir = require('require-dir');
var through = require('through2');
var File = require('vinyl');
var vfs = require('vinyl-fs');

var TEMPLATE_CACHE = requireDir('./tpl');

/**
 * @type {object}
 */
var DEFAULT_OPTIONS = {
    base: null,
    namespace: null,
    contents: '',
    package: null,
    table: '\t',
    uglify: true,
    type: 7,
    mainfile: '',
    variablify: false,
    camelcase: false // underScoreCase, camelCase
};

var SOURCE_TREE = {};

/**
 * @constructor
 * @type {Function}
 */
var HeadMaster = function (opts) {
    this.options = extend({}, DEFAULT_OPTIONS, opts);
    this.parseParam();
    this.sourceTree = SOURCE_TREE;
    this.dependList = [];
};

var HMP = HeadMaster.prototype;

HMP.parseParam = function (opts) {

    var opts = opts == null ? this.options : extend(this.options, opts);

    if (opts.base == null) {
        throw new Error('base');
    }

    opts.package = opts.package || uniqueID({
            length: 20,
            numeric: false,
            letters: true
        });

    opts.namespace = opts.namespace || opts.package;

    if (opts.contents == null) {
        var _path = this.packageRealPath(opts.package);
        if (_path) {
            opts.contents = fs.readFileSync(_path).toString();
        }
    }

    return this;
};

HMP.tpl = function (name, data) {
    if (TEMPLATE_CACHE.hasOwnProperty(name)) {
        return TEMPLATE_CACHE[name](data || {}).replace(/\t/g, this.options.table);
    }
    else {
        throw new Error('Template "' + name + '" dose not exists!');
    }
};

HMP.variablname = function (v) {
    return this.options.camelcase ? v.replace(/\/\w/g, function (m) {
        return m.substr(1).toUpperCase();
    }) : v.replace(/\//g, '_');
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
HMP.pack = function () {
    return this.walker(this.options.package, this.options.contents).organize().addBoxWrapper().uglify();
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
 * Pack all 'js' file ty themself dependencies from options.base.
 * Output to options.outputDir, will keep directory tree structure.
 *
 * !! File system dependency, used for cli mode
 *
 * @param {object} opts
 * @public
 */
HMP.packIsolated = function (opts) {

    opts = extend({}, this.options, opts || {});

    var tree = directoryTree(opts.base, ['.js']);

    function parser(t) {

        if (t == null) {
            return;
        }

        if (t.type === 'directory' && t.children.length) {
            t.children.forEach(parser.bind(this));
        } else {
            console.log('Pack [%s] %s => %s', path.join(path.dirname(t.path), path.basename(t.path, '.js')), path.join(this.options.base, t.path), path.join(this.options.outputDir, t.path));
            this.pack(path.join(path.dirname(t.path), path.basename(t.path, '.js')));
        }
    }

    parser.bind(this)(tree);
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
        source = 'module.exports = [\n' + this.options.table + 'require(\'' + source.join('\'),\n' + this.options.table + 'require(\'') + '\')\n];';
    } else if (util.isObject(source)) {
        var s = [];
        for (var ns in source) {
            s.push('\'' + ns + '\': require(\'' + source[ns] + '\')');
        }
        source = 'module.exports = {\n' + this.options.table + s.join(',\n' + this.options.table) + '\n};';
    }
    return source;
};

/**
 * Get real path of package
 *
 * @param {string} name
 * @returns {string}
 * @public
 */
HMP.packageRealPath = function (name) {
    var p = path.join(this.options.base, name) + '.js';
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
    mkdirp(path.dirname(file));
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
    return content.replace(/\n/g, '\n' + this.options.table.repeat(depth || 1));
};

/**
 * @param {string} content
 * @param {string} packageName
 * @param {number} type
 * @returns {string}
 * @public
 */
HMP.addBoxWrapper = function (type) {
    var type = type == null ? this.options.type : type;

    if (type > 0) {

        var headers = [], namespace = this.options.namespace;

        // AMD
        (type & 4) === 4 && headers.push(this.tpl('header-AMD', {
            NAME: namespace
        }));
        // CMD
        (type & 2) === 2 && headers.push(this.tpl('header-CMD'));

        // GLOBAL
        (type & 1) === 1 && headers.push(this.tpl('header-GLOBAL', {
            NAME: this.variablname(namespace)
        }));

        this.contents = this.tpl('header-wrapper', {
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

    // variablify
    if (this.options.variablify) {

        this.contents = this.tpl('variablify-wrap', {
            PACKAGES: this.variablname(this.dependList.join(', ')),
            EXPORT: this.variablname(this.dependList.slice(-1)[0]),
            CONTENT: this.indentCharacter(this.dependList.map(function (name) {
                return this.tpl('variablify-part-wrap', {
                    NAME: this.variablname(name),
                    DEPENDS: this.variablname(this.sourceTree[name].deps.join(', ')),
                    CONTENT: this.indentCharacter(this.sourceTree[name].contents.replace(/require\(([\"\']{1})([^\)]+)\1\)/g, function (dep) {
                        return this.variablname(arguments[2]);
                    }.bind(this)))
                });
            }.bind(this)).join('\n\n'))
        });
    } else {
        this.contents = this.tpl('require-wrap', {
            EXPORT: this.dependList.slice(-1)[0],
            CONTENT: this.indentCharacter(this.dependList.map(function (name) {
                return this.tpl('require-part-wrap', {
                    NAME: name,
                    CONTENT: this.indentCharacter(this.sourceTree[name].contents)
                });
            }.bind(this)).join(',\n'), 2)
        });
    }

    return this;
};

/**
 *
 *
 * @param packageName
 * @param content
 * @returns {HeadMaster}
 */
HMP.walker = function (packageName, content) {

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

                // options.nps ...
                // TODO Find node modules packages

                this.walker(dep, this.sourceTree.hasOwnProperty(dep)
                        ? this.sourceTree[dep].contents
                        : fs.readFileSync(this.packageRealPath(dep)).toString()
                );
                this.sourceTree[packageName].deps.push(dep);

                // replace to unqire name
                return 'require(\'' + dep + '\')';
            }.bind(this));
    } else {
        this.sourceTree[packageName].deps.forEach(this.walker.bind(this));
    }

    // depend
    this.dependList.indexOf(packageName) < 0 && this.dependList.push(packageName);

    return this;
};

/**
 *
 * @returns {string}
 */
HMP.toString = function () {
    return this.contents;
};

/**
 *
 * @returns {Buffer}
 */
HMP.toBuffer = function () {
    return new Buffer(this.contents, 'utf8');
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
 *
 *
 * @param packageName
 * @returns {File}
 */
HMP.toStream = function (packageName) {
    return new File({
        base: this.options.base,
        path: path.join(this.options.base, packageName || this.options.namespace) + '.js',
        contents: this.toBuffer()
    })
};

/**
 *
 * @param {function} factory
 * @returns {HeadMaster}
 */
HMP.pipe = function (factory) {
    factory.call(this);
    return this;
};

/**
 *
 * @param {string} HTMLString
 * @param {object} opts
 * @returns {HeadMaster}
 */
HeadMaster.fromHTML = function (HTMLString, opts) {
    return new HeadMaster(extend({
        contents: HTMLString
    }, opts));
};

/**
 * @param opts
 */
HeadMaster.config = function (opts) {
    extend(DEFAULT_OPTIONS, opts);
};

/**
 * Reference
 *
 * @type {object}
 * @public
 */
HeadMaster.SOURCE_TREE = SOURCE_TREE;

/**
 * @param content
 * @param namespace
 * @param opts
 * @return {HeadMaster}
 * @public
 */
HeadMaster.pack = function (content, namespace, opts) {
    return new HeadMaster(extend({
        contents: content,
        namespace: namespace
    }, opts)).pack();
};

/**
 * Stream to bundle
 *
 * @param opts
 * @returns {function}
 */
HeadMaster.streamBundle = function (opts) {

    var source = [];
    // Fix base
    var base;

    return through.obj(function (file, env, cb) {

        if (base == null || file.base.length < base.length) {
            base = file.base;
        }

        source.push({
            contents: file.contents.toString(),
            package: file.path
        });

        cb();

    }, function (cb) {

        var _HM = new HeadMaster(extend({
            base: path.relative(path.resolve('./'), base)
        }, opts));

        this.push(
            _HM
                .parseParam({
                    contents: _HM.tpl('maker-' + opts.bundle, {
                        REGISTER: uniqueID(),
                        PACKAGES: source.map(function (p) {
                            var _p = path.join(path.dirname(path.relative(base, p.package)), path.basename(p.package, '.js'));
                            // create source tree
                            // but no depends
                            _HM.walker(_p, p.contents);
                            return _p;
                        })
                    })
                })
                .pack()
                .toStream()
        );

        cb();
    });
};

/**
 * Stream to isolated
 *
 * @param opts
 * @returns {function}
 * @public
 */
HeadMaster.streamIsolated = function (opts) {

    return through.obj(function (file, env, cb) {

        var _p = path.relative(file.base, file.path);

        file.contents = new HeadMaster(extend({
            base: path.relative(path.resolve('./'), file.base),
            contents: file.contents.toString(),
            package: path.join(path.dirname(_p), path.basename(_p, '.js'))
        }, opts)).pack().toBuffer();

        this.push(file);

        cb();
    });
};

/**
 * Stream actions
 *
 * @param opts
 * @returns {function}
 * @public
 */
HeadMaster.map = function (opts) {
    return HeadMaster[opts.hasOwnProperty('bundle') ? 'streamBundle' : 'streamIsolated'](opts);
};

module.exports = HeadMaster;