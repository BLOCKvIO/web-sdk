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
class Discover {
  constructor(bv, customPayload) {
    this.bv = bv;
    // Setup default vars
    this.overridePayload = customPayload;
    this.filters = [];
    this.groupBy = [Discover.FieldTemplateVariation];
    this.scope = null;

    // The default scope returns vatoms that the user owns only
    this.setScopeToOwnedVatomsOnly();

    /** The number of samples to return. This is based on the groupBy property.
        0 will return all vatoms without sampling them. */
    this.samples = 0;
  }

  /** Appends a filter to the filters list. */
  appendFilter(field, value, compareOperation, combineOperation) {
    // Append filter
    this.filters.push({
      field,
      value,
      filter_op: compareOperation || Discover.FilterOperation.Equal,
      bool_op: combineOperation || Discover.CombineOperation.And,
    });
  }

  /** Set the scope to only return vatoms with the specified publisher FQDN */
  setScopeToPublisherFQDN(fqdn) {
    // Set scope
    this.scope = {
      key: Discover.FieldPublisherFqdn,
      value: fqdn,
    };
  }

  /** Set the scope to only return owned vatoms */
  setScopeToOwnedVatomsOnly() {
    // Set scope
    this.scope = {
      key: Discover.FieldOwner,
      value: '$currentuser',
    };
  }

  /** Set the scope to specified key and value */
  setScope(key, value) {
    // Set scope
    this.scope = {
      key,
      value,
    };
  }

  /** @private Get the request payload to send to the Discovery API call */
  getPayload() {
    // Check for override
    if (this.overridePayload) {
      return this.overridePayload;
    }
    // Check scope
    if (!this.scope) {
      throw new Error('Vatomic SDK: No scope set for discover filter!');
    }
    // Create payload
    const payload = {};
    payload.scope = this.scope;

    // Set sampling
    if (this.samples > 0 && this.groupBy.length > 0) {
      payload.sample = this.samples;
      payload.group_by = this.groupBy;
    }

    // Set filters
    if (this.filters.length > 0) {
      payload.filters = [{
        filter_elems: this.filters,
      }];
    }

    // Set return info
    payload.return = {
      type: '*',
      fields: [],
    };

    // Done
    return payload;
  }

  /** Execute the discover query, returning an array of Vatoms. @returns Promise<[Vatom]> */
  execute() {
    // Send request
    return this.bv.client.request('POST', '/v1/vatom/discover', this.getPayload(), true).then((data) => {
      const { actions, faces, results } = data;

      const actionsArray = [];
      const facesArray = [];
      const vatomsArray = [];
      // eslint-disable-next-line
      for (let a of actions) {
        const aName = a.name.split('::Action::');
        const aKey = aName[0];
        actionsArray.push({
          template: aKey,
          action: aName[1],
          meta: a.meta,
          properties: a.properties,
        });
      }
      // eslint-disable-next-line
      for (let f of faces) {
        facesArray.push({
          template: f.template,
          id: f.id,
          meta: f.meta,
          properties: f.properties,
        });
      }
      // eslint-disable-next-line
      for (let v of results) {
        const { template } = v['vAtom::vAtomType'];
        const obj = {
          id: v.id,
          private: v.private,
          unpublished: v.unpublished,
          version: v.version,
          when_created: v.when_created,
          when_modified: v.when_modified,
          properties: v['vAtom::vAtomType'],
          faces: facesArray.filter(f => f.template === template),
          actions: actionsArray.filter(a => a.template === template),
        };
        vatomsArray.push(obj);
      }
      return vatomsArray;
    });
  }

  /** Execute the discover query, returning the count of vatoms. @returns Promise<Integer> */
  count() {
    // Inject "count only" into the payload
    const payload = this.getPayload();
    payload.return.type = 'count';

    // Send request
    return this.bv.client.request('POST', '/v1/vatom/discover', payload, true)
      .then(data => data.count || 0);
  }
}

/** Filter operations */
Discover.FilterOperation = {
  Equal: 'Eq',
  GreaterThan: 'Gt',
  GreaterOrEqual: 'Ge',
  LessThan: 'Lt',
  LessOrEqual: 'Le',
  NotEqual: 'Ne',
  Match: 'Match',
};

/** Filter combine operations */
Discover.CombineOperation = {
  And: 'And',
  Or: 'Or',
};

/** Predefined fields */
Discover.FieldAcquireable = 'vAtom::vAtomType.acquireable';
Discover.FieldPrivateName = 'private.name';
Discover.FieldID = 'id';
Discover.FieldPublisherFqdn = 'vAtom::vAtomType.publisher_fqdn';
Discover.FieldTemplate = 'vAtom::vAtomType.template';
Discover.FieldTemplateVariation = 'vAtom::vAtomType.template_variation';
Discover.FieldVisibilityType = 'vAtom::vAtomType.visibility.type';
Discover.FieldOwner = 'vAtom::vAtomType.owner';
Discover.FieldParentID = 'vAtom::vAtomType.parent_id';

module.exports = Discover;
