module.exports = function (data) {
    return 'if (true) {\n\
    global[\'' + data.NAME + '\'] = global[\'' + data.NAME + '\'] || factory(global);\n\
}';
};