module.exports = function (data) {
    return '\
\'' + data.NAME + '\': function (require, exports, module) {\n\n\
\t' + data.CONTENT + '\n\n\
}';
};