module.exports = function (data) {
    return 'function (global) {\
\
        var ' + data.PACKAGES + ';\
\
        ' + data.CONTENT + '\
\
        return ' + data.EXPORT + ';\
\
    }';
};