var buf = require('buffer');
var Buffer = buf.Buffer;

module.exports = function (o) {
    return typeof o === 'object' && o instanceof Buffer;
};