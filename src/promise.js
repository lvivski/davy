function Promise(fn) {
	this.value = undefined
	this.__deferreds__ = []
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

	if (this.isFulfilled || this.isRejected) {
		Resolver.handle([deferred], this.isFulfilled ? Resolver.SUCCESS : Resolver.FAILURE, this.value)
	} else {
		if (this.value) {
			Resolver.handle([deferred], Resolver.NOTIFY, this.value)
		}
		this.__deferreds__.push(deferred)
	}

	return resolver.promise
}
