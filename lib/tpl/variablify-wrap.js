module.exports = function (data) {
    return '\
function (global) {\n\n\
\tvar ' + data.PACKAGES + ';\n\n\
\t' + data.CONTENT + '\n\n\
\treturn ' + data.EXPORT + ';\n\
}';
};