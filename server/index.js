// Setup basic express server
var express = require('express');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var event = require('./event');
var config = require('../tools/getConfig')();
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
// only local call allow
// app.all('/internal/*', (req, res, next) => {
// 	var ip = req.ip;
// 	if(ip == '::1' || ip == '127.0.0.1' || ip == '::ffff:127.0.0.1'){
// 		next()
// 	}else{
// 		res.status(403).send('forbidden');
// 	}
// });
// // subscribe message by local call
// app.post('/internal/sub', (req, res, next) => {
// 	var userList = (req.body.uids || '').split('\n');
// 	var messageId = req.body.messageId;
// 	console.log(req.body)
// 	service.subscribe(userList, messageId).then(() => res.json({code : 200}), err => res.status(500).send(err));
// });
// // subscribe custom message by local call
// app.post('/internal/customSub', (req, res, next) => {
// 	var userList = (req.body.uids || '').split('\n');
// 	var content = req.body.content;
// 	try{
// 		service.customSubscribe(userList, JSON.parse(content)).then(() => res.json({code : 200}), err => res.status(500).send(err));
// 	}catch(e){
// 		res.stats(400).send('convert json error')
// 	}
// });
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('socket.io-redis');
var port = config.serverPortStart + (process.env.NODE_APP_INSTANCE - 0);
io.adapter(redis(config.redisAdapter));
// io.set('transports', ['websocket']);
server.listen(port ? port : config.serverPortStart, function () {
	console.log('Server listening at port %d', port);
});
// example
app.use(express.static(__dirname + '/public'));
if(config.mongodb){
	mongoose.connect(config.mongodb);
	mongoose.Promise = global.Promise;
	['event', 'client', 'message', 'user'].forEach(collection => {
		var schema = new mongoose.Schema(require(`../schema/collection/${collection}`)(mongoose.Schema));
		mongoose.model(collection, schema);
	})
}
var service = require('./service')(io);
io.on('connection', (socket) => {
	event(io)(socket);
	setTimeout(function(){
		var uid = socket.handshake.query.uid;
		if(uid){
			service.userOnlineNotify(uid, socket.id);
		}
	}, 1000)
});
// define seneca service
var Seneca = require('seneca');
var seneca = new Seneca();
var senecaPort = config.senecaPort + (process.env.NODE_APP_INSTANCE - 0);
seneca.use(require('../seneca/interface')(service)).listen(senecaPort ? senecaPort : config.senecaPort);
console.log('started push service microservice port : ' + (senecaPort ? senecaPort : config.senecaPort));