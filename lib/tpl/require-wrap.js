module.exports = function (data) {
    return 'function (global) {\n\
    return (function (factory) {\n\
        var component = {};\n\
        var require = function (key) {\n\
            if (!component[key]) {\n\
                var module = {exports: {}};\n\
                factory[key].call(module.exports, require, module.exports, module);\n\
                component[key] = module.exports;\n\
            }\n\
            return component[key];\n\
        };\n\
        return require(\'' + (data.EXPORT) + '\');\n\
    })({\n\
        ' + (data.CONTENT) + '\n\
    });\n\
}';
};