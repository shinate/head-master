exports.AAA = function () {
    console.log('dep_1');
};

exports.AAA_DEP = require('./dep_1_dep');