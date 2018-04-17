# web-sdk

## UserManager 


initialise the Blockv SDK:

```javascript 
Blockv.init({
      "appID" : "87b4a201-054c-484c-b206-02742ba9ae87",
      "server" : "https://apidev.blockv.net/",
      "websocketAddress" : "wss://ws.blockv.net"
    });
```

#### login()
 - parameter one is the email address or the mobile number of the user
 - parameter two is the type of login (email / phone_number)
 - parameter three is the password 

```javascript 
Blockv.UserManager.login("example@example.com", "email", "test")

```

#### loginGuest()
 - parameter one is the guest id string
 

```javascript 
Blockv.UserManager.loginGuest(guest_id)

```

#### logout()
Logs out the current user

```javascript 
Blockv.UserManager.logout()
```
#### register(registration)
Registration can be done in two ways:
- inline register(firstName,lastName, birthday, language, password, tokens, namePublic, avatarPublic)
- or as an object

```javascript 
Blockv.UserManager.register(registration)
```
#### getAccessToken()

Returns the current Access Token

```javascript 
Blockv.UserManager.getAccessToken();
```

#### setAccessToken(token)
Sets the Access Token for the APP

```javascript 
Blockv.UserManager.setAccessToken(token);
```

#### getCurrentUser()
Returns the current user information

```javascript 
Blockv.UserManager.getCurrentUser();
```

#### encodeAssetProvider()
Checks the current URI that was supplied against the logged in Asset Provider URI and if it is a match, builds a encoded link with the matching params

```javascript 
Blockv.UserManager.encodeAssetProvider("https://cdndev.blockv.net/blockv/avatars/b9e6581c-bb70-48d1-85eb-6657ee1a3bef.1521806344051057018");
```

#### getCurrentUserTokens()
returns a list of the current user's tokens
```javascript 
Blockv.UserManager.getCurrentUserTokens();
```

#### uploadAvatar(formData)
uploads a avatar for the current user
```javascript
Blockv.UserManager.uploadAvatar(formData)
```

#### updateUser()
updates the current user with an object container the new details of the user
```javascript
Blockv.UserManager.updateUser(payload)
```

#### resendVerification()
resends the verification token to the user
```javascript
Blockv.UserManager.resendVerification(token, token_type)
```

#### getRefreshToken()
returns the current refresh token 
```javascript
Blockv.UserManager.getRefreshToken()
```

#### setRefreshToken()
sets the current refresh token
```javascript
Blockv.UserManager.setRefreshToken(token)
```

## vAtom Actions

- This is a generic function that takes 3 parameters.
- vatomId is the vatom id
- action is the type of action :: Drop, Pickup , Transfer , Require
- payload is any additional information sent along with the vatom id

```javascript
Blockv.Vatoms.performAction(vatomId, action, payload)
```
