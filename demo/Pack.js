var headMaster = require('../lib/headMaster');

var HM = new headMaster({
    sourceDir: 'demo/js',
    tab: '    ',
    uglify: true,
    type: 7,
    variablify: true
});

var content = 'module.exports = {\n\
    a: require(\'modules/a\'),\n\
    b: require(\'modules/b\'),\n\
    c: require(\'modules/c\')\n\
};';

console.log(HM.pack(content, 'a').contents);