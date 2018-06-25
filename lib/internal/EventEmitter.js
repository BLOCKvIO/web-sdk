"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//
//  BlockV AG. Copyright (c) 2018, all rights reserved.
//
//  Licensed under the BlockV SDK License (the "License"); you may not use this file or
//  the BlockV SDK except in compliance with the License accompanying it. Unless
//  required by applicable law or agreed to in writing, the BlockV SDK distributed under
//  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
//  ANY KIND, either express or implied. See the License for the specific language
//  governing permissions and limitations under the License.
//


//
// EventEmitter class - This class provides simple event functionality for classes, with Promise support.
//
//	Usage for once-off event listeners:
//
//		myObj.when("closed").then(function(data) {
//			alert("Closed! " + data);
//		});
//
//
//	Usage for permanent event listeners:
//
//		myObj.on("closed", function(data) {
//			alert("Closed! " + data);
//		});
//
//
//	Usage when triggering an event from a subclass:
//
//		this.emit("closed", "customData");
//

var EventEmitter = function () {
	function EventEmitter() {
		_classCallCheck(this, EventEmitter);
	}

	_createClass(EventEmitter, [{
		key: "when",


		/** Adds an event listener. If callback is null, a Promise will be returned. Note that if using the Promise
   *  it will only be triggered on the first event emitted. */
		value: function when(eventName) {
			var _this = this;

			var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


			// Make sure event listener object exists
			this._eventListeners = this._eventListeners || {};

			// Make sure event listener array exists
			this._eventListeners[eventName] = this._eventListeners[eventName] || [];

			// Check if using promise form
			if (callback) {

				// Just add the callback
				this._eventListeners[eventName].push(callback);
			} else {

				// Return the promise
				return new Promise(function (onSuccess, onFail) {

					// Promise callbacks can only be used once
					onSuccess._removeAfterCall = true;

					// Add success handler to event listener array
					_this._eventListeners[eventName].push(onSuccess);
				});
			}
		}

		/** Synonyms */

	}, {
		key: "on",
		value: function on() {
			return this.when.apply(this, arguments);
		}
	}, {
		key: "addEventListener",
		value: function addEventListener() {
			return this.when.apply(this, arguments);
		}

		/** Remove event listener */

	}, {
		key: "removeEventListener",
		value: function removeEventListener(eventName, callback) {

			// Make sure event listener object exists
			this._eventListeners = this._eventListeners || {};

			// Make sure event listener array exists
			this._eventListeners[eventName] = this._eventListeners[eventName] || [];

			// Find and remove it
			for (var i = 0; i < this._eventListeners[eventName]; i++) {
				if (this._eventListeners[eventName][i] == callback) this._eventListeners[eventName].splice(i--, 1);
			}
		}
	}, {
		key: "off",
		value: function off() {
			return this.removeEventListener.apply(this, arguments);
		}

		/** Triggers an event. Each argument after the first one will be passed to event listeners */

	}, {
		key: "emit",
		value: function emit(eventName) {

			// Setup the once-off promise if one of it's events were triggered
			//if (eventName == "success" || eventName == "failed")
			//	this._setupPromise();

			// Get list of callbacks
			var callbacks = this._eventListeners && this._eventListeners[eventName] || [];

			// Call events

			for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
				args[_key - 1] = arguments[_key];
			}

			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = callbacks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var callback = _step.value;


					// Call it
					callback.apply(this, args);
				}

				// Remove callbacks that can only be called once
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			for (var i = 0; i < callbacks.length; i++) {
				if (callbacks[i]._removeAfterCall) callbacks.splice(i--, 1);
			}
		}

		/** Synonyms */

	}, {
		key: "trigger",
		value: function trigger() {
			return this.emit.apply(this, arguments);
		}
	}, {
		key: "triggerEvent",
		value: function triggerEvent() {
			return this.emit.apply(this, arguments);
		}
	}]);

	return EventEmitter;
}();

// Apply as a mixin to a class or object


exports.default = EventEmitter;
EventEmitter.mixin = function (otherClass) {

	for (var prop in EventEmitter.prototype) {
		if (EventEmitter.prototype.hasOwnProperty(prop)) otherClass[prop] = EventEmitter.prototype[prop];
	}
};