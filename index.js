var headMaster = require('./lib/headMaster')

var HM = new headMaster({
    baseDir: 'test/js',
    tab: '    ',
    uglify: false
});

console.log(HM.pack('module.exports = {c:require(\'modules/c\')};'));