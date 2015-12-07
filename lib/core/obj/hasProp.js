/**
 * hasOwnProperty
 */
module.exports = function (o, pro) {
    return Object.prototype.hasOwnProperty.call(o, pro);
};
