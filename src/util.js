function isObject(obj) {
	return obj && typeof obj === 'object'
}

function isFunction(fn) {
	return fn && typeof fn === 'function'
}

function isEmpty(obj) {
	return Object.keys(obj).length === 0
}

function parse(obj) {
	if  (obj.length === 1 && Array.isArray(obj[0])) {
		return obj[0]
	} else {
		var args = new Array(obj.length),
		    i = 0
		while (i < args.length) {
			args[i] = obj[i++]
		}
		return args
	}
}
