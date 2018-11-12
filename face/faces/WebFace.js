/**
 * Created by MR_Cheddar on 2016/09/11.
 */

const BaseFace = require("./BaseFace");

module.exports =  class WebFace extends BaseFace {

    /** @private Called on startup */
    onLoad() {
        this.user = {};
        this.vatomView.blockv.UserManager.getCurrentUser().then(d => {
            this.user = d;
            console.log("User: ", this.user);
        });
        
        // Create iframe
        this.iframe = document.createElement("iframe");
        this.iframe.style.cssText = "display: block; position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; overflow: hidden; border: none; background: none; outline: none; z-index:0; ";
        this.iframe.setAttribute('src', this.face.properties.display_url);
        console.log("URL: ", this.face.properties.display_url)
        this.element.appendChild(this.iframe)

        // Bind functions
        this.onIncomingBridgeMessage = this.onIncomingBridgeMessage.bind(this)

        // Add bridge message listener
        window.addEventListener("message", this.onIncomingBridgeMessage)

        // Done
        return Promise.resolve()

    }

    /** @private Called when the view is unloaded */
    onUnload() {

        // Remove iframe
        this.element.removeChild(this.iframe)
        this.iframe.onload = null
        this.iframe = null

        // Remove bridge message listener
        window.removeEventListener("message", this.onIncomingBridgeMessage);

    }

    /** @private Process bridge message. @returns Promise. */
    processIncomingBridgeMessage(name, payload) {

        // Check message type
        console.log("HTMLFace", "Incoming bridge message: " + name, payload)
        if (name == "vatom.init") {

            // Check version
            this.bridgeVersion = (payload && payload.version) || 1

            // Check what to do, based on version
            if (this.bridgeVersion == 1) {

                // Send init payload, containing info about the vatom and environment
                var data = WebFace.encodeVatom(this.vatomView.vatom)
                data.vatomInfo.faceProperties = this.face.properties || {}
                data['user'] = this.user;
                // This response has a special message name
                data._responseName = "vatom.init-complete"

                // Done, return payload
                return data

            } else if (this.bridgeVersion == 2) {

                // Send response
                return {
                    version: 2,
                    vatom: this.vatomView.vatom.rawPayload,
                    face: this.face.rawPayload,
                    actions: this.vatomView.vatom.actions.map(action => action.rawPayload),
                    user: this.user
                }

            } else {

                // Unknown version!
                console.error(new Error("Web Face Error, unknown version " + this.bridgeVersion + "!"))
                return {}

            }

        } else if (name == "vatom.children.get" && this.bridgeVersion == 1) {

            // Fetch children
            return this.vatomView.blockv.Vatoms.getVatomChildren(payload.id).then(vatoms => {

                // Create list of vatom info
                var vatomInfos = [];
                for (var i = 0; i < vatoms.length; i++)
                    vatomInfos.push(WebFace.encodeVatom(vatoms[i]));

                // Done
                return {
                    "items": vatomInfos,
                    _responseName: "vatom.children.get-response"
                }

            })

        } else if (name == "vatom.children.get" && this.bridgeVersion == 2) {

            // Fetch children
            return this.vatomView.blockv.Vatoms.getVatomChildren(payload.id).then(vatoms => {

                // Return info
                return {
                    vatoms: vatoms.map(v => v.rawPayload),
                    faces: vatoms.map(v => v.faces).flat().map(f => f.rawPayload),
                    actions: vatoms.map(v => v.actions).flat().map(a => a.rawPayload)
                }

            })

        } else if (name == "vatom.rpc.call") {

            ///sends on payload to all faces
            Events.callEvent("websocket.rpc", payload);
            return {}

        } else if (name == "vatom.performAction") {

            // Perform vAtom action
            return this.vatomView.blockv.Vatoms.performAction(payload.actionData["this.id"], payload.actionName, payload.actionData)

        } else if ((name == "user.profile.fetch" || name == "user.avatar.fetch") && this.bridgeVersion == 1) {

            // Get user details
           
                // Got it, send response
                return {
                    firstName: this.user.firstName,
                    lastName: this.user.lastName,
                    avatarURL: this.user.avatarURL
                }

            

        } else if (name == "user.profile.fetch" && this.bridgeVersion == 2) {

            // Get user details
            

                // Got it, send response
                return this.user;

            
        } else if (name == "vatom.patch" && this.bridgeVersion == 1) {

            // Perform patch operation
            return this.vatomView.blockv.Vatoms.performAction(payload.id, "PATCH", payload)

        } else if (name == "vatom.get" && this.bridgeVersion == 1) {

            // Get details from a vatom ID
            return this.vatomView.blockv.Vatoms.getUserVatoms([payload.id]).then(vatom => vatom)

        } else if (name == "vatom.get" && this.bridgeVersion == 2) {

            // Get details from a vatom ID
            return this.vatomView.blockv.Vatoms.getUserVatoms([payload.id]).then(vatom => vatom)

        } else {

            // Unknown event. Pass on to VatomView listener
            if (this.vatomView && this.vatomView.onMessage)
                return this.vatomView.onMessage(name, payload)

            // No listener, this is an error
            return Promise.reject(new Error("Bridge message not implemented."))

        }

    }

    onIncomingBridgeMessage(event) {

        // Get payload
        var payload = event.data;

        // Check source is from this face's iframe
        if (!payload || !this.iframe || event.source != this.iframe.contentWindow)
            return;

        // Check if there's a response ID, if so the web face is expecting a reply with that ID
        var responseID = null;
        if (payload.responseID)
            responseID = payload.responseID

        // Process it, get response
        Promise.resolve(this.processIncomingBridgeMessage(payload.name, payload.data)).then(resp => {

            // Done, send response back
            this.sendMessage(responseID || resp._responseName, resp)

        }).catch(err => {

            // Failed, send error response
            this.sendMessage(responseID, {
                errorCode: err.code,
                errorText: err.message
            })

        })

    }

    /** @private Encode vatom info for sending over the bridge */
    static encodeVatom(vatom) {

        // Create resource list
        var resources = {};
        for (var res in vatom.resources)
            resources[res] = vatom.resources[res].URL;

        // Create payload
        return {
            "vatomInfo": {
                "id": vatom.identifier,
                "properties": vatom.properties,
                "resources": resources
            }
        }

    }

    static encodeUser(user) {
        return {
            id: user.userID,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarURL: user.avatarURL,
            displayName: ((user.firstName || "") + " " + (user.lastName || "")).trim(),
            email: user.email,
            phoneNumber: user.phoneNumber
        }

    }

    /** @private Send a message over the bridge connection */
    sendMessage(name, data) {

        // Check if iframe is setup
        if (!this.iframe || !this.iframe.contentWindow)
            return

        // Send payload
       //console.log("HTMLFace", "Sending event to face: " + name, data)
        this.iframe.contentWindow.postMessage({
            source: "VatomicSDK",
            name: name,
            data: data || {}
        }, "*")

    }

    /** Incoming RPC message from server, forward over the bridge */
    RPC(data) {

        if (data && data.template_variation && data.rpc && data.template_variation == this.vatomView.vatom.templateVariation) {
            this.sendMessage("vatom.rpc.incoming", {rpc: data.rpc})
        }
    }

    vatomStateChanged(vatom) {

        if (vatom.identifier == this.vatomView.vatom.identifier && this.face) {
            this.vatom = vatom;
            var resources = {};

            for (var res in this.vatomView.vatom.resources) {
                resources[res] = this.vatomView.vatom.resources[res].URL;
            }

            var data = {
                vatomInfo: {
                    id: this.vatomView.vatom.identifier,
                    properties: this.vatomView.vatom.properties,
                    resources: resources,
                    faceProperties: this.face.properties
                }
            };
            console.log("webview vatom state changed");
            this.sendMessage("vatom.updated", data);
        }
    }

    onVatomUpdated() {
        this.vatomStateChanged(this.vatomView.vatom);
        // console.log(this.vatomView.vatom);

    }

}