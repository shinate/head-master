(function (factory) {
    var component = {};
    var require = function (key) {
        if (!component[key]) {
            var module = {exports: {}};
            factory[key].call(module.exports, require, module.exports, module);
            component[key] = module.exports;
        }
        return component[key];
    };
    return require('#{NAME}');
})({
    #{CONTENT}
})