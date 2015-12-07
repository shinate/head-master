(function (global, factory) {
    if (typeof define === 'function' && define['amd']) {
        define(function () {
            return factory;
        });
    } else if (typeof require === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports) {
        module.exports = factory;
    } else if (true) {
        global['customPack'] = factory;
    }
})(this || window, (function (factory) {
    var component = {};
    var require = function (key) {
        if (!component[key]) {
            var module = {exports: {}};
            factory[key].call(module.exports, require, module.exports, module);
            component[key] = module.exports;
        }
        return component[key];
    };
    return require('customPack');
})({
    'lib/dep_1_dep': function (require, exports, module) {
        module.exports = function () {
        
            console.log('dep_1_dep');
        
        }
    },
    'lib/dep_1': function (require, exports, module) {
        exports.AAA = function () {
        
            console.log('dep_1');
        
        };
        
        exports.AAA_DEP = require('lib/dep_1_dep');
    },
    'modules/a': function (require, exports, module) {
        var d = require('lib/dep_1');
        
        module.exports = d;
    },
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
    },
    'customPack': function (require, exports, module) {
        module.exports = {
        
            a: require('modules/a'),
        
            b: require('modules/b')
        
        };
    }
}));
