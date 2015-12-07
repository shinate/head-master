var hasProp = require('./hasProp');

module.exports = function () {
    var args = Array.prototype.slice.call(arguments);
    if (args.length === 0) {
        return {};
    }
    else if (args.length === 1) {
        return args[0];
    }
    else {
        var i, k, o = {}, source = args.shift();
        for (i = args.length - 1; i >= 0; i--) {
            args[i] = args[i] || {};
            for (k in args[i]) {
                if (!hasProp(o, k)) {
                    source[k] = args[i][k];
                    o[k] = null;
                }
            }
        }
        try {
            return source;
        }
        finally {
            args = i = k = o = source = null;
        }
    }
};
