module.exports = function (template, data) {
    return template.replace(/#\{(.+?)\}/ig, function () {
        var key = arguments[1].replace(/\s/ig, '');
        var ret = arguments[0];
        var list = key.split('||');
        for (var i = 0, len = list.length; i < len; i++) {
            if (typeof data === 'object' && data[list[i]] !== undefined) {
                ret = data[list[i]];
                break;
            } else if (/^default:.*$/.test(list[i])) {
                ret = list[i].replace(/^default:/, '');
                break;
            }
        }
        return ret;
    });
};
