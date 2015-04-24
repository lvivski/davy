<a href="http://promisesaplus.com/">
    <img src="http://promisesaplus.com/assets/logo-small.png" alt="Promises/A+ logo"
         title="Promises/A+ 1.0 compliant" align="right" />
</a>

# Davy Jones

Yet another [Promises/A+](http://promises-aplus.github.com/promises-spec) implementation optimized for speed and simplicity.

## API

####`new Davy(resolver)`
Create a new promise. The passed in function will receive functions `resolve` and `reject` as its arguments which can be called to seal the fate of the created promise.

####`.then(onFulfill, onReject)`
Returns a new promise chained from this promise. The new promise will be rejected or resolved defer on the passed `onFulfill`, `onReject` and the state of this promise.

####`.catch(handler)`
This is a catch-all exception handler, shortcut for calling `.then(null, handler)` on this promise. Any exception happening in a `.then`-chain will propagate to nearest `.catch` handler.

####`.catch(handler)`
This is a catch-all exception handler, shortcut for calling `.then(null, handler)` on this promise. Any exception happening in a `.then`-chain will propagate to nearest `.catch` handler.

####`.throw(handler)`
Like `.catch`, but any unhandled rejection that ends up here will be thrown as an error.

####`.finally(handler)`
Pass a handler that will be called regardless of this promise's fate. Returns a new promise chained from this promise.

####`.spread(onFulfill, onReject)`
Like calling .then, but the fulfillment value or rejection reason is assumed to be an array, which is flattened to the formal parameters of the handlers.

####`Davy.resolve(value)`
Returns a Promise object that is resolved with the given value. If the value is a thenable (i.e. has a then method), the returned promise will "follow" that thenable, adopting its eventual state; otherwise the returned promise will be fulfilled with the value.

####`Davy.reject(reason)`
Returns a Promise object that is rejected with the given reason.

####`Davy.defer()`
Create a promise with undecided fate and return a Resolver to control it.

####`Davy.all(iterable)`
Returns a promise that resolves when all of the promises in `iterable` have resolved. The result is passed an array of values from all the promises. If something passed in the `iterable` array is not a promise, it's converted to one by Promise.cast. If any of the passed in promises rejects, the all Promise immediately rejects with the value of the promise that rejected, discarding all the other promises whether or not they have resolved.

####`Davy.race(iterable)`
Returns a promise that either resolves when the first promise in the `iterable` resolves, or rejects when the first promise in the `iterable` rejects.

####`Davy.wrap(nodeFunction)`
Returns a function that will wrap the given `nodeFunction`. Instead of taking a callback, the returned function will return a promise whose fate is decided by the callback behavior of the given node function. The node function should conform to node.js convention of accepting a callback as last argument and calling that callback with error as the first argument and success value on the second argument.
