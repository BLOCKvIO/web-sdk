# web-sdk

initialise the Blockv SDK:

```
Blockv.init({
      "appID" : "87b4a201-054c-484c-b206-02742ba9ae87",
      "server" : "https://apidev.blockv.net/",
      "websocketAddress" : ""
    });
```

#### Login
 - parameter one is the email address or the mobile number of the user
 - parameter two is the type of login (email / phone_number)
 - parameter three is the password 

```
Blockv.UserManager.login("example@example.com", "email", "test")

```
