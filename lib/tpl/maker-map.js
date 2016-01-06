module.exports = function (packages) {

    var CONTENT = '';

    if (packages != null && packages.length) {
        CONTENT = '\
module.exports = {\n\
\t' + packages.map(function (item) {
                return this.variablname(item) + ': require(\'' + item + '\')';
            }.bind(this)).join(',\n\t') + '\n\
};';
    }

    return CONTENT;
};