var next
if (typeof define === 'function' && define.amd) {
	define(['subsequent'], function (subsequent) {
		next = subsequent
		return Promise
	})
} else if (typeof module === 'object' && module.exports) {
	module.exports = Promise
	next = require('subsequent')
} else {
	global.Davy = Promise
	next = global.subsequent
}
