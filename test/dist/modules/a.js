(function (global, factory) {
    if (typeof define === 'function' && define['amd']) {
        define(function () {
            return factory(global);
        });
    } else if (typeof require === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports) {
        module.exports = factory(global);
    } else if (true) {
        global['modules_a'] = global['modules_a'] || factory(global);
    }
})(this || window, function (global) {

    var lib_dep_1_dep, lib_dep_1, modules_a;

    lib_dep_1_dep = (function () {
    
        var module = {exports: {}}, exports = module.exports;
    
        module.exports = function () {
        
            console.log('dep_1_dep');
        
        }
    
        return module.exports;
    
    })();
    
    lib_dep_1 = (function (lib_dep_1_dep) {
    
        var module = {exports: {}}, exports = module.exports;
    
        exports.AAA = function () {
        
            console.log('dep_1');
        
        };
        
        exports.AAA_DEP = lib_dep_1_dep;
    
        return module.exports;
    
    })(lib_dep_1_dep);
    
    modules_a = (function (lib_dep_1) {
    
        var module = {exports: {}}, exports = module.exports;
    
        var d = lib_dep_1;
        
        module.exports = d;
    
        return module.exports;
    
    })(lib_dep_1);

    return modules_a;

});