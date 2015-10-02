from sms import Subscription, create_user, create_group, db

db.create_all()
rob = create_user('12345')
print rob
group = create_group('best')
print group

rob.subscribe_to_group('best')
rob.subscribe_to_group('best')
rob.subscribe_to_group('worst')

print "User's subscriptions: %s" % rob.subscriptions()
print Subscription.query.all()

rob.send_message_to_group('best', 'Hey everybody!!')
rob.send_message_to_group('worst', 'Oh no!!')
