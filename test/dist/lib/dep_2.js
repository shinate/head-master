(function (global, factory) {
    if (typeof define === 'function' && define['amd']) {
        define(function () {
            return factory(global);
        });
    } else if (typeof require === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports) {
        module.exports = factory(global);
    } else if (true) {
        global['lib_dep_2'] = global['lib_dep_2'] || factory(global);
    }
})(this || window, function (global) {

    var lib_dep_2;

    lib_dep_2 = (function () {
    
        var module = {exports: {}}, exports = module.exports;
    
        exports.BBB = function () {
        
            console.log('dep_2');
        
        };
    
        return module.exports;
    
    })();

    return lib_dep_2;

});