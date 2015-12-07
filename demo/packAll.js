var headMaster = require('../lib/headMaster');

var HM = new headMaster({
    baseDir: 'demo/js',
    tab: '    ',
    uglify: false,
    type: 0
});

// console.log(HM.packAll(['modules/a']));
console.log(HM.packAll({
    'a': 'modules/a',
    'dep': './lib/dep_2'
}));