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
			var isPending = true,
			    self = this
			try {
				then.call(
					value,
					function (val) {
						if (isPending) {
							isPending = false
							self.fulfill(val)
						}
					},
					function (err) {
						if (isPending) {
							isPending = false
							self.reject(err)
						}
					},
					function (val) {
						self.notify(val)
					})
			} catch (e) {
				if (isPending) {
					this.reject(e)
				}
			}
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
	var type = promise.isFulfilled ? Resolver.SUCCESS :
			   promise.isRejected ? Resolver.FAILURE :
			   Resolver.NOTIFY

	promise.value = value
	Resolver.handle(promise.__deferreds__, type, value)
	if (type !== Resolver.NOTIFY) {
		promise.__deferreds__ = undefined
	}
}

Resolver.handle = function (deferreds, type, value) {
	if (!deferreds.length) return

	nextTick(function () {
		var i = 0
		while (i < deferreds.length) {
			var deferred = deferreds[i++],
				fn = deferred[type],
				resolver = deferred.resolver
			if (isFunction(fn)) {
				var val
				try {
					val = fn(value)
				} catch (e) {
					resolver.reject(e)
					continue
				}
				if (type === Resolver.NOTIFY) {
					resolver.notify(val)
				} else {
					resolver.fulfill(val)
				}
			} else {
				resolver[type](value)
			}
		}
	})
}

