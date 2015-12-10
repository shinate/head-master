#{NAME} = #{GLOBAL||default:}(function (#{DEPENDS}) {

    var module = {exports: {}}, exports = module.exports;

    #{CONTENT}

    return module.exports;

})(#{DEPENDS});