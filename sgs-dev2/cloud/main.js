


var twilio = require("twilio");
twilio.initialize("ACbdd1d6354df1da852a6a0ad5d0062104","3c64e1cb0a6b3ff42019033118205beb");

var express = require('express');
var app = express();

app.use(express.bodyParser());  

app.post('/twilio-webhook',
         function(req, res) {
  parseMessageBody(req.body.Body, req.body.From);
});

function parseMessageBody(body, from) {
  var tokens = body.match(/\S+/g);
  var command = tokens[0].toUpperCase();
  var groupName = tokens[1];
  console.log(body,command,groupName, tokens[2]);
  
  switch(command){
    case "CREATE":
      console.log("command:", "CREATE");
      createGroup(groupName, from);
      break;
    case "POST":
      postGroup(groupName, body.substr(5 + groupName.length));
      break;
    case "SUBSCRIBE":
      subscribeToGroup(groupName, from);
      break;
    default:
  }
}

function createGroup(groupName) {
  var Groups = Parse.Object.extend("Groups");
  var groups = new Groups();
  
  groups.save({group_name: groupName}, {
    success: function() { 
                console.log("Group created :", groupName); 
                subscribeToGroup(groupName, from);
             },
    error: function(groupName, error) { console.log("Group not created :", groupName, error.message); }
  });  
}

function postGroup(groupName, message) {
   var Groups = Parse.Object.extend("Groups");
   console.log(groupName, message);
  var query = new Parse.Query(Groups);
  query.equalTo("group_name", groupName);
  query.first({
    success: function(object) { 
    var subscribers = object.get("subscribers");
    console.log(subscribers);
    for(i = 0; i < subscribers.length; ++i) {
      console.log(subscribers[i], ' ');
      twilio.sendSMS({
        From: "+441777322027",
        To: subscribers[i],
        Body: groupName + ": " + message
      }, {
        success: function(httpResponse) { response.success("SMS sent!"); },
        error: function(httpResponse) { response.error("Uh oh, something went wrong"); }
      });
    }

 },
    error: function(groupName, error) { console.log("Adding subscriber failed :", userNumber, error.message); }
  }); 
}

function subscribeToGroup(groupName, userNumber) {
   var Groups = Parse.Object.extend("Groups");

  var query = new Parse.Query(Groups);
  query.equalTo("group_name", groupName);
  query.first({
    success: function(groups) { 
    groups.addUnique("subscribers", userNumber);
    groups.save();
 },
    error: function(groupName, error) { console.log("Adding subscriber failed :", userNumber, error.message); }
  }); 
}

app.listen();


