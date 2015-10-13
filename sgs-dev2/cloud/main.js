var twilio = require("twilio");
twilio.initialize("ACbdd1d6354df1da852a6a0ad5d0062104", "3c64e1cb0a6b3ff42019033118205beb");

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
    console.log(body, command, groupName, tokens[2]);

    switch (command) {
        case "CREATE":
        case "NEW":
            console.log("command:", "CREATE");
            createGroup(groupName, from);
            break;
        case "POST":
            postGroup(groupName, body.substr(5 + groupName.length));
            break;
        case "SUBSCRIBE":
            subscribeToGroup(groupName, from);
            break;
        case "UNSUBSCRIBE":
            unsubscribeFromGroup(groupName, from);
            break;
        default:
    }
}

function createGroup(groupName) {
    var Groups = Parse.Object.extend("Groups");
    var groups = new Groups();

    groups.save({
        group_name: groupName
    }, {
        success: function() {
            console.log("Group created :", groupName);
            subscribeToGroup(groupName, from);
        },
        error: function(groupName, error) {
            console.log("Group not created :", groupName, error.message);
        }
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
            for (i = 0; i < subscribers.length; ++i) {
                console.log(subscribers[i], ' ');
                twilio.sendSMS({
                    From: "+441777322027",
                    To: subscribers[i],
                    Body: groupName + ": " + message
                }, {
                    success: function(httpResponse) {
                        httpResponse.success("SMS sent!");
                    },
                    error: function(httpResponse) {
                        httpResponse.error("Uh oh, something went wrong");
                    }
                });
            }

        },
        error: function(groupName, error) {
            console.log("Adding subscriber failed :", userNumber, error.message);
        }
    });
}

function subscribeToGroup(groupName, userNumber) {
    var Groups = Parse.Object.extend("Groups");

    var query = new Parse.Query(Groups);
    query.equalTo("group_name", groupName);
    query.first({
        success: function(groups) {
            groups.addUnique("subscribers", userNumber);
            groups.save(null, {
                            success: function() {
                                twilio.sendSMS({
                                    From: "+441777322027",
                                    To: userNumber,
                                    Body: "You have successfully subscribed to the group " + groupName
                                }, {
                                    success: function() {
                                        alert("A subscription confirmation has been successfully sent.");
                                    },
                                    error: function() {
                                        alert("Uh oh, something went wrong");
                                    }
                                });
                            },
                            error: function(groupName, error) {
                                console.log("Group not created :", groupName, error.message);
                            }
                        });
        },
        error: function(groupName, error) {
            console.log("Adding subscriber failed :", userNumber, error.message);
        }
    });
}

function unsubscribeFromGroup(groupName, userNumber) {
    var Groups = Parse.Object.extend("Groups");

    var query = new Parse.Query(Groups);
    query.equalTo("group_name", groupName);
    query.first({
        success: function(groups) {
            var subscribers = groups.get("subscribers");
            for (i = 0; i < subscribers.length; ++i) {
                if(subscribers[i] == userNumber) {
                    groups.remove("subscribers", userNumber);
                    groups.save(null, {
                                    success: function() {
                                        twilio.sendSMS({
                                            From: "+441777322027",
                                            To: userNumber,
                                            Body: "You have successfully unsubscribed from the group " + groupName
                                        }, {
                                            success: function() {
                                                alert("A subscription confirmation has been successfully sent.");
                                            },
                                            error: function() {
                                                alert("Uh oh, something went wrong. No confirmation message has been sent.");
                                            }
                                        });
                                    },
                                    error: function(groupName, error) {
                                        console.log("You are not subscribed to the group :", groupName, error.message);
                                    }
                                });
                    return; 
                }
            }
            twilio.sendSMS({
                From: "+441777322027",
                To: userNumber,
                Body: "You are not subscribed to the group " + groupName
            }, {
                success: function() {
                    alert("A message has been successfully sent.");
                },
                error: function() {
                    alert("Uh oh, something went wrong. No confirmation message has been sent.");
                }
            });

        },
        error: function(groupName, error) {
            console.log("Deleting subscriber failed :", userNumber, error.message);
        }
    });
}

app.listen();
