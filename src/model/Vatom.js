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

module.exports = class Vatom {
    constructor(payload, faces, actions){
        this.payload = payload;
        this.faces = faces;
        this.actions = actions;
    }

    get id(){
        return this.payload.id
    }

    get private(){
        return this.payload.private;
    }
    
    get unpublished(){
        return this.payload.unpublished;
    }

    get version(){
        return this.payload.version;
    }

    get when_created(){
        return this.payload.when_created;
    }

    get when_modified(){
        return this.payload.when_modified;
    }

    get properties(){
        return this.payload['vAtom::vAtomType'];
    }

}