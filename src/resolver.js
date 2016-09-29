function Resolver(promise) {
	this.promise = promise
}

Resolver.prototype.fulfill = function (value) {
	Resolver.fulfill(this.promise, value)
}
Resolver.prototype.reject = function (error) {
	Resolver.reject(this.promise, error)
}

Resolver.SUCCESS = 'fulfill'
Resolver.FAILURE = 'reject'

Resolver.fulfill = function (promise, value) {
	if (promise.isFulfilled || promise.isRejected) return

	if (value === promise) {
		Resolver.reject(promise, new TypeError('Can\'t resolve a promise with itself.'))
		return
	}

	if (isObject(value) || isFunction(value)) {
		var then
		try {
			then = value.then
		} catch (e) {
			Resolver.reject(promise, e)
			return
		}
		if (isFunction(then)) {
			Resolver.resolve(promise, then.bind(value))
			return
		}
	}

	promise.isFulfilled = true

	Resolver.complete(promise, value)
}

Resolver.reject = function (promise, error) {
	if (promise.isFulfilled || promise.isRejected) return

	promise.isRejected = true

	Resolver.complete(promise, error)
}

Resolver.complete = function (promise, value) {
	promise.value = value

	var deferreds = promise.__deferreds__
	if (!deferreds.length) return

	var i = 0
	while (i < deferreds.length) {
		Resolver.handle(promise, deferreds[i++])
	}

	promise.__deferreds__ = undefined
}

Resolver.handle = function (promise, deferred) {
	var type = promise.isFulfilled ? Resolver.SUCCESS : Resolver.FAILURE,
		fn = deferred[type],
		value = promise.value

	promise = deferred.promise

	nextTick(function () {
		if (isFunction(fn)) {
			var val
			try {
				val = fn(value)
			} catch (e) {
				Resolver.reject(promise, e)
				return
			}
			Resolver.fulfill(promise, val)
		} else {
			Resolver[type](promise, value)
		}
	})
}

Resolver.resolve = function (promise, fn) {
	var isPending = true
	try {
		fn(function (val) {
			if (isPending) {
				isPending = false
				Resolver.fulfill(promise, val)
			}
		},
		function (err) {
			if (isPending) {
				isPending = false
				Resolver.reject(promise, err)
			}
		})
	} catch (e) {
		if (isPending) {
			Resolver.reject(promise, e)
		}
	}
}
