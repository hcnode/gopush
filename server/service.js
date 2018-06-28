var mongoose = require("mongoose");
var Event = mongoose.model("event");
var Client = mongoose.model("client");
var Message = mongoose.model("message");
var User = mongoose.model("user");
var error = require("../schema/enum/error");
module.exports = function(io) {
  return {
    /**
     * subscribe message to send
     */
    subscribe: async function(uids, messageId) {
      var offlineUsers, onlineUsers, message;
      var uidMsgMap = {};
      var message = await Message.findOne({ _id: messageId }, { total: 0, sentCount: 0 }).lean();
      if (message) {
        delete message.sentCount;
        delete message.total;
      }
      var users = await this.findOnlineUsers(uids);
      // save to user collection
      await uids.reduce((promise, uid) => {
        return promise.then(result => {
          return this.saveMessage(uid, messageId, message).then(id => (uidMsgMap[uid] = id));
        });
      }, Promise.resolve());
      // update total count
      await Message.update({ _id: messageId }, { $inc: { total: uids.length } });
      onlineUsers = users;
      offlineUsers = uids.filter(uid => {
        return !onlineUsers.find(onlineUser => onlineUser.uid == uid);
      });
      try {
        await onlineUsers.reduce((promise, onlineUser) => {
          return promise.then(result => {
            // send message
            return this.publish(onlineUser.uid, onlineUser.socketId, [
              { id: uidMsgMap[onlineUser.uid], message: message.toJSON(), messageId: message._id }
            ]);
          });
        }, Promise.resolve());
      } catch (e) {
        // publish error
        console.log(error);
        throw error.PUBLISH_ERROR;
      }
    },
    /**
     * subscribe message to send
     */
    customSubscribe: async function(uids, msg, sendOnlineOnly) {
      var promise, offlineUsers, onlineUsers;
      promise = Promise.resolve();
      var uidMsgMap = {};
      var users = await this.findOnlineUsers(uids);
      if (sendOnlineOnly) {
        return users;
      } else {
        // save to user collection
        await uids.reduce((promise, uid) => {
          return promise.then(result => {
            return this.saveMessage(uid, msg).then(id => (uidMsgMap[uid] = id));
          });
        }, Promise.resolve());
      }
      onlineUsers = users;
      offlineUsers = uids.filter(uid => {
        return !onlineUsers.find(onlineUser => onlineUser.uid == uid);
      });
      try {
        return await onlineUsers.reduce((promise, onlineUser) => {
          return promise.then(result => {
            // send message
            return this.customPublish(onlineUser.uid, onlineUser.socketId, [msg], uidMsgMap[onlineUser.uid]);
          });
        }, Promise.resolve());
      } catch (error) {
        // publish error
        console.log(error);
        throw error.PUBLISH_ERROR;
      }
    },
    updateSentCount: function(messageId) {
      return Message.update({ _id: messageId }, { $inc: { sentCount: 1 } });
    },
    /**
     * send message
     */
    publish: async function(uid, socketId, messages) {
      var events = {};
      var result = await messages.reduce((promise, message) => {
        if (!message.message || !message.message.event) return promise;
        var event = message.message.event;
        return promise.then(result => {
          // io.to(socketId).emit(message.message.event, message.message);
          events[event] = events[event] || [];
          events[event].push(message);
        });
      }, Promise.resolve());
      var connectedSockets = io.of("/").connected;
      if (connectedSockets[socketId]) {
        Object.keys(events).forEach(event =>
          connectedSockets[socketId].emit(event, events[event].map(message => message.message), data => {
            if (data && data.code == 200) {
              return events[event]
                .reduce((promise, message) => {
                  if (message.messageId) {
                    promise = promise.then(result => this.updateSentCount(message.messageId));
                  }
                  return promise.then(result => this.updateUserAfterSent(uid, socketId, message.id));
                }, Promise.resolve())
                .catch(error => console.log(error));
            }
          })
        );
      }
      return result;
    },
    /**
     * send message
     */
    customPublish: function(uid, socketId, messages, id) {
      return this.publish(
        uid,
        socketId,
        messages.map(message => {
          return {
            message: message,
            id: id
          };
        })
      );
    },
    /**
     * find user whether online or not, if yes return socketId
     */
    findOnlineUsers: function(uids) {
      return Client.find({
        uid: {
          $in: uids
        },
        online: true
      });
    },
    /**
     * save message which subscribe
     */
    saveMessage: function(uid, messageId, message) {
      var id = mongoose.Types.ObjectId();
      var updateObject = {
        $set: {
          uid: uid
        },
        $push: {
          messages: {
            isSent: false,
            id: id
          }
        }
      };
      if (messageId.toString() == "[object Object]") {
        updateObject.$push.messages.message = messageId;
        updateObject.$push.messages.event = messageId.event;
      } else {
        updateObject.$push.messages.messageId = messageId;
        updateObject.$push.messages.event = message.event;
      }
      return User.update(
        {
          uid: uid
        },
        updateObject,
        { upsert: true }
      ).then(result => id);
    },
    updateUserAfterSent: function(uid, socketId, id) {
      return User.findOne({ uid: uid, "messages.id": id }).then(user => {
        if (user) {
          return User.update(
            {
              uid: uid,
              "messages.id": id
            },
            {
              $set: {
                "messages.$.isSent": true,
                "messages.$.sentSocketId": socketId,
                "messages.$.sendTime": new Date()
              }
            }
          );
        } else {
          return Promise.reject(error.USER_OR_MESSAGE_NOT_FOUND);
        }
      });
    },
    /**
     * is called when user online
     */
    userOnlineNotify: function(uid, socketId) {
      return this.findMessagesToSend(uid).then(messages => {
        // console.log(messages)
        return messages.length == 0 ? Promise.resolve() : this.publish(uid, socketId, messages);
      });
    },
    /**
     * find online user message to send
     */
    findMessagesToSend: function(uid) {
      return new Promise((resolve, reject) => {
        User.aggregate([
          {
            $match: { uid: uid }
          },
          {
            $unwind: "$messages"
          },
          {
            $match: { "messages.isSent": false }
          } /*,
                    {
                        $lookup : {
                            from: 'messages',
                            localField: 'messages.messageId',
                            foreignField: '_id',
                            as: 'message_doc'
                        }
                    },
                    {
                        $unwind : "$message_doc"
                    },
                    {
                        $project : {
                            _id : '$message_doc._id',
                            id : '$messages.id',
                            name: '$message_doc.name',
                            title: '$message_doc.title',
                            content: '$message_doc.content',
                            image: '$message_doc.image',
                            event: '$message_doc.event'
                        }
                    }*/
        ]).exec((err, result) => {
          if (err) {
            console.log(err);
            reject(error.GET_MESSAGES_AGGREGATE_ERROR);
          } else {
            Message.find({ _id: { $in: result.map(item => item.messages.messageId).filter(item => item) } }).then(
              messages => {
                result.forEach(item => {
                  if (item.messages.messageId) {
                    item.messages.message = messages.find(
                      message => item.messages.messageId.toString() == message._id.toString()
                    );
                  }
                });
                resolve(result.map(item => item.messages));
              }
            );
          }
        });
      });
    },
    /**
     * check socket if online
     */
    checkOnline: function(socketId) {
      var connectedSockets = io.of("/").connected;
      if (!connectedSockets[socketId]) {
        console.log(`${socketId} not found`);
        return Client.update({ socketId: socketId }, { online: false });
      } else {
        return Promise.resolve();
      }
    }
  };
};
