function isObject(obj) {
	return obj && typeof obj === 'object'
}

function isFunction(fn) {
	return fn && typeof fn === 'function'
}

function parse(args) {
	return args.length === 1 && Array.isArray(args[0]) ?
		args[0] :
		[].slice.call(args)
}
