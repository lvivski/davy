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
	var resolver = Promise.defer()
	resolver.reject(err)
	return resolver.promise
}

Promise.defer = function () {
	return new Resolver(new Promise)
}

Promise.each = function (list, iterator) {
	var resolver = Promise.defer(),
		len = list.length

	if (len === 0) resolver.reject(TypeError())

	for (var i = 0; i < len; ++i) {
		iterator(list[i], i)
	}

	return resolver
}

Promise.all = function () {
	var list = parse(arguments),
		length = list.length,
		resolver = Promise.each(list, resolve)

	return resolver.promise

	function reject(err) {
		resolver.reject(err)
	}

	function resolve(value, i) {
		if (isObject(value) && isFunction(value.then)) {
			value.then(function (val) { resolve(val, i) }, reject)
			return
		}
		list[i] = value
		if (--length === 0) {
			resolver.fulfill(list)
		}
	}
}

Promise.race = function () {
	var list = parse(arguments),
		resolver = Promise.each(list, resolve)

	return resolver.promise

	function reject(err) {
		resolver.reject(err)
	}

	function resolve(value) {
		if (isObject(value) && isFunction(value.then)) {
			value.then(resolve, reject)
			return
		}
		resolver.fulfill(value)
	}
}

Promise.wrap = function (fn) {
	return function () {
		var resolver = new Resolver(new Promise)

		arguments[arguments.length++] = function(err, val) {
			if (err) {
				resolver.reject(err)
			} else {
				resolver.fulfill(val)
			}
		}
		fn.apply(this, arguments)

		return resolver.promise
	}
}
