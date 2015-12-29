module.exports = function (data) {
    return '\'' + data.NAME + '\': function (require, exports, module) {\n\n\
    ' + data.CONTENT + '\n\n\
}';
};