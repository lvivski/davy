if (typeof define === 'function' && define.amd) {
	define(Promise)
} else if (typeof module === 'object' && module.exports) {
	module.exports = Promise
	var nextTick = require('subsequent')
} else {
	global.Davy = global.Promise = Promise
	var nextTick = global.nextTick
}