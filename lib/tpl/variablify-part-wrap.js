module.exports = function (data) {
    return data.NAME + ' = (function (' + data.DEPENDS + ') {\
\
    var module = {exports: {}}, exports = module.exports;\
\
    ' + data.CONTENT + '\
\
    return module.exports;\
\
})(#{DEPENDS});';
};