Promise.prototype['catch'] = function (onRejected) {
	return this.then(null, onRejected)
}

Promise.prototype['throw'] = function () {
	return this['catch'](function (error) {
		next(function () {
			throw error
		})
	})
}

Promise.prototype['finally'] = function (onResolved) {
	return this.then(onResolved, onResolved)
}

Promise.prototype['yield'] = function (value) {
	return this.then(function() {
		return value
	})
}

Promise.prototype.tap = function (onFulfilled) {
	return this.then(onFulfilled)['yield'](this)
}

Promise.prototype.spread = function (onFulfilled, onRejected) {
	return this.then(
		function (val) {
			return onFulfilled.apply(this, val);
		},
		onRejected);
}

Promise.resolve = Promise.cast = function (val) {
	if (isObject(val) && isFunction(val.then)) {
		return val
	}
	return new Promise(val)
}

Promise.reject = function (err) {
	var promise = new Promise
	promise.reject(err)
	return promise
}

Promise.each = function (list, iterator) {
	var promise = new Promise,
		len = list.length

	if (len === 0) promise.reject(TypeError())

	for (var i = 0; i < len; ++i) {
		iterator(list[i], i)
	}

	return promise
}

Promise.all = function () {
	var list = parse(arguments),
		length = list.length,
		promise = Promise.each(list, resolve)

	return promise

	function reject(err) {
		promise.reject(err)
	}

	function resolve(value, i) {
		if (isObject(value) && isFunction(value.then)) {
			value.then(function (val) { resolve(val, i) }, reject)
			return
		}
		list[i] = value
		if (--length === 0) {
			promise.fulfill(list)
		}
	}
}

Promise.race = function () {
	var list = parse(arguments),
		promise = Promise.each(list, resolve)

	return promise

	function reject(err) {
		promise.reject(err)
	}

	function resolve(value) {
		if (isObject(value) && isFunction(value.then)) {
			value.then(resolve, reject)
			return
		}
		promise.fulfill(value)
	}
}

Promise.wrap = function (fn) {
	return function () {
		var promise = new Promise

		arguments[arguments.length++] = function(err, val) {
			if (err) {
				promise.reject(err)
			} else {
				promise.fulfill(val)
			}
		}
		fn.apply(this, arguments)

		return promise
	}
}
