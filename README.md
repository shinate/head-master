# head-master

## What is it?

Tooooo late, and very tired o(╯□╰)o

## Instantiation

```bash
npm install head-master
```

## Usage

```javascript
var headMaster = require('head-master');

// Instantiation and set options
var HM = new headMaster(options);


/**
 * Pack one package(file) or from text content
 *
 * @param {string} source
 * @param {string} namespace
 * @param {object} opts
 * @returns {string}
 * @public
 */
HM.pack(source [, namespace] [, options]);

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
HM.packBundle(source [, namespace] [, options]);

/**
 * Pack all 'js' file ty themself dependencies from options.baseDir.
 * Output to options.outputDir, will keep directory tree structure.
 *
 * !! File system dependency, used for cli mode
 *
 * @param {object} opts
 * @public
 */
HM.packIsolated([options]);

```

### Options

comming soon ...

## cli

### Global installation
```bash
sudo npm install -g head-master
```

```bash
hm source_dir output_dir
```

### Parameter
```bash
hm -h
```