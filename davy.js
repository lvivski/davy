(function(root) {
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
    root.Davy = Promise;
    nextTick = root.subsequent;
  }
  function Promise(fn) {
    this.value = undefined;
    this.__deferreds__ = [];
    if (arguments.length > 0) {
      var resolver = new Resolver(this);
      if (typeof fn == "function") {
        Resolver.resolve(fn, resolver);
      } else {
        resolver.fulfill(fn);
      }
    }
  }
  Promise.prototype.isFulfilled = false;
  Promise.prototype.isRejected = false;
  Promise.prototype.then = function(onFulfill, onReject, onNotify) {
    var resolver = Promise.defer(), deferred = {
      resolver: resolver,
      fulfill: onFulfill,
      reject: onReject,
      notify: onNotify
    };
    if (this.isFulfilled || this.isRejected || this.value) {
      Resolver.handle(this, [ deferred ]);
    } else if (!this.value) {
      this.__deferreds__.push(deferred);
    }
    return resolver.promise;
  };
  function Resolver(promise) {
    this.promise = promise;
  }
  Resolver.SUCCESS = "fulfill";
  Resolver.FAILURE = "reject";
  Resolver.NOTIFY = "notify";
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
        Resolver.resolve(function(resolve, reject, notify) {
          value.then(resolve, reject, notify);
        }, this);
        return;
      }
    }
    promise.isFulfilled = true;
    Resolver.complete(promise, value);
  };
  Resolver.prototype.reject = function(error) {
    var promise = this.promise;
    if (promise.isFulfilled || promise.isRejected) return;
    promise.isRejected = true;
    Resolver.complete(promise, error);
  };
  Resolver.prototype.notify = function(value) {
    var promise = this.promise;
    if (promise.isFulfilled || promise.isRejected) return;
    Resolver.complete(promise, value);
  };
  Resolver.complete = function(promise, value) {
    promise.value = value;
    Resolver.handle(promise, promise.__deferreds__);
    if (promise.isFulfilled || promise.isRejected) {
      promise.__deferreds__ = undefined;
    }
  };
  Resolver.handle = function(promise, deferreds) {
    if (!deferreds.length) return;
    var type = promise.isFulfilled ? Resolver.SUCCESS : promise.isRejected ? Resolver.FAILURE : Resolver.NOTIFY, value = promise.value;
    var i = 0;
    while (i < deferreds.length) {
      Resolver.handleOne(deferreds[i++], type, value);
    }
  };
  Resolver.handleOne = function(deferred, type, value) {
    var fn = deferred[type], resolver = deferred.resolver;
    nextTick(function() {
      if (isFunction(fn)) {
        var val;
        try {
          val = fn(value);
        } catch (e) {
          resolver.reject(e);
          return;
        }
        if (type === Resolver.NOTIFY) {
          resolver.notify(val);
        } else {
          resolver.fulfill(val);
        }
      } else {
        resolver[type](value);
      }
    });
  };
  Resolver.resolve = function(fn, resolver) {
    var isPending = true;
    try {
      fn(function(val) {
        if (isPending) {
          isPending = false;
          resolver.fulfill(val);
        }
      }, function(err) {
        if (isPending) {
          isPending = false;
          resolver.reject(err);
        }
      }, function(val) {
        resolver.notify(val);
      });
    } catch (e) {
      if (isPending) {
        resolver.reject(e);
      }
    }
  };
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
    if (isLikePromise(val)) {
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
    if (len === 0) resolver.fulfill(TypeError());
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
      if (isLikePromise(value)) {
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
      if (isLikePromise(value)) {
        value.then(resolve, reject);
        return;
      }
      resolver.fulfill(value);
    }
  };
  Promise.wrap = function(fn) {
    return function() {
      var len = arguments.length, i = 0, args = new Array(len), resolver = Promise.defer();
      while (i < len) {
        args[i] = arguments[i++];
      }
      var callback = function(err, val) {
        if (err) {
          resolver.reject(err);
        } else {
          resolver.fulfill(val);
        }
      };
      try {
        switch (len) {
         case 2:
          fn.call(this, args[0], args[1], callback);
          break;

         case 1:
          fn.call(this, args[0], callback);
          break;

         case 0:
          fn.call(this, callback);
          break;

         default:
          args.push(callback);
          fn.apply(this, args);
        }
      } catch (e) {
        resolver.reject(e);
      }
      return resolver.promise;
    };
  };
  Promise.unwrap = function(tree, path) {
    function visit(node, depth) {
      return Promise.resolve(node).then(function(node) {
        if (!isObject(node) || isEmpty(node)) {
          return node;
        }
        var isArray = Array.isArray(node), result = isArray ? [] : {}, promises = Object.keys(node).map(function(key) {
          if (path && path[depth] !== key) {
            return Promise.resolve();
          }
          var value = node[key];
          if (isArray) {
            key = result.length;
          }
          result[key] = null;
          return visit(value, depth + 1).then(function(unwrapped) {
            result[key] = unwrapped;
          });
        });
        return Promise.all(promises).yield(result);
      });
    }
    return visit(tree, 0);
  };
  function isObject(obj) {
    return obj && typeof obj === "object";
  }
  function isFunction(fn) {
    return fn && typeof fn === "function";
  }
  function isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }
  function isLikePromise(obj) {
    return isObject(obj) && isFunction(obj.then);
  }
  function parse(obj) {
    if (obj.length === 1 && Array.isArray(obj[0])) {
      return obj[0];
    } else {
      var args = new Array(obj.length), i = 0;
      while (i < args.length) {
        args[i] = obj[i++];
      }
      return args;
    }
  }
})(Function("return this")());