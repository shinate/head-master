module.exports = function (data) {
    return 'if (typeof define === \'function\' && define[\'amd\']) {\n\
    define(function () {\n\
        return factory(global);\n\
    });\n\
}';
};