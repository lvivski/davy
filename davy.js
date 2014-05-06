(function(global) {
  "use strict";
  var next;
  if (typeof define === "function" && define.amd) {
    define([ "subsequent" ], function(subsequent) {
      next = subsequent;
      return Promise;
    });
  } else if (typeof module === "object" && module.exports) {
    module.exports = Promise;
    next = require("subsequent");
  } else {
    global.Davy = Promise;
    next = global.subsequent;
  }
  function Promise(fn) {
    this.value = undefined;
    this.deferreds = [];
    if (arguments.length > 0) {
      var resolver = new Resolver(this);
      if (typeof fn == "function") {
        try {
          fn(function(val) {
            resolver.fulfill(val);
          }, function(err) {
            resolver.reject(err);
          });
        } catch (e) {
          resolver.reject(e);
        }
      } else {
        resolver.fulfill(fn);
      }
    }
  }
  Promise.prototype.isFulfilled = false;
  Promise.prototype.isRejected = false;
  Promise.prototype.then = function(onFulfill, onReject) {
    var resolver = new Resolver(new Promise()), deferred = defer(resolver, onFulfill, onReject);
    if (this.isFulfilled || this.isRejected) {
      resolve(deferred, this.isFulfilled ? Promise.SUCCESS : Promise.FAILURE, this.value);
    } else {
      this.deferreds.push(deferred);
    }
    return resolver.promise;
  };
  Promise.SUCCESS = "fulfill";
  Promise.FAILURE = "reject";
  function defer(resolver, fulfill, reject) {
    return {
      resolver: resolver,
      fulfill: fulfill,
      reject: reject
    };
  }
  function Resolver(promise) {
    this.promise = promise;
  }
  Resolver.prototype.fulfill = function(value) {
    var promise = this.promise;
    if (promise.isFulfilled || promise.isRejected) return;
    if (value === promise) throw new TypeError("Can't resolve a promise with itself.");
    if (isObject(value) || isFunction(value)) {
      var then;
      try {
        then = value.then;
      } catch (e) {
        this.reject(e);
        return;
      }
      if (isFunction(then)) {
        var isResolved = false, self = this;
        try {
          then.call(value, function(val) {
            if (!isResolved) {
              isResolved = true;
              self.fulfill(val);
            }
          }, function(err) {
            if (!isResolved) {
              isResolved = true;
              self.reject(err);
            }
          });
        } catch (e) {
          if (!isResolved) {
            this.reject(e);
          }
        }
        return;
      }
    }
    promise.isFulfilled = true;
    this.complete(value);
  };
  Resolver.prototype.reject = function(error) {
    var promise = this.promise;
    if (promise.isFulfilled || promise.isRejected) return;
    promise.isRejected = true;
    this.complete(error);
  };
  Resolver.prototype.complete = function(value) {
    var promise = this.promise, deferreds = promise.deferreds, type = promise.isFulfilled ? Promise.SUCCESS : Promise.FAILURE;
    promise.value = value;
    for (var i = 0; i < deferreds.length; ++i) {
      resolve(deferreds[i], type, value);
    }
    promise.deferreds = undefined;
  };
  function resolve(deferred, type, value) {
    var fn = deferred[type], resolver = deferred.resolver;
    if (isFunction(fn)) {
      next(function() {
        try {
          value = fn(value);
          resolver.fulfill(value);
        } catch (e) {
          resolver.reject(e);
        }
      });
    } else {
      resolver[type](value);
    }
  }
  Promise.prototype["catch"] = function(onRejected) {
    return this.then(null, onRejected);
  };
  Promise.prototype["throw"] = function() {
    return this["catch"](function(error) {
      next(function() {
        throw error;
      });
    });
  };
  Promise.prototype["finally"] = function(onResolved) {
    return this.then(onResolved, onResolved);
  };
  Promise.prototype["yield"] = function(value) {
    return this.then(function() {
      return value;
    });
  };
  Promise.prototype.tap = function(onFulfilled) {
    return this.then(onFulfilled)["yield"](this);
  };
  Promise.prototype.spread = function(onFulfilled, onRejected) {
    return this.then(function(val) {
      return onFulfilled.apply(this, val);
    }, onRejected);
  };
  Promise.resolve = Promise.cast = function(val) {
    if (isObject(val) && isFunction(val.then)) {
      return val;
    }
    return new Promise(val);
  };
  Promise.reject = function(err) {
    var resolver = new Resolver();
    resolver.reject(err);
    return resolve.promise;
  };
  Promise.defer = function() {
    return new Resolver(new Promise());
  };
  Promise.each = function(list, iterator) {
    var resolver = Promise.defer(), len = list.length;
    if (len === 0) resolver.reject(TypeError());
    for (var i = 0; i < len; ++i) {
      iterator(list[i], i);
    }
    return resolver;
  };
  Promise.all = function() {
    var list = parse(arguments), length = list.length, resolver = Promise.each(list, resolve);
    return resolver.promise;
    function reject(err) {
      resolver.reject(err);
    }
    function resolve(value, i) {
      if (isObject(value) && isFunction(value.then)) {
        value.then(function(val) {
          resolve(val, i);
        }, reject);
        return;
      }
      list[i] = value;
      if (--length === 0) {
        resolver.fulfill(list);
      }
    }
  };
  Promise.race = function() {
    var list = parse(arguments), resolver = Promise.each(list, resolve);
    return resolver.promise;
    function reject(err) {
      resolver.reject(err);
    }
    function resolve(value) {
      if (isObject(value) && isFunction(value.then)) {
        value.then(resolve, reject);
        return;
      }
      resolver.fulfill(value);
    }
  };
  Promise.wrap = function(fn) {
    return function() {
      var resolver = new Resolver(new Promise());
      arguments[arguments.length++] = function(err, val) {
        if (err) {
          resolver.reject(err);
        } else {
          resolver.fulfill(val);
        }
      };
      fn.apply(this, arguments);
      return resolver.promise;
    };
  };
  function isObject(obj) {
    return obj && typeof obj === "object";
  }
  function isFunction(fn) {
    return fn && typeof fn === "function";
  }
  function parse(args) {
    return args.length === 1 && Array.isArray(args[0]) ? args[0] : [].slice.call(args);
  }
})(this);