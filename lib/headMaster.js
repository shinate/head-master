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
    //outputDir: './dist', // no need to set!
    tab: '\t',
    uglify: true,
    type: 7,
    mainfile: '',
    variablify: false
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

    var opts = extend({}, this.options, opts || {});

    this.dependList = [];

    if (this.packageRealPath(source)) {
        namespace = namespace || source;
        this.packageWalker(source);
    } else {
        namespace = namespace || uniqueID();
        this.dependWalker(namespace, source);
        this.dependList.push(namespace);
    }

    var s = this.addBoxWrapper(this.gather(), namespace, opts.type);
    if (opts.uglify)
        s = uglifyjs.minify(s, {
            fromString: true
        }).code;

    if (this.options.outputDir) {
        this.output(namespace, s);
    } else {
        return s;
    }
};

// TODO to be optimized
headMaster.prototype.packBundle = function (source, namespace, options) {
    var args = Array.prototype.slice.call(arguments);
    args.splice(0, 1, this.fixSource(source));
    return this.pack.apply(this, args);
};

// Only work on cli mode
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
            this.pack(path.join(path.dirname(t.path), path.basename(t.path, '.js')));
        }
    }

    parser.bind(this)(tree);
};

headMaster.prototype.output = function (packageName, content) {
    fs.writeFileSync(this.mkFile(path.join(this.options.outputDir, packageName + '.js')), new Buffer(content));
};

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
    return $T(this.getTpl('requirePartWrapper'), {
        CONTENT: this.indentCharacter(content)
    });
};

headMaster.prototype.gather = function () {

    var s = [];
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
            CONTENT: this.indentCharacter(s.join(',\n'))
        });
    }

    return s;
};

headMaster.prototype.packageWalker = function (packageName) {
    if (packageName in this.sourceTree) {
        this.sourceTree[packageName].deps.forEach(this.packageWalker.bind(this));
    } else {
        this.dependWalker(packageName, fs.readFileSync(this.packageRealPath(packageName)).toString());
    }
    // add to depend list
    this.dependList.indexOf(packageName) < 0 && this.dependList.push(packageName);
};

headMaster.prototype.dependWalker = function (packageName, content) {
    this.sourceTree[packageName] = {deps: []};
    this.sourceTree[packageName].contents = this.stripComments(content)
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
};