var headMaster = require('../lib/headMaster')

var HM = new headMaster({
    baseDir: 'demo/js',
    tab: '    ',
    uglify: false,
    type: 7
});

var content = 'module.exports = {\
    c: require(\'modules/a\')\
};'

console.log(HM.pack(content));
console.log(HM.pack(content, 'a'));
console.log(HM.pack(content, 'b', {type: 1}));