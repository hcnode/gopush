var mongoose = require('mongoose');
var config = require('../tools/getConfig')();

module.exports = function(io, service){
    return function(socket){
        var uid = socket.handshake.query.uid;
        if(!uid){
            return console.log('uid not found');
        }
        if(config.mongodb){
            var Client = mongoose.model('client');
            var client = {
                socketId : socket.id,
                online : true,
                uid : uid,
                connectTime : Date.now()
            };
            // record online info
            Client.update({uid : uid}, {
                $set : client
            }, {upsert : true}).then(result => {
                console.log('connected:' + socket.id);
            }, error => console.log(error))
        }
        // handle room event, if event in data, then emit this event in this room
        socket.on('room', function(data) {
            var room = data.room;
            var event = data.event;
            if(room){
                var fixRoomName = 'room:' + room;
                if(socket.room && socket.room != room)
                    socket.leave(socket.room);
                socket.room = fixRoomName;
                socket.join(fixRoomName);
                if(event){
                    socket.to(fixRoomName).emit(data.event, data);
                }
            }
        });
        socket.on('disconnect', function () {
            // record disconnect time
            if(config.mongodb){
                var Client = mongoose.model('client');
                Client.update({socketId : socket.id}, {$set : {disconnectTime : Date.now(), online : false}}).then(result => {
                    console.log('disconnect:' + socket.id)
                }, error => console.log(error))
            }
        });
        setTimeout(function(){socket.emit("connected", "hello world");}, 1000)
        
    }
} 