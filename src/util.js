function isObject(obj) {
	return obj && typeof obj === 'object'
}

function isFunction(fn) {
	return fn && typeof fn === 'function'
}

function parse() {
	if  (arguments.length === 1 && Array.isArray(arguments[0])) {
		return arguments[0]
	} else {
		var args = new Array(arguments.length)
		for(var i = 0; i < args.length; ++i) {
			args[i] = arguments[i]
		}
		return args
	}
}
