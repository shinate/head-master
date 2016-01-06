module.exports = function (packages) {

    var CONTENT = '';

    if (packages != null && packages.length) {
        CONTENT = packages.map(function (item) {
            return 'require(\'' + item + '\');'
        }).join('\n');
    }

    return CONTENT;
};