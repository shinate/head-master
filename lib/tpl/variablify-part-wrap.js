module.exports = function (data) {
    return data.NAME + ' = (function (' + data.DEPENDS + ') {\n\n\
\tvar module = {exports: {}}, exports = module.exports;\n\n\
\t' + data.CONTENT + '\n\n\
\treturn module.exports;\n\n\
})(' + data.DEPENDS + ');';
};