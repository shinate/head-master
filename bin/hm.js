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
    .describe('source', '1')
    .describe('output', '2')
    .describe('uglify', '3')
    .describe('instvar', '4')
    .describe('box', '5')
    .describe('type', '6')
    .describe('package', '7')

    .alias('s', 'source')
    .alias('o', 'output')
    .alias('b', 'box')
    .alias('i', 'instvar')
    .alias('u', 'uglify')
    .alias('t', 'type')
    .alias('p', 'package')

    .string('source')
    .string('output')
    .string('box')
    .string('uglify')
    .string('type')
    .string('package')

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
    console.log(args);
    if (!util.isString(args.source))
        throw new Error('Parameters "source" is required');
    if (!fs.existsSync(args.source) || !fs.statSync(args.source).isDirectory())
        throw new Error(util.format('"%s" does not exist or is not a directory', args.source));
    r.baseDir = args.source;

    if (!util.isString(args.output))
        throw new Error('Parameters "output" is required');
    r.outputDir = args.output;


    r.uglify = args.uglify;
    r.package = args.package;

    return r;
};

var HM = new headMaster(ARGS);

if (ARGS.package) {
    HM.packOne(ARGS.package);
} else {
    HM.packAll();
}