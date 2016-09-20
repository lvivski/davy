Promise.prototype.progress = function (onProgress) {
	return this.then(null, null, onProgress)
}

Promise.prototype['catch'] = function (onRejected) {
	return this.then(null, onRejected)
}

Promise.prototype['throw'] = function () {
	return this['catch'](function (error) {
		nextTick(function () {
			throw error
		})
	})
}

Promise.prototype['finally'] = function (onResolved) {
	return this.then(onResolved, onResolved)
}

Promise.prototype['yield'] = function (value) {
	return this.then(function () {
		return value
	})
}

Promise.prototype.tap = function (onFulfilled) {
	return this.then(onFulfilled)['yield'](this)
}

Promise.prototype.spread = function (onFulfilled, onRejected) {
	return this.then(
		function (val) {
			return onFulfilled.apply(this, val)
		},
		onRejected)
}

Promise.resolve = Promise.cast = function (val) {
	if (isLikePromise(val)) {
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

	if (len === 0) resolver.fulfill(TypeError())

	var i = 0
	while (i < len) {
		iterator(list[i], i++)
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
		if (isLikePromise(value)) {
			value.then(function (val) {
				resolve(val, i)
			}, reject)
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
		if (isLikePromise(value)) {
			value.then(resolve, reject)
			return
		}
		resolver.fulfill(value)
	}
}

Promise.wrap = function (fn) {
	return function () {
		var len = arguments.length,
		    i = 0,
		    args = new Array(len + 1),
		    resolver = Promise.defer()

		while (i < len) {
			args[i] = arguments[i++]
		}

		args[len] = function (err, val) {
			if (err) {
				resolver.reject(err)
			} else {
				resolver.fulfill(val)
			}
		}
		fn.apply(this, args)

		return resolver.promise
	}
}

Promise.unwrap = function (tree, path) {
	function visit(node, depth) {
		return Promise.resolve(node).then(function (node) {
			if (!isObject(node) || isEmpty(node)) {
				return node
			}
			var isArray = Array.isArray(node),
			    result = isArray ? [] : {},
			    promises = Object.keys(node).map(function (key) {
			    	if (path && path[depth] !== key) {
			    		return Promise.resolve()
			    	}
			    	var value = node[key]
			    	if (isArray) {
			    		key = result.length
			    	}
			    	result[key] = null
			    	return visit(value, depth +1)
			    		.then(function (unwrapped) {
			    			result[key] = unwrapped
			    		})
			    })

			return Promise.all(promises).yield(result)
		})
	}

	return visit(tree, 0)
}
