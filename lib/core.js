'use strict';

var extend = require('extend-object');
var Path = require('path');
var fs = require('fs');
var uglifyjs = require('uglify-js');
var mkdirp = require('mkdirp').sync;
var util = require('util');
var uniqueID = require('random-string');
var dropComments = require('drop-comments');
var requireDir = require('require-dir');
var through = require('through2');
var File = require('vinyl');
//var vfs = require('vinyl-fs');
var mapFiles = require('map-files');
// var espree = require('espree');

var sameBase = require('./core/util/sameBase');

/**
 * ======================================
 * Const
 * ======================================
 */

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
    uglify: false,
    type: 0,
    mainfile: '',
    variablify: false,
    camelcase: false // underScoreCase, camelCase
};

var SOURCE_TREE = {};

function parsePath(path) {
    var extname = Path.extname(path);
    return {
        dirname: Path.dirname(path),
        basename: Path.basename(path, extname),
        extname: extname
    };
}

/**
 * ======================================
 * Constructor
 * ======================================
 */

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

/**
 * @type {Object|Function}
 */
var HMP = HeadMaster.prototype;

/**
 * Parse parameter
 *
 * @param opts
 * @returns {HeadMaster}
 * @public
 */
HMP.parseParam = function (opts) {

    var opts = opts == null ? this.options : extend(this.options, opts);

    if (opts.base == null) {
        throw new Error('Base must be set!');
    }

    opts.package = opts.package || uniqueID({
            length: 20,
            numeric: false,
            letters: true
        });

    opts.namespace = opts.namespace || opts.package;

    if (opts.contents == null) {
        var _path = this.realPath(opts.package);
        if (_path) {
            opts.contents = fs.readFileSync(_path).toString();
        }
    }

    return this;
};

/**
 * Template data render
 *
 * @param name
 * @param data
 * @returns {string|void}
 * @private
 */
HMP.tpl = function (name, data) {
    if (TEMPLATE_CACHE.hasOwnProperty(name)) {
        return TEMPLATE_CACHE[name].call(this, data).replace(/\t/g, this.options.table);
    }
    else {
        throw new Error('Template "' + name + '" dose not exists!');
    }
};

/**
 * Conversion naming convention
 *
 * @param v {string}
 * @returns {string}
 * @private
 */
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
    return this.crawl().organize().header().uglify();
};

/**
 *
 * @param packageName
 * @param content
 * @returns {HeadMaster}
 */
HMP.crawl = function (packageName, content) {
    this.walker((packageName == null ? this.options.package : packageName), (content == null ? this.options.contents : content));
    return this;
};

/**
 * @param config
 * @returns {HeadMaster}
 */
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
 * Get real path of package
 *
 * @param {string} name
 * @returns {string}
 * @public
 */
HMP.realPath = function (name) {
    var p = Path.join(this.options.base, name + '.js');
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
    mkdirp(Path.dirname(file));
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
HMP.header = function (type) {

    var type = type == null ? this.options.type : type;

    var headers;

    if (type > 0) {

        var namespace = this.options.namespace;
        headers = [];

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

        headers = this.indentCharacter(headers.join(' else '));

    } else {
        headers = this.tpl('header-NONE');
    }

    this.contents = this.tpl('header-wrapper', {
        HEADER: headers,
        CONTENT: this.contents
    });

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

HMP.adapter = function (content) {
    //console.log(content);
    return dropComments(content).replace(/^[\S\s]*(define\((?:([^,\[]+),)?\s*(?:\[([^\]]+)\],)?)\s*(function\s*\(([^\)]*)\))\s*\{([\S\s]*)(\}\);?)[\S\s]*$/, function (match, define, name, deps, scoop, variables, content, close) {
        deps = deps.replace(/\s*,\s*/g, ',').split(',');
        variables = variables.replace(/\s*,\s*/g, ',').split(',');
        var requires = variables.map(function (v, i) {
            return 'var ' + v + ' = require(' + deps[i] + ');';
        }).join('\n\t');
        console.log(deps, variables, requires, requires + content);
    });
    //var exp = /^[\S\s]*(define\((?:([^,\[]+),)?\s*(?:\[([^\]]+)\],)?)\s*function\s*\(([^\)]*)\)\s*\{([\S\s]*)(\}\);?)[\S\s]*$/g.exec(content);
    //console.log(exp);

    return dropComments(content);
};

/**
 * Walker
 *
 * @param packageName
 * @param content
 * @returns {HeadMaster}
 */
HMP.walker = function (packageName, content) {

    if (!this.sourceTree.hasOwnProperty(packageName)) {
        this.sourceTree[packageName] = {deps: []};
        this.sourceTree[packageName].contents = this.adapter(content)
            .replace(/require\(([\"\']{1})([^\)]+)\1\)/g, function () {
                var dep = arguments[2];
                // get depend "name"
                if (/^\.{1,2}\//.test(dep)) {
                    dep = Path.join(Path.dirname(packageName), dep);
                } else if (/^\//.test(dep)) {
                    dep = dep.substr(1);
                }

                // options.nps ...
                // TODO Find node modules packages

                this.walker(dep, this.sourceTree.hasOwnProperty(dep)
                        ? this.sourceTree[dep].contents
                        : fs.readFileSync(this.realPath(dep)).toString()
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
HMP.toFile = function (path) {
    var path = path || Path.join(this.options.outputDir, this.options.namespace + '.js');
    return fs.writeFileSync(this.mkFile(path), this.toBuffer());
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
        path: Path.join(this.options.base, packageName || this.options.namespace) + '.js',
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
 * ======================================
 * Static
 * ======================================
 */

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

HeadMaster.fromFile = function (file, opts) {

};

HeadMaster.fromSrc = function (src, opts) {

    var src = [].concat(src),
        base = sameBase(src),
        source = [];

    function readFunc(fp) {
        fp = parsePath(fp);
        return Path.relative(base, Path.join(fp.dirname, fp.basename));
    }

    var files = mapFiles(src, {
        read: readFunc
    });

    for (var i in files) {
        if (files.hasOwnProperty(i)) {
            source.push(files[i]);
        }
    }

    opts = extend({bundle: 'relax'}, opts, {
        base: base
    });

    var _HM = new HeadMaster(opts);

    _HM.parseParam({
        contents: _HM.tpl('maker-' + opts.bundle, source)
    });

    return _HM;
};

HeadMaster.fromDir = function (dir, opts) {

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
            base: Path.relative(Path.resolve('./'), base)
        }, opts));

        this.push(
            _HM
                .parseParam({
                    contents: _HM.tpl('maker-' + opts.bundle, source.map(function (p) {
                        var _p = Path.join(Path.dirname(Path.relative(base, p.package)), Path.basename(p.package, '.js'));
                        // create source tree
                        // but no depends
                        _HM.crawl(_p, p.contents);
                        return _p;
                    }))
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

        var _p = parsePath(file.relative);

        file.contents = new HeadMaster(extend({
            base: Path.relative(Path.resolve('./'), file.base),
            contents: file.contents.toString(),
            package: Path.join(_p.dirname, _p.basename)
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