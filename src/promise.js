function Promise(value) {
	this.value = undefined
	this.deferreds = []
	if (arguments.length > 0) {
		this.fulfill(value)
	}
}

Promise.prototype.isFulfilled = false
Promise.prototype.isRejected = false

Promise.prototype.then = function (onFulfill, onReject) {
	var promise = new Promise,
	    deferred = defer(promise, onFulfill, onReject)

	if (this.isFulfilled || this.isRejected) {
		resolve(deferred, this.isFulfilled ? Promise.SUCCESS : Promise.FAILURE, this.value)
	} else {
		this.deferreds.push(deferred)
	}

	return promise
}

Promise.prototype['catch'] = function (onReject) {
	return this.then(null, onReject)
}

Promise.prototype['throw'] = function() {
	return this['catch'](function (error) {
		next(function () {
			throw error
		})
	})
}

Promise.prototype.fulfill = function (value) {
	if (this.isFulfilled || this.isRejected) return
	var isResolved = false
	try {
		if (value === this) throw new TypeError('Can\'t resolve a promise with itself.')
		if (isObject(value) || isFunction(value)) {
			var then = value.then,
			    self = this
			if (isFunction(then)) {
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
				return
			}
		}
		this.isFulfilled = true
		this.complete(value)
	} catch (e) {
		if (!isResolved) {
			this.reject(e)
		}
	}
}

Promise.prototype.reject = function (error) {
	if (this.isFulfilled || this.isRejected) return
	this.isRejected = true
	this.complete(error)
}

Promise.prototype.complete = function (value) {
	this.value = value
	var type = this.isFulfilled ? Promise.SUCCESS : Promise.FAILURE
	for (var i = 0; i < this.deferreds.length; ++i) {
		resolve(this.deferreds[i], type, value)
	}
	this.deferreds = undefined
}

Promise.SUCCESS = 'fulfill'
Promise.FAILURE = 'reject'

function resolve(deferred, type, value) {
	var fn = deferred[type],
	    promise = deferred.promise
	if (isFunction(fn)) {
		next(function () {
			try {
				value = fn(value)
				promise.fulfill(value)
			} catch (e) {
				promise.reject(e)
			}
		})
	} else {
		promise[type](value)
	}
}

function defer(promise, fulfill, reject) {
	return {
		promise: promise,
		fulfill: fulfill,
		reject: reject
	}
}
