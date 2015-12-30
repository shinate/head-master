module.exports = function (data) {
    return '\
function (global) {\n\
\treturn (function (factory) {\n\
\t\tvar component = {};\n\
\t\tvar require = function (key) {\n\
\t\t\tif (!component[key]) {\n\
\t\t\t\tvar module = {exports: {}};\n\
\t\t\t\tfactory[key].call(module.exports, require, module.exports, module);\n\
\t\t\t\tcomponent[key] = module.exports;\n\
\t\t\t}\n\
\t\t\treturn component[key];\n\
\t\t};\n\
\t\treturn require(\'' + (data.EXPORT) + '\');\n\
\t})({\n\
\t\t' + (data.CONTENT) + '\n\
\t});\n\
}';
};