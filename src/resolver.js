function Resolver(promise) {
	this.promise = promise
}

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
			var isResolved = false,
				self = this
			try {
				then.call(
					value,
					function (val) {
						if (!isResolved) {
							isResolved = true
							self.fulfill(val)
						}
					},
					function (err) {
						if (!isResolved) {
							isResolved = true
							self.reject(err)
						}
					},
					function (val) {
						self.notify(val)
					})
			} catch (e) {
				if (!isResolved) {
					this.reject(e)
				}
			}
			return
		}
	}
	promise.isFulfilled = true
	this.complete(value)
}

Resolver.prototype.reject = function (error) {
	var promise = this.promise
	if (promise.isFulfilled || promise.isRejected) return
	promise.isRejected = true
	this.complete(error)
}

Resolver.prototype.notify = function (value) {
	var promise = this.promise
	if (promise.isFulfilled || promise.isRejected) return
	resolve(promise.__deferreds__, Promise.NOTIFY, value)
}

Resolver.prototype.complete = function (value) {
	var promise = this.promise,
		type = promise.isFulfilled ? Promise.SUCCESS : Promise.FAILURE

	promise.value = value
	resolve(promise.__deferreds__, type, value)
	promise.__deferreds__ = undefined
}

function resolve(deferreds, type, value) {
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
				if (type === Promise.NOTIFY) {
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

