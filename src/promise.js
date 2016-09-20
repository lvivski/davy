function Promise(fn) {
	this.value = undefined
	this.__deferreds__ = []
	if (arguments.length > 0) {
		var resolver = new Resolver(this)
		if (typeof fn == 'function') {
			Resolver.resolve(fn, resolver)
		} else {
			resolver.fulfill(fn)
		}
	}
}

Promise.prototype.isFulfilled = false
Promise.prototype.isRejected = false

Promise.prototype.then = function (onFulfill, onReject, onNotify) {
	var resolver = Promise.defer(),
		deferred = {
			resolver: resolver,
			fulfill: onFulfill,
			reject: onReject,
			notify: onNotify
		}

	if (this.isFulfilled || this.isRejected || this.value) {
		Resolver.handle(this, [deferred])
	} else if (!this.value) {
		this.__deferreds__.push(deferred)
	}
	return resolver.promise
}
