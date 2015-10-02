from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from sqlalchemy import UniqueConstraint
from sqlite3 import IntegrityError

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/test.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(13), unique=True)
    username = db.Column(db.String(255))

    def __init__(self, phone_number):
        self.phone_number = phone_number

    def __repr__(self):
        return "<User %s>" % self.phone_number

    def subscribe_to_group(self, groupname):
        group = get_group(groupname)
        if group is not None:
            create_subscription(self, group)

    def subscriptions(self):
        subscriptions = Subscription.query.filter_by(user=self)
        return [s.group.groupname for s in subscriptions]

    def send_message_to_group(self, groupname, contents):
        if groupname in self.subscriptions():
            group = get_group(groupname)
            if group is not None:
                create_and_send_message(self, group, contents)
        else:
            print "User not in group %s" % groupname

class Group(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    groupname = db.Column(db.String(144), unique=True)

    def __init__(self, groupname):
        self.groupname = groupname

    def __repr__(self):
        return '<Group %r>' % self.groupname

class Subscription(db.Model):
    __table_name__ = 'subscriptions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User',
            backref=db.backref('subscription_user', lazy='dynamic'))
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    group = db.relationship('Group',
            backref=db.backref('subscription_group', lazy='dynamic'))
    __table_args__ = (
            db.UniqueConstraint('user_id', 'group_id', name='_user_group_uc'),)
    def __init__(self, user, group):
        self.user = user
        self.group = group

    def __repr__(self):
        msg =  '<Subscription %s to %s>'
        return msg % (self.user, self.group)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sent_user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user = db.relationship('User',
            backref=db.backref('message_user', uselist=False))
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'))
    group = db.relationship('Group',
            backref=db.backref('message_group', lazy='dynamic'))

    def __init__(self, sent_user, group, contents):
        self.sent_user = sent_user
        self.group = group
        self.contents = contents

    def __repr__(self):
        msg = '<Message "%s" to group %s'
        return msg % (self.contents, self.group)

def get_group(groupname):
    group = Group.query.filter_by(groupname=groupname).first()
    if group is None:
        print "Group %s not found" % groupname
    return group

def create_and_send_message(user, group, contents):
    new_message = Message(user, group, contents)
    add_and_commit(new_message)
    send_message(group, contents)

def send_message(group, contents):
    # TODO Send messages!
    print "Sending message to group %s:\n%s" % (group.groupname, contents)


def create_user(phone_number):
    new_user = User(phone_number)
    if add_and_commit(new_user):
        return new_user
    else:
        return User.query.filter_by(phone_number=phone_number).first()

def create_group(groupname):
    group = Group(groupname)
    if add_and_commit(group):
        return group
    else:
        return Group.query.filter_by(groupname=groupname).first()

def create_subscription(user, group):
    subscription = Subscription(user, group)
    if add_and_commit(subscription):
        return subscription
    else:
        filter_args = dict(group_id=group.id, user_id=user.id)
        return Subscription.query.filter_by(**filter_args).first()

def add_and_commit(obj):
    db.session.add(obj)
    try:
        db.session.commit()
        print "Attempt to add %s succeeded" % str(obj)
        return True
    except:
        db.session.rollback()
        print "Attempt to add %s failed" % str(obj)
        return False
    
