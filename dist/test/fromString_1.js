(function (global, factory) {
	if (typeof define === 'function' && define['amd']) {
		define(function () {
			return factory(global);
		});
	} else if (typeof require === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports) {
		module.exports = factory(global);
	} else if (true) {
		global['test_fromString_1'] = global['test_fromString_1'] || factory(global);
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
		return require('ZXAIkybvWAdXsWxjigXI');
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
		'modules/c': function (require, exports, module) {
		
			exports.a = require('modules/a');
			
			exports.dep_1 = require('lib/dep_1');
		
		},
		'ZXAIkybvWAdXsWxjigXI': function (require, exports, module) {
		
			module.exports = {
			
			    a: require('modules/a'),
			
			    b: require('modules/b'),
			
			    c: require('modules/c')
			
			};
		
		}
	});
});