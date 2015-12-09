var headMaster = require('../lib/headMaster');

var HM = new headMaster({
    baseDir: 'demo/js',
    tab: '    ',
    uglify: false,
    type: 0
});

console.log(HM.packBundle(['modules/a','modules/b'], 'XXX'));
//console.log(HM.packBundle({
//    'a': 'modules/a',
//    'dep': './lib/dep_2'
//}));