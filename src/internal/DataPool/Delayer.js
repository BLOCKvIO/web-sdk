
/** 
 * This class handles executing code on the next run loop. This is the same as `setImmediate()` or `setTimeout(..., 0)` except
 * it doesn't create so many timers.
 */
export default new class Delayer {

    constructor() {

        /** List of functions to execute on the next run loop */
        this.pending = []

        /** Timer to execute pending actions */
        this.timer = null

        // Bind function
        this.executePendingActions = this.executePendingActions.bind(this)

    }

    /** Schedule an action */
    run(func) {

        // Add to list
        this.pending.push(func)

        // Start timer if needed
        if (!this.timer)
            this.timer = setTimeout(this.executePendingActions, 0)

    }

    /** @private Called to execute pending actions */
    executePendingActions() {

        // Remove timer
        this.timer = null

        // Perform each action
        let actions = this.pending
        this.pending = []
        for (let action of actions) {

            // Catch errors
            try {
                action()
            } catch (err) {
                console.error('Delayed action failed: ', err)
            }

        }

    }

}