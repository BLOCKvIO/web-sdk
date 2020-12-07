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
import urlParse from 'url-parse'
export default class Vatom {
  constructor (payload, faces, actions, platformId) {
    this.payload = payload
    this.faces = faces
    this.actions = actions
    this.platformId = platformId
  }

  get id () {
    return this.payload.id
  }

  get private () {
    return this.payload.private
  }

  get unpublished () {
    return this.payload.unpublished
  }

  get version () {
    return this.payload.version
  }

  get sync () {
    return this.payload.sync
  } 

  get whenCreated () {
    return this.payload.when_created
  }

  get whenModified () {
    return this.payload.when_modified
  }

  get properties () {
    return this.payload['vAtom::vAtomType']
  }

  /** True if this is a folder vatom */
  get isFolder () {
    return this.properties['root_type'].indexOf('ContainerType') !== -1
  }

  /** True if this is a defined folder vatom, ie a folder that can only accept certain types of child vatoms. */
  get isDefinedFolder () {
    return this.properties['root_type'].indexOf('DefinedFolderContainerType') !== -1
  }

  /** True if this is a discover folder vatom, ie a folder whose contents are fetched by performing the `Discover` action on it. */
  get isDiscoverFolder () {
    return this.properties['root_type'].indexOf('DiscoverFolderContainerType') != -1
  }

  canPerformAction (action) {
    return this.actions.find(a => a.name.indexOf(action) !== -1)
  }

  canCombineWith (otherVatom) {
    // Stop if null or ourselves
    if (!otherVatom || this.id === otherVatom.id) {
      return false
    }

    // If it's not a folder, deny
    if (!this.isFolder) {
      return false
    }

    // If it's not a defined folder, allow
    if (!this.isDefinedFolder) {
      return true
    }

    // Get child policies
    let policies = this.properties['child_policy'] || []

    // Make child policies a little easier for us to understand
    policies = policies.map(p => ({
      templateVariation: p.template_variation,
      maxCount: (p.creation_policy && p.creation_policy.policy_count_max) || 9999,
      enforceMaxCount: (p.creation_policy && p.creation_policy.enforce_policy_count_max) || false
    }))

    // Make sure we have a match
    for (let policy of policies) {
      // Check if template variation matches
      if (policy.templateVariation === otherVatom.properties.template_variation) {
        return true
      }
    }

    // No match found, deny
    return false
  }

  /** Checks if this vatom has an icon face */
  containsIconFace () {
    return !!this.faces.find(f => (f.properties.constraints.platform === 'web' || f.properties.constraints.platform === 'generic') && f.properties.constraints.view_mode === 'icon')
  }

  /** Checks if this vatom has a card face */
  containsCardFace () {
    return !!this.faces.find(f => (f.properties.constraints.platform === 'web' || f.properties.constraints.platform === 'generic') && f.properties.constraints.view_mode === 'card')
  }

  /** Checks if this vatom has a fullscreen face */
  containsFullscreenFace () {
    return !!this.faces.find(f => (f.properties.constraints.platform === 'web' || f.properties.constraints.platform === 'generic') && f.properties.constraints.view_mode === 'fullscreen')
  }

  /** TO DO: Implement in next release

  static mapString (o) {
    return Object.keys(o).map(key => `${key}=${o[key]}`).join('&')
  }

  encodeResource (url) {
    const aP = this.store.assetProvider
    const aPlen = aP.length
    const compare = urlParse(url)
    for (let i = 0; i < aPlen; i += 1) {
      const comparethis = urlParse(aP[i].uri)
      if (compare.hostname === comparethis.hostname) {
        // same uri so get the policy signature and key and append
        const queryString = Vatom.mapString(aP[i].descriptor)
        return `${url}?${queryString}`
      }
    }
    return url
  }

  getResource (resourceName, customPath) {
    let payloadResource = (customPath || this.payload['vAtom::vAtomType'].resources).find(r => r.name === resourceName)
    return this.encodeResource(payloadResource.value.value)
  }
  */
}
