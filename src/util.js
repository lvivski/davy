function isObject(obj) {
	return obj && typeof obj === 'object'
}

function isFunction(fn) {
	return fn && typeof fn === 'function'
}

function parse(obj) {
	if  (obj.length === 1 && Array.isArray(obj[0])) {
		return obj[0]
	} else {
		var args = new Array(obj.length)
		for(var i = 0; i < args.length; ++i) {
			args[i] = obj[i]
		}
		return args
	}
}
