(function (global, factory) {
    if (typeof define === 'function' && define['amd']) {
        define(function () {
            return factory(global);
        });
    } else if (typeof require === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports) {
        module.exports = factory(global);
    } else if (true) {
        global['modules_b'] = global['modules_b'] || factory(global);
    }
})(this || window, function (global) {
    return (function (factory) {
        var component = {};
        var require = function (key) {
            if (!component[key]) {
                var module = {exports: {}};
                factory[key].call(module.exports, require, module.exports, module);
                component[key] = module.exports;
            }
            return component[key];
        };
        return require('modules/b');
    })({
        'lib/dep_2': function (require, exports, module) {
            exports.BBB = function () {
            
                console.log('dep_2');
            
            };
        },
        'modules/b': function (require, exports, module) {
            var d = require('lib/dep_2');
            
            module.exports = function () {
            
                return d;
            
            }
        }
    });
});