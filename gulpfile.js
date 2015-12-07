var gulp = require('gulp');
var through = require('through-gulp');
var jsonReader = require('json-config-reader');
var fs = require('fs');
var requirejs = require('requirejs');
var amdclean = require('amdclean');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('default', ['createWorkingbench', 'createPackageRule', 'buildPackage', 'output']);

// 准备素材
gulp.task('createWorkingbench', function () {
    return gulp.src('./test/js/**/*.js')
        .pipe(through(function (fileHandle, env, cb) {
            fileHandle.contents = new Buffer(
                'define(function(require, exports, module, define){\n\n' +
                fileHandle.contents.toString() +
                '\n\n});'
            );
            this.push(fileHandle)
            cb();
        }))
        .pipe(gulp.dest('./tmp'))
});

// 生成需求原始依赖
gulp.task('createPackageRule', ['createWorkingbench'], function (cb) {
    var config = jsonReader.read('./config.json');

    var packages = config.map(function (v) {
        var pkgn = v.split('/');
        return "        '" + pkgn.pop() + "': require('" + v + "')";
    });

    var content = '';
    content += 'define(function(require, exports, module){\n';
    content += '    module.exports = {\n' +
        packages.join(',\n')
        + '\n    };'
    content += '\n});';

    fs.writeFile('./tmp/package.js', new Buffer(content), function () {
        cb();
    });

});

// 创建完整包, 加UMD
gulp.task('buildPackage', ['createPackageRule'], function (cb) {
    requirejs.optimize({
        'findNestedDependencies': true,
        'baseUrl': './tmp',
        'name': 'package',
        'optimize': 'none',
        'mainConfigFile': './main.js',
        'out': './tmp/package.building.js',
        'onModuleBundleComplete': function (data) {
            fs.writeFile(data.path, amdclean.clean({
                'filePath': data.path,
                'prefixMode': 'camelCase',
                'wrap': {
                    'start': "\
                    (function(global, ns, factory){\
                    \n/* CommonJS */\
                    \nif (typeof require === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports)\
                    \nmodule.exports = factory(global);\
            \n/* AMD */\
            \nelse if (typeof define === 'function' && define['amd'])\
                \ndefine(function () {\
                    \nreturn factory(global);\
                \n});\
            \n/* Global */\
            \nelse\
                \nglobal[ns] = global[ns] || factory(global);\
                \n})(window, 'package', function(){",
                    'end': "\nreturn package;\n});"
                }
            }), function () {
                cb();
            });
        }
    });
});

// 输出
gulp.task('output', ['buildPackage'], function () {
    return gulp.src('./tmp/package.building.js')
        .pipe(rename('package.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));
});