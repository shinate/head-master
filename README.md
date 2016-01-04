# head-master

![HeadMaster](https://raw.githubusercontent.com/shinate/head-master/master/thumbnails/logo-512.png)

## What is it?

Just a Bundler

## Instantiation

```bash
npm install head-master
```

## Usage

### In nodejs script

```javascript
var HM = require('head-master');

// Instantiation and set options
{HeadMaster instance} HM.pack({string}content \[, {string}namespace\] \[, {object}options\]);

// Then, you may use many output methods
.toString() to string
.toBuffer() to buffer instance
.toFile() to string and write as a file
.toStream() to file instance
```

### In gulp OR stream

```javascript
var HM = require('head-master');

gulp.src(['./js/**/*.js'])
    .pipe(HM.map(options))
    .pipe(gulp.dest('./dist'));
```
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