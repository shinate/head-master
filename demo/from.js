var headMaster = require('../lib/headMaster');

console.log(headMaster.fromSrc(['demo/js/modules/*.js'], {
    uglify: false,
    type: 7,
    variablify: true,
    bundle: 'tree'
}).pack().toFile('dist/a.js'));