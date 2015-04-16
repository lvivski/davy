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
	var resolver = new Resolver(new Promise),
	    deferred = defer(resolver, onFulfill, onReject, onNotify)

	if (this.isFulfilled || this.isRejected) {
		resolve([deferred], this.isFulfilled ? Promise.SUCCESS : Promise.FAILURE, this.value)
	} else {
		this.__deferreds__.push(deferred)
	}

	return resolver.promise
}

Promise.SUCCESS = 'fulfill'
Promise.FAILURE = 'reject'
Promise.NOTIFY = 'notify'

function defer(resolver, fulfill, reject, notify) {
	return {
		resolver: resolver,
		fulfill: fulfill,
		reject: reject,
		notify: notify
	}
}
