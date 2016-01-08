/**
 * @param {array} pathes
 * @returns {string}
 * @example
 * sameBase([
 *     'base/lib/a',
 *     'base/lib/core/str/s.js',
 *     'base/lib/c/m.js'
 * ]);
 * ==>
 * 'base/lib'
 *
 * sameBase([
 *     'base/*.js'
 *     '/base/*.js'
 * ]);
 * ==>
 * ''
 */

var Path = require('path');

module.exports = function sameBase(pathes) {

    var n, i, ru;

    if (pathes.length > 1) {

        pathes.forEach(function (path) {
            n = Path.dirname(path.slice(0, path.indexOf('*'))).split(Path.sep);
            if (ru == null) {
                ru = n;
            } else {
                for (i = 0; i < ru.length; i++) {
                    if (ru[i] !== n[i]) {
                        ru.splice(i);
                        break;
                    }
                }
            }
        });

        ru = ru.join(Path.sep);

    } else {

        ru = Path.dirname(pathes[0].slice(0, pathes[0].indexOf('*')));

    }

    return ru;
};