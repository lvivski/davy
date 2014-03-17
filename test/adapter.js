var Promise = require('../')

exports.deferred = function () {
	var p = new Promise
	return {
		promise: p,
		resolve: function (val) { p.fulfill(val) },
		reject: function (val) { p.reject(val) }
	}
}
