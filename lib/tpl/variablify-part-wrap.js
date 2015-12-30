module.exports = function (data) {
    return data.NAME + ' = (function (' + data.DEPENDS + ') {\n\n\
    var module = {exports: {}}, exports = module.exports;\n\n\
    ' + data.CONTENT + '\n\n\
    return module.exports;\n\n\
})(' + data.DEPENDS + ');';
};