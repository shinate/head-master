module.exports = function (data) {
    return '\
if (typeof require === \'function\' && typeof module === \'object\' && module && typeof exports === \'object\' && exports) {\n\
\tmodule.exports = factory(global);\n\
}';
};