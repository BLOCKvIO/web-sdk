
import Client from '../internal/net/Client'

export default class Discover {

    constructor(bv, customPayload) {
      this.bv = bv;
    	// Setup default vars
    	this.overridePayload 	= customPayload;
      this.filters 			= [];
      this.groupBy 			= [Discover.FieldTemplateVariation];
    	this.scope				= null;

    	// The default scope returns vatoms that the user owns only
    	this.setScopeToOwnedVatomsOnly();

    	/** The number of samples to return. This is based on the groupBy property. 0 will return all vatoms without sampling them. */
    	this.samples			= 0;

    }

    /** Appends a filter to the filters list. */
    appendFilter(field, value, compareOperation, combineOperation) {

    	// Append filter
    	this.filters.push({
    		field: field,
    		filter_op: compareOperation || Discover.FilterOperation.Equal,
    		value: value,
    		bool_op: combineOperation || Discover.CombineOperation.And
    	});

    }

    /** Set the scope to only return vatoms with the specified publisher FQDN */
    setScopeToPublisherFQDN(fqdn) {

    	// Set scope
    	this.scope = {
    		key: Discover.FieldPublisherFqdn,
    		value: fqdn
    	};

    }

    /** Set the scope to only return owned vatoms */
    setScopeToOwnedVatomsOnly() {

    	// Set scope
    	this.scope = {
    		key: Discover.FieldOwner,
    		value: "$currentuser"
    	};

    }

    /** Set the scope to specified key and value */
    setScope(key, value) {

    	// Set scope
    	this.scope = {
    		key: key,
    		value: value
    	};

    }

    /** @private Get the request payload to send to the Discovery API call */
    getPayload() {

    	// Check for override
        if (this.overridePayload)
            return this.overridePayload;

    	// Check scope
    	if (!this.scope)
    		throw new Error("Vatomic SDK: No scope set for discover filter!")

    	// Create payload
        var payload = {};
    	payload.scope = this.scope;

    	// Set sampling
    	if (this.samples > 0 && this.groupBy.length > 0) {
    		payload.sample = this.samples;
    		payload.group_by = this.groupBy;
    	}

        // Set filters
    	if (this.filters.length > 0) {
    		payload.filters = [{
    			filter_elems: this.filters
    		}];
    	}

        // Set return info
        payload.return = {
            "type": "*",
            "fields": []
        }

        // Done
        return payload;

    }

    /** Execute the discover query, returning an array of Vatoms. @returns Promise<[Vatom]> */
    execute() {

    	// Send request
    	return this.bv.client.request("POST", "/v1/vatom/discover", this.getPayload(), true).then(data => data)

    }

    /** Execute the discover query, returning the count of vatoms. @returns Promise<Integer> */
    count() {

    	// Inject "count only" into the payload
    	var payload = this.getPayload()
    	payload.return.type = "count"

    	// Send request
    	return this.bv.client.request("POST", "/v1/vatom/discover", payload, true).then(data => {

    		// Done
    		return data.count || 0

    	})

    }



}

/** Filter operations */
Discover.FilterOperation = {
    Equal: "Eq",
    GreaterThan: "Gt",
    GreaterOrEqual: "Ge",
    LessThan: "Lt",
    LessOrEqual: "Le",
    NotEqual: "Ne",
    Match: "Match"
}

/** Filter combine operations */
Discover.CombineOperation = {
    And: "And",
    Or: "Or"
}

/** Predefined fields */
Discover.FieldAcquireable = "vAtom::vAtomType.acquireable"
Discover.FieldPrivateName = "private.name"
Discover.FieldID = "id"
Discover.FieldPublisherFqdn = "vAtom::vAtomType.publisher_fqdn"
Discover.FieldTemplate = "vAtom::vAtomType.template"
Discover.FieldTemplateVariation = "vAtom::vAtomType.template_variation"
Discover.FieldVisibilityType = "vAtom::vAtomType.visibility.type"
Discover.FieldOwner = "vAtom::vAtomType.owner"
Discover.FieldParentID = "vAtom::vAtomType.parent_id"
