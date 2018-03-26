var assert = require('assert');
var Blockv = require("../lib/client/Blockv").default;
var UserManager = require("../lib/client/manager/UserManager").default;


beforeEach(function() {

  return Blockv.init();

});

describe('login', function(){
  it('logsIn'), function(){
    return UserManager.login("kylmci+unittest@gmail.com", "email", "test");
  }
});

describe('getUser', function() {
  it('gets current user', function() {
    return UserManager.getCurrentUser();
  });
});
