function _R(ns, package) {
    ns.split('/').forEach(function (part) {
       console.log(part);

    });
}

_R('dist/1/2/3/4/5');