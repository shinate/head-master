var headMaster = require('../lib/headMaster');

var HM = new headMaster({
    sourceDir: 'demo/js',
    tab: '    ',
    uglify: false,
    type: 7
});

var content = 'module.exports = {\n\
    a: require(\'modules/a\'),\n\
    b: require(\'modules/b\'),\n\
    c: require(\'modules/c\')\n\
};';

console.log(HM.pack(content));