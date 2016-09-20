function Resolver(promise) {
	this.promise = promise
}

Resolver.SUCCESS = 'fulfill'
Resolver.FAILURE = 'reject'
Resolver.NOTIFY = 'notify'

Resolver.prototype.fulfill = function (value) {
	var promise = this.promise
	if (promise.isFulfilled || promise.isRejected) return
	if (value === promise) {
		this.reject(new TypeError('Can\'t resolve a promise with itself.'))
		return
	}
	if (isObject(value) || isFunction(value)) {
		var then
		try {
			then = value.then
		} catch (e) {
			this.reject(e)
			return
		}
		if (isFunction(then)) {
			Resolver.resolve(function (resolve, reject, notify) {
				value.then(resolve, reject, notify)
			}, this)
			return
		}
	}
	promise.isFulfilled = true
	Resolver.complete(promise, value)
}

Resolver.prototype.reject = function (error) {
	var promise = this.promise
	if (promise.isFulfilled || promise.isRejected) return
	promise.isRejected = true
	Resolver.complete(promise, error)
}

Resolver.prototype.notify = function (value) {
	var promise = this.promise
	if (promise.isFulfilled || promise.isRejected) return
	Resolver.complete(promise, value)
}

Resolver.complete = function (promise, value) {
	promise.value = value
	Resolver.handle(promise, promise.__deferreds__)
	if (promise.isFulfilled || promise.isRejected) {
		promise.__deferreds__ = undefined
	}
}

Resolver.handle = function (promise, deferreds) {
	if (!deferreds.length) return

	var type = promise.isFulfilled ?
			Resolver.SUCCESS :
			promise.isRejected ?
				Resolver.FAILURE :
				Resolver.NOTIFY,
		value = promise.value

	var i = 0
	while (i < deferreds.length) {
		Resolver.handleOne(deferreds[i++], type, value)
	}
}

Resolver.handleOne = function(deferred, type, value) {
	var fn = deferred[type],
		resolver = deferred.resolver
	nextTick(function () {
		if (isFunction(fn)) {
			var val
			try {
				val = fn(value)
			} catch (e) {
				resolver.reject(e)
				return
			}
			if (type === Resolver.NOTIFY) {
				resolver.notify(val)
			} else {
				resolver.fulfill(val)
			}
		} else {
			resolver[type](value)
		}
	})
}

Resolver.resolve = function (fn, resolver) {
	var isPending = true
	try {
		fn(function (val) {
			if (isPending) {
				isPending = false
				resolver.fulfill(val)
			}
		},
		function (err) {
			if (isPending) {
				isPending = false
				resolver.reject(err)
			}
		},
		function (val) {
			resolver.notify(val)
		})
	} catch (e) {
		if (isPending) {
			resolver.reject(e)
		}
	}
}
