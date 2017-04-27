require('should');
var mongoose = require('mongoose');
var mockgoose = require('mockgoose');
var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');

mongoose.Promise = global.Promise;
var schema = new mongoose.Schema(require('../../schema/collection/event')(mongoose.Schema));
var Event = mongoose.model('event', schema);

schema = new mongoose.Schema(require('../../schema/collection/client')(mongoose.Schema));
var Client = mongoose.model('client', schema);

schema = new mongoose.Schema(require('../../schema/collection/message')(mongoose.Schema));
var Message = mongoose.model('message', schema);

schema = new mongoose.Schema(require('../../schema/collection/user')(mongoose.Schema));
var User = mongoose.model('user', schema);
var service = require('../service')({
    to : function(){
        return this;
    },
    emit : function(){
        return this;
    }
})
chai.use(chaiAsPromised);

// test git merge build .........
/* global describe before it */
describe('mongoose-findCache', function () {
    var messageId, messageId2, msg, msg2, yyyMsgId;
    before(function () {
        return new Promise((resolve, reject) => {
            mockgoose(mongoose).then(function() {
                mongoose.connect('mongodb://localhost/push', function (err) {
                    Message.create([
                        {
                            name: 'new vouchers',
                            event : 'notify:newVouchers',
                            title: 'you have new vouchers',
                            content: {vouchers : [{type : 1, count :2}]}
                        },
                        {
                            name: 'new msg',
                            event : 'notify:newMsg',
                            title: 'you have new message',
                            content: {message : 'message content'}
                        }
                    ]).then(result => {
                        return Message.findOne({name: 'new vouchers'}).then(message => {
                            messageId = message._id;
                            msg = message;
                        })
                    }).then(result => {
                        return Message.findOne({name: 'new msg'}).then(message => {
                            messageId2 = message._id;
                            msg2 = message;
                        })
                    }).then(result => {
                        return Client.create([{
                            socketId : 'idxxx',
                            uid : 'xxx@163.com',
                            online : true,
                            connectTime : new Date(),
                        },{
                            socketId : 'idyyy',
                            uid : 'yyy@163.com',
                            online : false,
                            connectTime : new Date(2017,2,30),
                            disconnectTime : new Date()
                        }])
                    }).then(resolve, reject);
                });
            })
        });
    });
    describe('#service cases', function () {
        it('#subscribe 1', function () {
            return service.subscribe(['xxx@163.com', 'yyy@163.com'], messageId).then(result => {
                return User.findOne({uid : 'xxx@163.com'})
            }).then(user => {
                user.should.be.ok();
                user.messages.length.should.be.equal(1);
                user.messages[0].sentSocketId.should.be.equal('idxxx');
                user.messages[0].isSent.should.be.equal(true);
                user.messages[0].sendTime.should.be.ok();
                return User.findOne({uid : 'yyy@163.com'})
            }).then(user => {
                user.should.be.ok();
                user.messages.length.should.be.equal(1);
                user.messages[0].isSent.should.be.equal(false);
                yyyMsgId = user.messages[0].id;
                return Message.findOne({_id : messageId});
            }).then(message => {
                message.total.should.be.equal(2);
                message.sentCount.should.be.equal(1);
            });
        });
        it('#subscribe 2', function () {
            return service.subscribe(['xxx@163.com', 'yyy@163.com'], messageId2).then(result => {
                return User.find({uid : 'xxx@163.com'})
            }).then(users => {
                users.length.should.be.equal(1);
                var user = users[0];
                user.should.be.ok();
                user.messages.length.should.be.equal(2);
                user.messages[1].sentSocketId.should.be.equal('idxxx');
                user.messages[1].isSent.should.be.equal(true);
                user.messages[1].sendTime.should.be.ok();
                return User.find({uid : 'yyy@163.com'})
            }).then(users => {
                users.length.should.be.equal(1);
                var user = users[0];
                user.should.be.ok();
                user.messages.length.should.be.equal(2);
                user.messages[0].isSent.should.be.equal(false);
                return Message.findOne({_id : messageId2});
            }).then(message => {
                message.total.should.be.equal(2);
                message.sentCount.should.be.equal(1);
            });
        });
        it('#publish', function () {
            return service.publish('yyy@163.com', 'idyyy', [{id : yyyMsgId, message : msg.toJSON(), messageId : msg.toJSON()._id}]).then(result => {
                return User.findOne({uid : 'yyy@163.com'})
            }).then(user => {
                user.should.be.ok();
                user.messages.length.should.be.equal(2);
                user.messages[0].isSent.should.be.equal(true);
                user.messages[0].sendTime.should.be.ok();
                return Message.findOne({_id : messageId});
            }).then(message => {
                message.total.should.be.equal(2);
                message.sentCount.should.be.equal(2);
            });
        });
        it('#findOnlineUsers', function () {
            return service.findOnlineUsers(['xxx@163.com', 'yyy@163.com']).then(clients => {
                clients.length.should.be.equal(1);
                clients[0].uid.should.be.equal('xxx@163.com')
            });
        });
        /*it('#updateUserAfterSent', function () {
            return this.updateUserAfterSent('yyy@163.com', 'idyyy', messageId2);
        });*/
        it('#userOnlineNotify', function () {
            return Promise.resolve().then(result => {
                return User.findOne({uid : 'yyy@163.com'})
            }).then(user => {
                user.messages[1].isSent.should.be.equal(false);
                (!!user.messages[1].sendTime).should.be.not.ok();
            }).then(() => {
                return service.userOnlineNotify('yyy@163.com', 'idyyy')
            }).then(result => {
                return User.findOne({uid : 'yyy@163.com'})
            }).then(user => {
                user.messages[1].isSent.should.be.equal(true);
                user.messages[1].sendTime.should.be.ok();
                return Message.findOne({_id : messageId2});
            }).then(message => {
                message.total.should.be.equal(2);
                message.sentCount.should.be.equal(2);
            });
        });
        it('#customSubscribe', function () {
            return service.customSubscribe(['xxx@163.com', 'yyy@163.com'], {count : 10}).then(result => {
                return User.findOne({uid : 'xxx@163.com'})
            }).then(user => {
                user.should.be.ok();
                user.messages.length.should.be.equal(3);
                (!!(user.messages[2].messageId)).should.be.not.ok;
                user.messages[2].id.should.be.ok;
                user.messages[2].sentSocketId.should.be.equal('idxxx');
                user.messages[2].isSent.should.be.equal(true);
                user.messages[2].sendTime.should.be.ok();
                user.messages[2].message.count.should.be.equal(10);
                return User.findOne({uid : 'yyy@163.com'})
            });
        });
        it('#userOnlineNotify 2', function () {
            return Promise.resolve().then(result => {
                return User.findOne({uid : 'yyy@163.com'})
            }).then(user => {
                user.messages[2].isSent.should.be.equal(false);
                (!!user.messages[2].sendTime).should.be.not.ok();
            }).then(() => {
                return service.userOnlineNotify('yyy@163.com', 'idyyy')
            }).then(result => {
                return User.findOne({uid : 'yyy@163.com'})
            }).then(user => {
                user.messages[2].isSent.should.be.equal(true);
                user.messages[2].sendTime.should.be.ok();
                return Message.findOne({_id : messageId2});
            })
        });
        /*it('#findMessagesToSend', function () {
            
        });*/
        /*it('#updateSentCount', function () {
            
        });*/
    });
});