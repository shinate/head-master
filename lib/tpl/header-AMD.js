module.exports = function (data) {
    return '\
if (typeof define === \'function\' && define[\'amd\']) {\n\
\tdefine(function () {\n\
\t\treturn factory(global);\n\
\t});\n\
}';
};