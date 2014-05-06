var Promise = require('../')

exports.deferred = function () {
	var resolver = Promise.defer()
	return {
		promise: resolver.promise,
		resolve: function (val) { resolver.fulfill(val) },
		reject: function (err) { resolver.reject(err) }
	}
}
