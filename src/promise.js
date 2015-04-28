var DEFERREDS = '__deferreds' + Math.random() + '__'

function Promise(fn) {
	this.value = undefined
	this[DEFERREDS] = []

	if (arguments.length > 0) {
		var resolver = new Resolver(this)
		if (typeof fn == 'function') {
			try {
				fn(function (val) {
						resolver.fulfill(val)
					},
					function (err) {
						resolver.reject(err)
					},
					function (val) {
						resolver.notify(val)
					})
			} catch (e) {
				resolver.reject(e)
			}
		} else {
			resolver.fulfill(fn)
		}
	}
}

Object.defineProperty(Promise.prototype, DEFERREDS, {
	configurable: true,
	writable: true,
	value: undefined
})

Promise.prototype.isFulfilled = false
Promise.prototype.isRejected = false

Promise.prototype.then = function (onFulfill, onReject, onNotify) {
	var resolver = new Resolver(new Promise),
	    deferred = {
		    resolver: resolver,
		    fulfill: onFulfill,
		    reject: onReject,
		    notify: onNotify
	    }

	if (this.isFulfilled || this.isRejected) {
		Resolver.resolve([deferred], this.isFulfilled ? Resolver.SUCCESS : Resolver.FAILURE, this.value)
	} else {
		this[DEFERREDS].push(deferred)
	}

	return resolver.promise
}
