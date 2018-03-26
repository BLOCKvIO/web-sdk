# web-sdk

initialise the Blockv SDK:

```
Blockv.init({
      "appID" : "87b4a201-054c-484c-b206-02742ba9ae87",
      "server" : "https://apidev.blockv.net/",
      "websocketAddress" : ""
    });
```

#### login()
 - parameter one is the email address or the mobile number of the user
 - parameter two is the type of login (email / phone_number)
 - parameter three is the password 

```
Blockv.UserManager.login("example@example.com", "email", "test")

```

#### logout()
Logs out the current user

```
Blockv.UserManager.logout()
```
#### register(registration)
Registration can be done in two ways:
- inline register(firstName,lastName, birthday, language, password, tokens, namePublic, avatarPublic)
- or as an object

```
Blockv.UserManager.register(registration)
```
#### getAccessToken()

Returns the current Access Token

```
Blockv.UserManager.getAccessToken();
```

#### setAccessToken(token)
Sets the Access Token for the APP

```
Blockv.UserManager.setAccessToken(token);
```

#### getCurrentUser()
Returns the current user information

```
Blockv.UserManager.getCurrentUser();
```

#### encodeAssetProvider()
Checks the current URI that was supplied against the logged in Asset Provider URI and if it is a match, builds a encoded link with the matching params

```
Blockv.UserManager.encodeAssetProvider("https://cdndev.blockv.net/blockv/avatars/b9e6581c-bb70-48d1-85eb-6657ee1a3bef.1521806344051057018");
```
