function isObject(obj) {
	return obj && typeof obj === 'object'
}

function isFunction(fn) {
	return fn && typeof fn === 'function'
}

Promise.all = function () {
	var args = [].slice.call(arguments.length === 1 && Array.isArray(arguments[0]) ?
	        arguments[0] :
	        arguments),
	    promise = new Promise,
	    remaining = args.length

	if (remaining === 0) promise.fulfill([])

	for (var i = 0; i < args.length; ++i) {
		resolve(i, args[i])
	}

	return promise

	function reject(err) {
		promise.reject(err)
	}

	function fulfill(val) {
		resolve(i, val)
	}

	function resolve(i, value) {
		if (isObject(value) && isFunction(value.then)) {
			value.then(fulfill, reject)
			return
		}
		args[i] = value
		if (--remaining === 0) {
			promise.fulfill(args)
		}
	}
}

Promise.wrap = function (fn) {
	return function () {
		var args = [].slice.call(arguments),
		    promise = new Promise

		args.push(function(err, val) {
			if (err) {
				promise.reject(err)
			} else {
				promise.fulfill(val)
			}
		})
		fn.apply(this, args)

		return promise
	}
}

Promise.prototype.back = function (callback) {
	return this.then(function (value) {
		callback(null, value)
	}, function (error) {
		callback(error)
	})
}