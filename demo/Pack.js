var headMaster = require('../lib/headMaster');

var config = {
    base: 'demo/js',
    outputDir: 'dist',
    camelCase: true,
    uglify: false,
    variablify: false
};

headMaster.pack('module.exports = {\n\
    a: require(\'modules/a\'),\n\
    b: require(\'modules/b\'),\n\
    c: require(\'modules/c\')\n\
};', 'test/fromString_1', config);

headMaster.pack('module.exports = {\n\
    b: require(\'modules/a\')\n\
};', 'test/fromString_2', config);