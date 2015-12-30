module.exports = function (data) {
    return 'function (global) {\n\n\
    var ' + data.PACKAGES + ';\n\n\
    ' + data.CONTENT + '\n\n\
    return ' + data.EXPORT + ';\n\
}';
};