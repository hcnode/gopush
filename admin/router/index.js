var request = require('request');
var mongoose = require('mongoose');
var getHostAndPortByHash = require('../../tools/getHostAndPortByHash');
const Seneca = require('seneca');
const seneca = new Seneca();
module.exports = function (app, router, mongoose) {
	// router.get('/createMessage', (req, res) => {
	// 	var body = req.body;
	// 	var Message = mongoose.model('message');
	// 	var message = new Message(body);
	// 	message.save().then(res.send.bind(res), error => res.status(500).send(error));
	// });

	router.post('/message/sub', (req, res) => {
		var userList = (req.body.uids || '').split('\n');
		var messageId = req.body.messageId;
		userList.reduce((promise, uid) => {
			var ipAndPort = getHostAndPortByHash(uid);
			return promise.then(result => {
				return new Promise((resolve, reject) => {
                    seneca.client({port : ipAndPort.senecaPort, host : ipAndPort.host}).act({cmd:'subscribe', messageId : messageId, uid : [uid]}, (err) => {
                        if(err){
                            reject (err);
                        }else{
                            resolve (message);
                        }
                    });
                });
			});
		}, Promise.resolve()).then(result => {
			res.json({code : 200});
		});
		// var promise = Promise.resolve();
		// for(var i=0;i<config.serverWorkers;i++){
		// 	(function(i){
		// 		promise.then(result => {
		// 			return new Promise((resolve, reject) => {
		// 				var subUrl = 'http://127.0.0.1:' + (config.serverPortStart + i) + '/internal/sub';
		// 				console.log(subUrl)
		// 				var r = request.post(subUrl).form(req.body).on('response', function(response) {
		// 					resolve();
		// 				});
		// 			})
		// 		})
		// 	})(i)
		// }
		// promise.then(result => {
		// 	res.json({code : 200});
		// })
	});
	router.post('/message/customSub', (req, res) => {
		var userList = (req.body.uids || '').split('\n');
		var content = req.body.content;
		var sendOnlineOnly = req.body.sendOnlineOnly;
		var message;
		try{
			message = JSON.parse(content)
		}catch(e){
			return res.stats(400).send('convert json error')
		}
		userList.reduce((promise, uid) => {
			var ipAndPort = getHostAndPortByHash(uid);
			return promise.then(result => {
				return new Promise((resolve, reject) => {
                    seneca.client({port : ipAndPort.senecaPort, host : ipAndPort.host})
						.act({cmd:'subscribe', message : message, uid : [uid], sendOnlineOnly : sendOnlineOnly}, (err) => {
                        if(err){
                            reject (err);
                        }else{
                            resolve (message);
                        }
                    });
                });
			});
		}, Promise.resolve()).then(result => {
			res.json({code : 200});
		});
	});
	
	router.get('/checkOnline', (req, res) => {
		var Client = mongoose.model('client');
		Client.find({online : true}).then(clients => {
			clients.reduce((promise, client) => {
				var uid = client.uid;
				var socketId = client.socketId;
				var ipAndPort = getHostAndPortByHash(uid);
				return promise.then(result => {
					return new Promise((resolve, reject) => {
						console.log(`uid:${uid}, socketId:${socketId}`);
						seneca.client({port : ipAndPort.senecaPort, host : ipAndPort.host}).act({cmd:'checkOnline', socketId : socketId}, (err) => {
							if(err){
								reject (err);
							}else{
								resolve ();
							}
						});
					});
				});
			}, Promise.resolve()).then(result => {
				res.json({code : 200});
			});
		})
	});
    app.use('/pushManager/admin/api',  router);
}