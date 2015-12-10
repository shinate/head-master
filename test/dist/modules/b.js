(function (global, factory) {
    if (true) {
        global['modules_b'] = global['modules_b'] || factory(global);
    }
})(this || window, function (global) {

    var lib_dep_2, modules_b;

    lib_dep_2 = (function () {
    
        var module = {exports: {}}, exports = module.exports;
    
        exports.BBB = function () {
        
            console.log('dep_2');
        
        };
    
        return module.exports;
    
    })();
    
    modules_b = (function (lib_dep_2) {
    
        var module = {exports: {}}, exports = module.exports;
    
        var d = lib_dep_2;
        
        module.exports = function () {
        
            return d;
        
        }
    
        return module.exports;
    
    })(lib_dep_2);

    return modules_b;

});