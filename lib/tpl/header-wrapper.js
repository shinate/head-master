module.exports = function (data) {
    return '\
(function (global, factory) {\n\
\t' + data.HEADER + '\n\
})(this || window, ' + data.CONTENT + ');';
};