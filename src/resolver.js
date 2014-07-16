function Resolver(promise) {
	this.promise = promise
}

Resolver.prototype.fulfill = function (value) {
	var promise = this.promise
	if (promise.isFulfilled || promise.isRejected) return
	if (value === promise) throw new TypeError('Can\'t resolve a promise with itself.')
	if (isObject(value) || isFunction(value)) {
		var then
		try {
			then = value.then
		} catch(e) {
			this.reject(e)
			return
		}
		if (isFunction(then)) {
			var isResolved = false,
				self = this
			try {
				then.call(value, function (val) {
					if (!isResolved) {
						isResolved = true
						self.fulfill(val)
					}
				}, function (err) {
					if (!isResolved) {
						isResolved = true
						self.reject(err)
					}
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

Resolver.prototype.complete = function (value) {
	var promise = this.promise,
		deferreds = promise.__deferreds,
		type = promise.isFulfilled ? Promise.SUCCESS : Promise.FAILURE

	promise.value = value
	for (var i = 0; i < deferreds.length; ++i) {
		resolve(deferreds[i], type, value)
	}
	promise.__deferreds = undefined
}

function resolve(deferred, type, value) {
	var fn = deferred[type],
		resolver = deferred.resolver
	if (isFunction(fn)) {
		next(function () {
			try {
				value = fn(value)
				resolver.fulfill(value)
			} catch (e) {
				resolver.reject(e)
			}
		})
	} else {
		resolver[type](value)
	}
}

