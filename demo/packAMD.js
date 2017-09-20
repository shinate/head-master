var headMaster = require('../lib/headMaster');

var config = {
    base: 'demo/js',
    camelCase: true,
    uglify: false,
    variablify: false
};

headMaster.pack('module.exports = require(\'AMD/amd-test\')', 'XXX', config);