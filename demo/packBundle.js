var headMaster = require('../lib/headMaster');

var HM = new headMaster({
    sourceDir: 'demo/js',
    tab: '    ',
    uglify: false,
    type: 0
});

console.log(HM.packFromFile('modules/a'));