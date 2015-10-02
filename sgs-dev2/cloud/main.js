


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
  var command = body.split(' ')[0];
  switch(command){
    case "CREATE-GROUP":
      console.log("command:", "CREATE");
      createGroup(body.split(' ')[1]);
      break;
    case "POST":
      postGroup(body.split(' ')[1], body.split(' ')[2]);
      break;
    case "SUBSCRIBE":
      subscribeToGroup(body.split(' ')[1], from);
      break;
    default:
  }
}

function createGroup(groupName) {
  var Groups = Parse.Object.extend("Groups");
  var groups = new Groups();
  
  groups.save({group_name: groupName}, {
    success: function(groupName) { console.log("Group created :", groupName); },
    error: function(groupName, error) { console.log("Group not created :", groupName, error.message); }
  });  
}

function postGroup(groupName, message) {
   var Groups = Parse.Object.extend("Groups");

  var query = new Parse.Query(Groups);
  query.equalTo("group_name", groupName);
  query.first({
    success: function(object) { 
    var subscribers = object["subscribers"];
    for(i = 0; i < subscribers.length; ++i) console.log(subscribers[i], ' ');

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


