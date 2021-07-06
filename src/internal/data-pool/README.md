# Data Pool

This class provides a generic implementation of the Data Pool, with some [BLOCKv-specific plugins](./BLOCKv.md).

---

## `DataPool`

This is the shared singleton class. All interaction goes through this class.

### `DataPool.register(Plugin)`

Registers a new plugin.

### `DataPool.setSessionInfo(info)`

Sets the session info. This is plugin-specific data used to share session information.

### `DataPool.region(id, descriptor)`

Fetches (or creates) a region.

- `id` _(string)_ - The plugin ID
- `descriptor` _(any)_ - Data describing the requested region. This is plugin-dependent.
- Returns _(Region)_ - The requested region object.

---

## `Region`

Each region allows for monitoring the data objects within it, and possibly performing actions on them.

Regions are event emitters, meaning you can use `.addEventListener(name, callback)` and `.removeEventListener(name, callback)` to listen for events.

### `region.close()`

Close the region, stop all monitors, and clean up.

### `region.get(waitUntilStable = true)`

Gets all objects within the region. Will wait until all data has been fetched from the backend, unless you pass `false`.

Returns a Promise which resolves to an array of objects. The object types are plugin-specific.

### `region.filter(field, value)`

Creates a local sub-region (called a `Filter`) which only returns objects that have a field matching the specified value.

Filters have the exact same methods and events as a `Region`. This also means you can chain filters to create more specific queries. 

### `region.preemptiveChange(id, keyPath, newValue)`

Allows you to change a field in an object. This returns an undo function which you can call to revert the change.

### `region.preemptiveRemove(id)`

Removes an object. Returns an undo function which you can call to revert the change.

### Event `changed`

Triggered when any data within the region changes. This also indicates any errors have been cleared up.

### Event `error`

Triggered when an error occurs. Passes an `Error` object.