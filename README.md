# web-sdk

## Overview

The BlockV Web SDK allows you to interact with User Profiles and vAtoms through a series of easy to use api's.

## Prerequisite: Request an App ID

If you have not already done so, please request an App ID using the developer access page.

Open the developer access page
Fill out the registration form with your company and project details
Submit the form for review
The BLOCKv team will review your registration request, and if successful, send through your App ID. You will need this App ID to run the sample app explored in this tutorial.


## Getting Started

Before running any of the web api's you need to initialise the BlockV application, You can do so but putting the following code in your opening script tag.



```javascript 
Blockv.init({
      "appID" : {{APPID}},
      "server" : "https://apidev.blockv.net/",
      "websocketAddress" : ""
    });
```


## UserManager 




#### login()
 - parameter one is the email address or the mobile number of the user
 - parameter two is the type of login (email / phone_number)
 - parameter three is the password 

 * If the password is not set and left blank, an OTP will be sent to the users method of login, ie. email / mobile number.

```javascript 
Blockv.UserManager.login("example@example.com", "email", "test")

```

## Registering a User

#### register(registration)
Registration can be done in two ways:
- inline register('first name','last name', 'birthday', 'language', 'password', 'tokens', 'name public', 'avatar public')
  * language is the shortcode eg: en / fr
  * tokens will be used to log the user in, 
- or as an object

```javascript 
Blockv.UserManager.register(registration)
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
