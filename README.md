# BLOCKv SDK for JavaScript

This is the official BLOCKv Web SDK. It allows you to easily integrate your own web apps into the BLOCKv Platform.

## Prerequisite: Request an App ID

If you have not already done so, please request an App ID using the developer access page.

Open the developer access page
Fill out the registration form with your company and project details
Submit the form for review
The BLOCKv team will review your registration request, and if successful, send through your App ID. You will need this App ID to run the endpoints explored in the examples below.

## Installation

Install from npm

```javascript
npm install @blockv/sdk
```

Use from the browser
```javascript
<script src="https://npmcdn.com/@blockv/sdk/dist/blockv-sdk.min.js"></script>
```

In Node.js

```javascript
var Blockv = require('@blockv/sdk')
```

ES6 & ES7
```javascript
import Blockv from '@blockv/sdk'
```


## Getting Started

Before running any of the web APIs you need to initialise the BLOCKv application, So by putting the following code in your opening script tag.

The SDK supports multiple instances of `Blockv` to be initialised.


*IMPORTANT NOTE:*

The prefix attribute is critical if you are using multiple instances with the same appID.

 Leaving the prefix out will force the sdk to use the appID as the prefix for any stored data, Using multiple instance with the same appID and the prefix omitted will result in data override.

 It is recommended that in the case of multiple instances, You use a prefix so that each instance is unique and utilizes its own unique store.

```javascript
let bv = new Blockv({
      "appID" : {{APPID}},
      "server" : "https://api.blockv.io/",
      "websocketAddress" : "wss://ws.blockv.io",
      "prefix" : "blockv"
    });
```

The prefix attribute in the initialization of the BLOCKv SDK is optional, Left out, This will default to the appID attribute.  

## UserManager

### Registering a User

#### register(payload)
Registration can be done in two ways:
- inline register('first name','last name', 'birthday', 'language', 'password', 'tokens', 'name public', 'avatar public')
- or as an object

#### Examples

```javascript

let payload = {
    firstName : 'John',
    lastName : 'Smith',
    birthday : '1970-12-23',
    language : 'en',
    password : '',
    tokens : [
      {
        token : '+44 123 9876',
        token_type : 'phone_number',
        isPrimary : true
      },
      {
        token : 'example@example.com',
        token_type : 'email',
        isPrimary : false
      }
    ],
    namePublic : true,
    avatarPublic : true
}

bv.UserManager.register(payload).then(data =>{
  //do something here
}).catch(err => {
  console.error(err.message);
})
```

### Login with User Credentials

#### login(payload)
 - parameter one is the email address or the mobile number of the user
 - parameter two is the type of login (email / phone_number)
 - parameter three is the password

 * If the password is not set and left blank, an OTP will be sent to the users method of login, ie. email / mobile number.

```javascript
bv.UserManager.login("example@example.com", "email", "test").then(data => {
  //proceed with logged in user
}).catch(err => {
  console.error(err.message);
})

```

#### loginGuest(guest_id)
 - parameter one is the guest id string


```javascript
bv.UserManager.loginGuest(guest_id).then(data => {
  //proceed with code
}).catch(err => {
  console.error(err.message);
})

```

### Logout the currently logged in user

#### logout()
Logs out the current user

```javascript
bv.UserManager.logout().then(data => {
  //proceed to redirect after logout
}).catch(err => {
  console.error(err.message);
})
```

#### getAccessToken()

Returns the current Access Token

```javascript
bv.UserManager.getAccessToken().then(data => {
  // Access Token returned is a String

}).catch(err => {
  console.error(err.message)
})
```


#### getCurrentUser()
Returns the current user information

```javascript
bv.UserManager.getCurrentUser().then(data => {
  //do something with the returned user data
}).catch(err => {
  console.error(err.message);
});
```

#### encodeAssetProvider(url)
Checks the current URI that was supplied against the logged in Asset Provider URI and if it is a match, builds a encoded link with the matching params

```javascript
bv.UserManager.encodeAssetProvider("https://cdndev.blockv.net/blockv/avatars/b9e6581c-bb70-48d1-85eb-6657ee1a3bef.1521806344051057018").then(data => {
  //proceed to use the newly returned url
}).catch(err => {
  console.error(err.message);
});
```

#### getCurrentUserTokens()
returns a list of the current user's tokens (emails / phone numbers)

```javascript
bv.UserManager.getCurrentUserTokens().then(data => {
  //do something here
}).catch(err => {
  console.error(err.message);
});
```

#### uploadAvatar(formData)

#### Example Avatar Upload

```javascript

function doUpload(){
  let f = document.getElementById('avatar');
  let file = f.files[0];
  let fData = new FormData();
  fData.append('avatar', file);
  bv.UserManager.uploadAvatar(fData);
}
```



#### updateUser(payload)
updates the current user with an object containing the new details of the user

#### Example updating a user
```javascript
let payload = {
    'first_name' : 'Jane',
    'last_name' : 'Smith',
    tokens : [
      {
        token : 'jane@example.com',
        token_type : 'email'
      }
    ]
}

bv.UserManager.updateUser(payload).then(data => {
  //do something here after update
}).catch(err => {
  console.error(err.message);
})
```

#### sendTokenVerification(token, token_type)
resends the verification token to the user
```javascript
bv.UserManager.sendTokenVerification(token, token_type).then(data => {
  //verify the token
}).catch(err => {
  console.error(err.message);
})
```

#### getRefreshToken()
returns the current refresh token
```javascript
bv.UserManager.getRefreshToken().then(data => {
  //do something with the refresh token
}).catch(err => {
  console.error(err.message);
})
```


####  verifyUserToken(payload)
verifies the user token that was supplied

```javascript
let payload = {

    "token": "jane@example.com",
    "token_type": "email",
    "verify_code": "1234"
}
bv.UserManager.verifyUserToken(payload).then(data => {
    // do something after verified
}).catch(err => {
   console.error(err.message);
})
```

#### resetPassword(token, token_type){
Sends a login OTP , The OTP may only be used for the .login() API

```javascript
bv.UserManager.resetPassword("+44 123 4569", "phone_number").then(data => {
     //do something after password is deleted
}).catch(err => {
     console.error(err.message)
})
```

## vAtom Actions

- This is a generic function that takes 3 parameters.
- vatomId is the vatom id
- action is the type of action :: Drop, Pickup , Transfer , Require
- payload is any additional information sent along with the vatom id

```javascript
bv.Vatoms.performAction(vatomId, action, payload).then(data =>{
  //do something after performing an action with a vAtom
}).catch(err => {
  console.error(err.message);
})
```

## vAtom Inventory

Retrieves a list of the current vAtoms in the users inventory

```javascript
bv.Vatoms.getUserInventory().then(data =>{
  //do something with the returned inventory
}).catch(err => {
  console.error(err.message);
})
```

## vAtom Delete

Deletes a vAtom in the users inventory

```javascript
bv.Vatoms.deleteVatom(vatomID).then(data =>{
  //do something after the vAtom has been deleted
}).catch(err => {
  console.error(err.message);
})
```

## Discover

With the discover method you can search for vAtoms on the BLOCKv Platform. The search will cover all the vAtoms within your current user's inventory as well as those of other users on the Platform. When searching for vAtoms owned by other users, only those vAtoms with their visibility set as public will appear.

#### Building discover queries

You construct a discover query using a DiscoverQueryBuilder. This class helps you to easily compose queries using a few components:

1. Scope (required)
1. Filters (optional)
1. Returns (optional)

#### Scope
A scope must always be supplied. Scopes are defined using a key and value. The key specifies the property of the vAtom to search. The value is the search term.

#### Filter
Filter elements, similar to scopes, are defined using a field and value. However, filters offer more flexibility because they allow a filter operator to be supplied, e.g. Gt which filters those vAtoms whose value is 'greater than' the supplied value. The combine operator is applied between filter elements.

#### Return
Return type controls the response payload of the query:

* returns vAtoms.
* count returns only the numerical count of the query and an empty vAtom array.

#### Performing the Query
```javascript
let filter = new Blockv.Discover(bv);
filter.setScope("vAtom::vAtomType.owner", "$currentuser");
filter.appendFilter("vAtom::vAtomType.template", "vatomic::v1::vAtom::Avatar", "Match", "And");
filter.execute();
```

## Web socket

*Important to note, the Web socket connection can only be established if the current user is authenticated. Thus, connect() should only be called after the user has successfully logged in.*

The Web socket class is used to provide realtime feedback for the user when they perform certain actions on the BLOCKv platform.


#### Connection
A connection to the Web socket should be established before invoking any of the listeners on the socket.
```javascript
bv.WebSockets.connect().then(()=>{
		//Do something with the connected sockets
}).catch(err => {
		console.error(err.message);
});
```

To use the information returned from the Web socket, You will need to add a few event listeners to the established connection.

There are four different event listeners you can monitor:

- stateUpdate
- inventory
- activity
- all

| Listener       	| Description                                                           |
| ---------------	| --------------------------------------------------------------------- |
| inventory     	| Updates on the current user's inventory (vAtom addition/removal)      |
| stateUpdate  		| Updates on the state of any of the current user's vAtoms (vAtom diff) |
| activity      	| Updates on the general platform events (user actions, chat, etc.)     |
| all							| All of the above together																							|

```javascript
bv.WebSockets.connect().then(()=>{
 
  //adding a listener for state Updates
  bv.WebSockets.addEventListener('stateUpdate', function(data){
		//Do something with returned state updates
	})
 
  //adding a listener for inventory calls
	bv.WebSockets.addEventListener('inventory', function(data){
		//Do something with returned inventory updates
	})
 
	//adding a listener for activity
	bv.WebSockets.addEventListener('activity', function(data){
		//Do something with the returned activity updates
	})
 
	//adding a listener for all
	bv.WebSockets.addEventListener('all', function(data){
		//Do something with the returned data
	})
 	
}).catch(err => {
		console.error(err.message);
});
 
```

#### Closing Web Sockets
The caller can manually force a socket connection to close by using the close() function. This will prevent the Web socket from trying to auto-connect.

```javascript
bv.WebSockets.close();
```

## Activity

### Threads
Fetch the activity threads of the current user.

Each thread represents an activity feed between two users. The BLOCKv platform will automatically create and update threads when sending or receiving a vAtom.

```javascript
//returns a list of threads
bv.Activity.threads().then(data => {
		//do something with the returned threads
}).catch(err => {
		console.error(err.message);
})
```

### Thread Messages
Fetch the event messages for an activity thread belonging to the current user.

To get the id required to specify the activity thread see Threads function above.

```javascript
//Fetches a list of messages from the specified activity thread.
let id = 'id-of-thread'
bv.Activity.threadMessages(id).then(data => {
	//do something with the returned activity thread
}).catch(err => {
		console.error(err.message)
})
```
### Send message

Send a text message to a user on the BLOCKv platform. This will create a new activity thread or update the existing one between the two users.

```javascript
//send a message to a user on the BLOCKv platform
let id = "id-of-the-user-to-send-to"
bv.Activity.sendMessage(id).then(data =>{
	//do something with the returned message here
}).catch(err => {
		console.error(err.message);
})
```
## Security Disclosure

If you believe you have identified a security vulnerability with BLOCKv, you should report it as soon as possible via email to support@blockv.io. Please do not post it to a public issue tracker.

## Author

[BLOCKv](developer.blockv.io)

## License

BLOCKv is available under the BLOCKv AG license. See the [LICENSE](https://github.com/BLOCKvIO/web-sdk/blob/master/LICENSE) file for more info.
