/**
 * use seneca as microservice to do something like subscribe
 */
var config = require('../tools/getConfig')();
var getHash = require('../tools/getHash');
var getHostAndPortByHash = require('../tools/getHostAndPortByHash');
/* istanbul ignore next */ 
module.exports = function (service) {
	return function(){
		// 
		this.add('cmd:subscribe', (msg, callback) => {
			if(msg.messageId){
				service.subscribe(msg.uid, msg.messageId)
					.then(callback.bind(null, null), callback);
			}else{
				service.customSubscribe(msg.uid, msg.message, msg.sendOnlineOnly)
					.then(callback.bind(null, null), callback);
			}
		});
		// this.add('cmd:getConfig', (msg, callback) => {
		// 	console.log('cmd:getConfig');
		// 	console.log(msg)
		// 	callback(null, require('../tools/getConfig'));
		// });
		this.add('cmd:getSenecaPort', (msg, callback) => {
			var uid = msg.uid;
			if(!uid){
				callback({
					error : 'uid not found'
				})
			}else{
				var hash = getHostAndPortByHash(uid);
				callback(null, {
					port : hash.senecaPort, host : hash.host
				});
			}
		});
		this.add('cmd:checkOnline', (msg, callback) => {
			var socketId = msg.socketId;
			service.checkOnline(socketId).then(callback.bind(null, null), callback);
		});
	}
};
