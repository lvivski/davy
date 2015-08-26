var nextTick
if (typeof define === 'function' && define.amd) {
	define(['subsequent'], function (subsequent) {
		nextTick = subsequent
		return Promise
	})
} else if (typeof module === 'object' && module.exports) {
	module.exports = Promise
	nextTick = require('subsequent')
} else {
	root.Davy = Promise
	nextTick = root.subsequent
}
