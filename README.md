# head-master

![HeadMaster](https://raw.githubusercontent.com/shinate/head-master/master/thumbnails/logo-512.png)

## What is it?

Just a Bundler

## Usage in nodejs script

### Instantiation

```bash
npm install head-master
```

### Native

```javascript
var HeadMaster = require('head-master');

// {HeadMaster instance} HeadMaster.pack({string}content \[, {string}namespace\] \[, {object}options\]);
HeadMaster.pack(content, namespace, options)

// And then, you may use many output methods
.toString() === {string} to string
.toBuffer() === {buffer} to buffer instance
.toFile() === {*} to string and write as a file
.toStream() === {file} to file instance
```

**TODO: The first parameter will support multi-state. content, src, path(file/dir)**

### options

- base {string} The input path, must be set. default: null
- contents {string} inputs contents. default: null
- package {string} inputs package names(entrance name when packing). It will be assigned a random string when no setting, if the "contents" has been set, this invalid. default: null
- namespace {string} Global namespace(output path). If not otherwise specified, will inherit "package". default: null
- table {string} Indent character. default: '\t'.
- mainfile {string} mainfile path. **TODO**
- uglify {boolean} Whether uglify compile, default: false. **TODO** will support uglify configuration inputs.
- type {integer} Output header type. values: 0~7, default: 0
    - 0 No header
    - 1 Global
    - 2 Common js
    - 4 AMD
- variablify {boolean} Reference assembling converted to variable declaration, When enabled, better efficiency but fat. default: false.
- camelCase {boolean} This will be effective when "variablify" enabled, Use underScoreCase OR camelCase naming convention to convert. It provides solutions for different file naming, if you use the name in two ways, God bless you ╮(╯▽╰)╭. default: false.

### Gulp OR stream pipes

```javascript
var HeadMaster = require('head-master');

gulp.src(['./js/**/*.js'])
    .pipe(HeadMaster.map(options))
    .pipe(gulp.dest('./dist'));
```

### options

- bundle {string} special in stream mode. values: 'tree', 'map', 'relax'

*Others will inherit the default parameters, base is no need to set*

## Usage in command line

### Global installation

```bash
sudo npm install -g head-master
```

### Command calls

```bash
hm source output_dir options
```

### Options
```bash
hm -h
```

## Advanced usage

```javascript
var HeadMaster = require('head-master');
```

```javascript
new HeadMaster(options).pack();
```

```javascript
new HeadMaster(options) // Initialization
    .crawl()            // Analysis, dependency
    .organize()         // Packaging
    .header()           // Add header
    .uglify()           // Compile compression
    .to[Any]()          // Output AND Returns

// .paramParse() can be used every where, adjust the rear of the parameters from the current
```