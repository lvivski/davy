var Promise = require('../')

var promiseTree = Promise.resolve({
	a: Promise.resolve({
		b: Promise.resolve({
			c: new Promise(function (res, err) {
                setTimeout(function () {
                    res(1)
                }, 5000)
            }),
			d: 2
		}),
		e: 3
	}),
	f: Promise.all(
        Promise.resolve(
            new Promise(function (res, err) {
                setTimeout(function () {
                    res(4)
                }, 5000)
            })
        ), 
        Promise.resolve(5), 
        Promise.resolve(6)
    ),
	g: 7,
	h: {},
	i: [Promise.resolve(8), Promise.resolve(9), {}, [], 10]
})
var time = Date.now();
Promise.unwrap(promiseTree, ['a', 'b', 'c']).then(function (data) {
	console.log(data)
    console.log('a.b.c', Date.now() - time)
});

Promise.unwrap(promiseTree, ['g']).then(function (data) {
	console.log(data)
    console.log('g', Date.now() - time)
});

Promise.unwrap(promiseTree).then(function (data) {
	console.log(data)
    console.log('all', Date.now() - time)
});

