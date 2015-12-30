module.exports = function (data) {
    return '(function (global, factory) {\n\
    ' + data.HEADER + '\n\
})(this || window, ' + data.CONTENT + ');';
};