function Promise(fn) {
	this.value = undefined
	this.__deferreds__ = []

	if (arguments.length > 0) {
		if (isFunction(fn)) {
			Resolver.resolve(this, fn)
		} else {
			throw new TypeError('Promise constructor\'s argument is not a function')
		}
	}
}

Promise.prototype.isFulfilled = false
Promise.prototype.isRejected = false

Promise.prototype.then = function (onFulfilled, onRejected) {
	var promise = new Promise(),
		deferred = new Deferred(promise, onFulfilled, onRejected)

	if (this.isFulfilled || this.isRejected) {
		Resolver.handle(this, deferred)
	} else {
		this.__deferreds__.push(deferred)
	}

	return promise
}

function Deferred(promise, onFulfilled, onRejected) {
	return {
		fulfill: onFulfilled,
		reject: onRejected,
		promise: promise
	}
}
