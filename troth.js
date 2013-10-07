(function(global) {
  "use strict";
  if (typeof define === "function" && define.amd) {
    define(Promise);
  } else if (typeof module === "object" && module.exports) {
    module.exports = Promise;
    var nextTick = require("subsequent");
  } else {
    global.Troth = global.Promise = Promise;
    var nextTick = global.nextTick;
  }
  function Promise(value) {
    this.value = value;
    this.deferreds = [];
  }
  Promise.SUCCESS = "fulfill";
  Promise.FAILURE = "reject";
  Promise.isPromise = function(obj) {
    return obj && typeof obj.then === "function";
  };
  Promise.prototype.isFulfilled = false;
  Promise.prototype.isRejected = false;
  Promise.prototype.then = function(onFulfill, onReject) {
    var promise = new Promise(), deferred = defer(promise, onFulfill, onReject);
    if (this.isFulfilled || this.isRejected) {
      resolve(deferred, this.isFulfilled ? Promise.SUCCESS : Promise.FAILURE, this.value);
    } else {
      this.deferreds.push(deferred);
    }
    return promise;
  };
  Promise.prototype.fulfill = function(value) {
    if (this.isFulfilled || this.isRejected) return;
    this.isFulfilled = true;
    this.complete(Promise.SUCCESS, value);
  };
  Promise.prototype.reject = function(error) {
    if (this.isFulfilled || this.isRejected) return;
    this.isRejected = true;
    this.complete(Promise.FAILURE, error);
  };
  Promise.prototype.complete = function(type, value) {
    this.value = value;
    for (var i = 0; i < this.deferreds.length; ++i) {
      resolve(this.deferreds[i], type, value);
    }
    this.deferreds = undefined;
  };
  function resolve(deferred, type, value) {
    nextTick(function() {
      var fn = deferred[type], promise = deferred.promise, res;
      if (typeof fn === "function") {
        try {
          res = fn(value);
        } catch (e) {
          promise.reject(e);
          return;
        }
        if (Promise.isPromise(res)) {
          res.then(function(val) {
            promise.fulfill(val);
          }, function(err) {
            promise.reject(err);
          });
        } else {
          promise[type](res);
        }
      } else {
        promise[type](value);
      }
    });
  }
  function defer(promise, fulfill, reject) {
    return {
      promise: promise,
      fulfill: fulfill,
      reject: reject
    };
  }
})(this);