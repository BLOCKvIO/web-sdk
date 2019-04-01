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

export default class EventEmitter {


	/** Adds an event listener. If callback is null, a Promise will be returned. Note that if using the Promise
	 *  it will only be triggered on the first event emitted. */
	when(eventName, callback = null) {

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
			return new Promise((onSuccess, onFail) => {

				// Promise callbacks can only be used once
				onSuccess._removeAfterCall = true;

				// Add success handler to event listener array
				this._eventListeners[eventName].push(onSuccess);

			});

		}

	}

	/** Synonyms */
	on() {
		return this.when.apply(this, arguments);
	}

	addEventListener() {
		return this.when.apply(this, arguments);
	}



    /** Remove event listener */
    removeEventListener(eventName, callback) {

		// Make sure event listener object exists
		this._eventListeners = this._eventListeners || {};

		// Make sure event listener array exists
		this._eventListeners[eventName] = this._eventListeners[eventName] || [];

        // Find and remove it
        for (var i = 0 ; i < this._eventListeners[eventName].length ; i++)
            if (this._eventListeners[eventName][i] == callback)
                this._eventListeners[eventName].splice(i--, 1)

    }

    off() {
        return this.removeEventListener.apply(this, arguments);
    }




	/** Triggers an event. Each argument after the first one will be passed to event listeners */
	emit(eventName, ...args) {

		// Setup the once-off promise if one of it's events were triggered
		//if (eventName == "success" || eventName == "failed")
		//	this._setupPromise();

		// Get list of callbacks
		var callbacks = this._eventListeners && this._eventListeners[eventName] || [];

		// Call events
		for (var callback of callbacks) {

			// Call it
			callback.apply(this, args);

		}

		// Remove callbacks that can only be called once
		for (var i = 0 ; i < callbacks.length ; i++)
			if (callbacks[i]._removeAfterCall)
				callbacks.splice(i--, 1);

	}

	/** Synonyms */
	trigger() {
		return this.emit.apply(this, arguments);
	}

	triggerEvent() {
		return this.emit.apply(this, arguments);
	}

}

// Apply as a mixin to a class or object
EventEmitter.mixin = function(otherClass) {

	for (var prop in EventEmitter.prototype)
		if (EventEmitter.prototype.hasOwnProperty(prop))
			otherClass[prop] = EventEmitter.prototype[prop];

}
