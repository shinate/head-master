var Bundle = {};

function register(ns, package) {
    var NSList = ns.split(/[\.\/]/);
    var step = Bundle;
    var k = null;
    while (k = NSList.shift()) {
        if (NSList.length) {
            if (step[k] === undefined) {
                step[k] = {};
            }
            step = step[k];
        } else {
            if (step[k] === undefined) {
                step[k] = package;//pkg
                return true;
            }
        }
    }
    return false;
};

module.esports = Bundle;