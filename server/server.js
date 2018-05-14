/**
 * gopush server
 * use socket.io as the server framework
 */
var express = require('express');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var event = require('./event');
var config = require('../tools/getConfig')();
var app = express();
var bodyParser = require('body-parser');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('socket.io-redis');
// calculate server port
var port = config.serverPortStart + (process.env.NODE_APP_INSTANCE - 0);
port = port ? port : config.serverPortStart;
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
io.adapter(redis(config.redisAdapter));
// io.set('transports', ['websocket']);
server.listen(port, function () {
	console.log('Server listening at port %d', port);
});
app.use(express.static(__dirname + '/public'));
if(config.mongodb){
	mongoose.connect(config.mongodb);
	mongoose.Promise = global.Promise;
	['event', 'client', 'message', 'user'].forEach(collection => {
		var schema = new mongoose.Schema(require(`../schema/collection/${collection}`)(mongoose.Schema));
		mongoose.model(collection, schema);
	})
}
// service and event might use io instance to broadcast, for example
var service = require('./service')(io);
var eventBind = event(io);
io.on('connection', (socket) => {
	eventBind(socket);
	setTimeout(function(){
		var uid = socket.handshake.query.uid;
		if(uid){
			service.userOnlineNotify(uid, socket.id);
		}
	}, 1000)
});
// init seneca service, each server instance bind a seneca service with increace port
var Seneca = require('seneca');
var seneca = new Seneca();
var senecaPort = config.senecaPort + (process.env.NODE_APP_INSTANCE - 0);
seneca.use(require('../seneca/interface')(service)).listen(senecaPort ? senecaPort : config.senecaPort);
console.log('started push service microservice port : ' + (senecaPort ? senecaPort : config.senecaPort));