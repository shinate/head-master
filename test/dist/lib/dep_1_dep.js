(function (global, factory) {
    if (true) {
        global['lib_dep_1_dep'] = global['lib_dep_1_dep'] || factory(global);
    }
})(this || window, function (global) {

    var lib_dep_1_dep;

    lib_dep_1_dep = (function () {
    
        var module = {exports: {}}, exports = module.exports;
    
        module.exports = function () {
        
            console.log('dep_1_dep');
        
        }
    
        return module.exports;
    
    })();

    return lib_dep_1_dep;

});