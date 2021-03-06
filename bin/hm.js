#!/usr/bin/env node

var headMaster = require('../lib/headMaster');
var yargs = require('yargs');
var util = require('util');
var fs = require('fs')

var ARGS = yargs
    .usage('\
========================================\n\
========================================\n\
========================================\n\
========================================\n\
\n\
$0 sourceDir outputDir [options]')
    .describe('source', 'Source dir')
    .describe('output', 'Output dir')
    .describe('uglify', 'Uglify code')
    .describe('type', 'Type of wrapper header (1: Global, 2: Commonjs, 4: AMD), 7:UMD(4+2+1), Default:0')
    .describe('package', 'Package name, relative to the source dir')
    .describe('namespace', 'Global namespace of package')
    .describe('variablify', 'Remove all require, use variables')

    .alias('s', 'source')
    .alias('o', 'output')
    .alias('u', 'uglify')
    .alias('t', 'type')
    .alias('p', 'package')
    .alias('n', 'namespace')
    .alias('v', 'variablify')

    .string('source')
    .string('output')
    .string('box')
    .string('type')
    .string('package')
    .string('namespace')

    .boolean('variablify')
    .boolean('uglify')
    .boolean('instvar')

    .wrap(80)

    .argv;

if (ARGS.h || ARGS.help) {
    console.log(yargs.help());
    process.exit(0);
}

try {
    ARGS = parseParam(ARGS);
} catch (e) {
    console.error(e);
    process.exit(0);
}


function parseParam(args) {
    var r = {};
    args.source = args.source || args._[0] || undefined;
    args.output = args.output || args._[1] || undefined;

    // baseDir
    if (!util.isString(args.source))
        throw new Error('Parameters "source" is required');
    if (!fs.existsSync(args.source) || !fs.statSync(args.source).isDirectory())
        throw new Error(util.format('"%s" does not exist or is not a directory', args.source));
    r.baseDir = args.source;

    // outputDir
    if (!util.isString(args.output))
        throw new Error('Parameters "output" is required');
    r.outputDir = args.output;


    r.uglify = args.uglify == null ? true : Boolean(args.uglify);

    r.package = args.package;

    r.namespace = args.namespace;

    r.variablify = args.variablify;

    r.type = parseInt(args.type);

    r.tab = '    ';

    // console.log(args, r);

    return r;
};

var HM = new headMaster(ARGS);

if (ARGS.package) {
    // one package
    HM.pack(ARGS.package, ARGS.namespace);

    // more package
    // TODO to be optimized
    // HM.packBundle(ARGS.package, , ARGS.namespace);
} else {
    HM.packIsolated();
}