module.exports = function (data) {
    var CONTENT;
    if (data.hasOwnProperty('PACKAGES') && data.PACKAGES.length) {
        CONTENT = data.PACKAGES.map(function (item) {
            return '_r(\'' + item + '\', require(\'' + item + '\'));'
        }).join('\n');
    } else {
        CONTENT = data.CONTENT || '';
    }

    return '\n\
var _t = {};\n\
function _r(ns, package) {\n\
\tvar NSList = ns.split(/[\\\/]/);\n\
\tvar step = Bundle;\n\
\tvar k = null;\n\
\twhile (k = NSList.shift()) {\n\
\t\tif (NSList.length) {\n\
\t\t\tif (step[k] === undefined) {\n\
\t\t\t\tstep[k] = {};\n\
\t\t\t}\n\
\t\t\tstep = step[k];\n\
\t\t} else {\n\
\t\t\tif (step[k] === undefined) {\n\
\t\t\t\tstep[k] = package;\n\
\t\t\t\treturn true;\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
\treturn false;\n\
};\n\n\
' + CONTENT + '\n\
module.exports = _t;\n\
';

};