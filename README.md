# head-master

## What is it?

Tooooo late, and very tired o(╯□╰)o

## Easy for use

## Instantiation & method

```javascript
var headMaster = require('head-master');

// Instantiation and set options
var HM = new headMaster(options);

// Pack one package(file) or from text content
// @return {string}
HM.pack(source [, namespace] [, options]);

// Pack from config : Array/Object/JsonString
// To one namespace
// TODO package register
// @return {string}
HM.packBundle(config [, namespace] [, options]);

// Pack one package(file) or from text content
// Output to options.outputDir
HM.packOne(source [, namespace] [, options]);

// Pack all 'js' file ty themself dependencies from options.baseDir
// Output to options.outputDir, will keep directory tree structure
HM.packIsolated();

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