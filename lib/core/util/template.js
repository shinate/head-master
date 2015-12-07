module.exports = function (template, data) {
    return template.replace(/#\{(.+?)\}/ig, function () {
        var key = arguments[1].replace(/\s/ig, '');
        var ret = arguments[0];
        var list = key.split('||');
        for (var i = 0, len = list.length; i < len; i += 1) {
            if (/^default:.*$/.test(list[i])) {
                ret = list[i].replace(/^default:/, '');
                break;
            }
            else if (data[list[i]] !== undefined) {
                ret = data[list[i]];
                break;
            }
        }
        return ret;
    });
};
