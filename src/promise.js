function Promise(fn) {
	this.value = undefined
	this.deferreds = []

	if (arguments.length > 0) {
		var resolver = new Resolver(this)
		if (typeof fn == 'function') {
			try {
				fn(function (val) {
						resolver.fulfill(val)
					},
					function (err) {
						resolver.reject(err)
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

Promise.prototype.then = function (onFulfill, onReject) {
	var resolver = new Resolver(new Promise),
	    deferred = defer(resolver, onFulfill, onReject)

	if (this.isFulfilled || this.isRejected) {
		resolve(deferred, this.isFulfilled ? Promise.SUCCESS : Promise.FAILURE, this.value)
	} else {
		this.deferreds.push(deferred)
	}

	return resolver.promise
}

Promise.SUCCESS = 'fulfill'
Promise.FAILURE = 'reject'

function defer(resolver, fulfill, reject) {
	return {
		resolver: resolver,
		fulfill: fulfill,
		reject: reject
	}
}
