module.exports = function (data) {
    return '\
if (true) {\n\
\tglobal[\'' + data.NAME + '\'] = global[\'' + data.NAME + '\'] || factory(global);\n\
}';
};