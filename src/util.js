function isObject(obj) {
	return obj && typeof obj === 'object'
}

function isFunction(fn) {
	return fn && typeof fn === 'function'
}

function parse(args) {
	return [].slice.call(args.length === 1 && Array.isArray(args[0]) ?
		args[0] :
		args)
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
