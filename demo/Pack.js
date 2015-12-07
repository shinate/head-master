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

//console.log(HM.pack(content));
//console.log(HM.pack(content, 'a'));
console.log(HM.pack(content, 'customPack', {type: 1}));