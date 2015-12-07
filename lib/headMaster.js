'use strict';

var directoryTree = require('directory-tree').directoryTree;
var path = require('path');
var fs = require('fs');
var uglifyjs = require('uglify-js');
var pmkdir = require('mkdir-p').sync;
var util = require('util');
var uniqueID = require('simple-unique-id').generate;
var extractComments = require('extract-comments');


var extend = require('./core/obj/extend');
var $T = require('./core/util/template');

var defaultOptions = {
    baseDir: './src',
    outputDir: './dist',
    tab: '\t',
    uglify: true,
    type: 7,
    mainfile: ''
};

var headMaster = module.exports = function (options) {
    this.sourceTree = {};
    this.tmpl = {};
    this.dependList = [];

    this.init(options);
};

headMaster.prototype.init = function (options) {
    this.options = extend({}, defaultOptions, options || {});
};

headMaster.prototype.getTpl = function (name) {
    if (!(name in this.tmpl)) {
        var file = __dirname + '/tmpl/' + name + '.tpl.js';
        if (fs.existsSync(file))
            this.tmpl[name] = fs.readFileSync(file).toString();
    }
    return this.tmpl[name];
};

headMaster.prototype.pack = function (source, namespace, opts) {

    namespace = namespace || (this.packageRealPath(source) ? source : uniqueID());

    this.dependList = [];
    this.buildDependList(source, namespace);

    opts = extend({}, this.options, opts || {});

    var s = [];
    this.dependList.forEach(function (name) {
        s.push('\'' + name + '\': ' + this.addPartWrapper(this.sourceTree[name].contents));
    }.bind(this));
    s = this.addRequireWrapper(s.join(',\n'), namespace);
    s = this.addBoxWrapper(s, namespace, opts.type);
    if (opts.uglify)
        s = uglifyjs.minify(s, {fromString: true}).code;

    return s;
};

headMaster.prototype.packOne = function (source, ns, opts) {
    opts = extend({}, this.options, opts || {});

    if (this.packageRealPath(source)) {
        fs.writeFileSync(
            this.mkFile(path.join(opts.outputDir, source + '.js')),
            new Buffer(this.pack(source, ns || null))
        );
    }
};

headMaster.prototype.packAll = function (opts) {

    opts = extend({}, this.options, opts || {});

    var tree = directoryTree(opts.baseDir, ['.js']);

    function parser(t) {

        if (t == null) {
            return;
        }

        if (t.type === 'directory' && t.children.length) {
            t.children.forEach(parser.bind(this));
        } else {
            fs.writeFileSync(
                this.mkFile(path.join(opts.outputDir, t.path)),
                new Buffer(this.pack(
                    path.join(path.dirname(t.path), path.basename(t.path, '.js'))
                ))
            );
        }
    }

    parser.bind(this)(tree);
};

headMaster.prototype.packageRealPath = function (packageName) {
    var p = path.join(this.options.baseDir, packageName) + '.js'
    return fs.existsSync(p) ? p : false;
};

headMaster.prototype.mkFile = function (file) {
    pmkdir(path.dirname(file));
    return file;
}

headMaster.prototype.indentCharacter = function (content) {
    return content.replace(/\n/g, '\n' + this.options.tab);
};

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

headMaster.prototype.addPartWrapper = function (content) {
    return $T(this.getTpl('PartWrapper'), {
        CONTENT: this.indentCharacter(content)
    });
};

headMaster.prototype.addRequireWrapper = function (content, packageName) {
    return $T(this.getTpl('RequireWrapper'), {
        NAME: packageName,
        CONTENT: this.indentCharacter(content)
    });
};

headMaster.prototype.buildDependList = function (source, ns) {
    var content;
    if (util.isString(source) && source !== '') {
        var packageRealPath = this.packageRealPath(source);
        if (packageRealPath) {
            content = fs.readFileSync(packageRealPath).toString();
            ns = source;
        } else {
            content = source;
        }

        if (ns in this.sourceTree) {
            this.sourceTree[ns].deps.forEach(this.buildDependList.bind(this));
        } else {
            this.sourceTree[ns] = {deps: []};
            this.sourceTree[ns].contents = this.stripComments(content).replace(/require\(([\"\']{1})([^\)]+)\1\)/g, function () {
                var dep = arguments[2];
                // get depend "name"
                if (/^\.{1,2}\//.test(dep)) {
                    dep = path.join(path.dirname(ns), dep);
                } else if (/^\//.test(dep)) {
                    dep = dep.substr(1);
                }

                this.buildDependList(dep);
                this.sourceTree[ns].deps.push(dep);

                // replace to unqire name
                return 'require(\'' + dep + '\')';
            }.bind(this));
        }

        // add to depend list
        this.dependList.indexOf(ns) < 0 && this.dependList.push(ns);
    }
};

headMaster.prototype.stripComments = function (content) {

    function factory(type, content) {
        var start = 0,
            end = 0,
            _C = [];

        extractComments[type](content).forEach(function (comment) {
            end = comment.loc.start.pos;
            start !== end && _C.push(content.slice(start, end));
            start = comment.loc.end.pos;
        });
        _C.push(content.slice(start));
        return _C.join('');
    }

    content = content.replace(/\r\n|\r/g, '\n');

    ['block', 'line'].forEach(function (type) {
        content = factory(type, content);
    });

    return content.replace(/[\x20]+(\n)/g, '$1').replace(/\n+/g, '\n\n').replace(/^\n+/, '\n');
}