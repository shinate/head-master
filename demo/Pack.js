var headMaster = require('../lib/headMaster');

var HM = new headMaster({
    baseDir: 'demo/js',
    tab: '    ',
    uglify: false,
    type: 7
});

var content = 'module.exports = {\n\
    a: require(\'modules/a\'),\n\
    b: require(\'modules/b\')\n\
};'

console.log(HM.pack(content, 'XXX', {type: 1}));