(function(global) {
  "use strict";
  var nextTick;
  if (typeof define === "function" && define.amd) {
    define([ "subsequent" ], function(subsequent) {
      nextTick = subsequent;
      return Promise;
    });
  } else if (typeof module === "object" && module.exports) {
    module.exports = Promise;
    nextTick = require("subsequent");
  } else {
    global.Davy = Promise;
    nextTick = global.subsequent;
  }
  function Promise(fn) {
    this.value = undefined;
    this.__deferreds__ = [];
    if (arguments.length > 0) {
      var resolver = new Resolver(this);
      if (typeof fn == "function") {
        try {
          fn(function(val) {
            resolver.fulfill(val);
          }, function(err) {
            resolver.reject(err);
          }, function(val) {
            resolver.notify(val);
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
  Promise.prototype.then = function(onFulfill, onReject, onNotify) {
    var resolver = new Resolver(new Promise()), deferred = defer(resolver, onFulfill, onReject, onNotify);
    if (this.isFulfilled || this.isRejected) {
      resolve([ deferred ], this.isFulfilled ? Promise.SUCCESS : Promise.FAILURE, this.value);
    } else {
      this.__deferreds__.push(deferred);
    }
    return resolver.promise;
  };
  Promise.SUCCESS = "fulfill";
  Promise.FAILURE = "reject";
  Promise.NOTIFY = "notify";
  function defer(resolver, fulfill, reject, notify) {
    return {
      resolver: resolver,
      fulfill: fulfill,
      reject: reject,
      notify: notify
    };
  }
  function Resolver(promise) {
    this.promise = promise;
  }
  Resolver.prototype.fulfill = function(value) {
    var promise = this.promise;
    if (promise.isFulfilled || promise.isRejected) return;
    if (value === promise) {
      this.reject(new TypeError("Can't resolve a promise with itself."));
      return;
    }
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
          }, function(val) {
            self.notify(val);
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
  Resolver.prototype.notify = function(value) {
    var promise = this.promise;
    if (promise.isFulfilled || promise.isRejected) return;
    resolve(promise.__deferreds__, Promise.NOTIFY, value);
  };
  Resolver.prototype.complete = function(value) {
    var promise = this.promise, type = promise.isFulfilled ? Promise.SUCCESS : Promise.FAILURE;
    promise.value = value;
    resolve(promise.__deferreds__, type, value);
    promise.__deferreds__ = undefined;
  };
  function resolve(deferreds, type, value) {
    if (!deferreds.length) return;
    nextTick(function() {
      var i = 0;
      while (i < deferreds.length) {
        var deferred = deferreds[i++], fn = deferred[type], resolver = deferred.resolver;
        if (isFunction(fn)) {
          var val;
          try {
            val = fn(value);
          } catch (e) {
            resolver.reject(e);
            continue;
          }
          if (type === Promise.NOTIFY) {
            resolver.notify(val);
          } else {
            resolver.fulfill(val);
          }
        } else {
          resolver[type](value);
        }
      }
    });
  }
  Promise.prototype.progress = function(onProgress) {
    return this.then(null, null, onProgress);
  };
  Promise.prototype["catch"] = function(onRejected) {
    return this.then(null, onRejected);
  };
  Promise.prototype["throw"] = function() {
    return this["catch"](function(error) {
      nextTick(function() {
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
    var resolver = Promise.defer();
    resolver.reject(err);
    return resolver.promise;
  };
  Promise.defer = function() {
    return new Resolver(new Promise());
  };
  Promise.each = function(list, iterator) {
    var resolver = Promise.defer(), len = list.length;
    if (len === 0) resolver.reject(TypeError());
    var i = 0;
    while (i < len) {
      iterator(list[i], i++, list);
    }
    return resolver;
  };
  Promise.all = function() {
    var list = parse(arguments), length = list.length, resolver = Promise.each(list, resolve);
    return resolver.promise;
    function reject(err) {
      resolver.reject(err);
    }
    function resolve(value, i, list) {
      if (isObject(value) && isFunction(value.then)) {
        value.then(function(val) {
          resolve(val, i, list);
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
  function parse(obj) {
    if (obj.length === 1 && Array.isArray(obj[0])) {
      return obj[0];
    } else {
      var args = new Array(obj.length);
      for (var i = 0; i < args.length; ++i) {
        args[i] = obj[i];
      }
      return args;
    }
  }
})(this);