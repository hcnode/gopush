const express = require('express')
const bodyParser = require('body-parser');
const fs = require('fs');
const restify = require('express-restify-mongoose');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
var getHookConfig = require("../tools/getHookConfig");

var adminHook = getHookConfig("admin");

const util2 = require('./js/util')
const moment = require('moment');
var session = require('express-session')
var conn;
var config = require('../tools/getConfig')();
var IS_NODE_ENV_PRODUCTION = (process.env.NODE_ENV === 'production');
var environment = require('../tools/getEnvironment');
conn = config.mongodb;
const request = require('request');

const app = express();
const router = express.Router();
var ursCookieCache = {};
require('run-middleware')(app);
var prefix = '/' + util2.getApiPathPrefix();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(methodOverride())
app.use(cookieParser());
app.use(require('skipper')());
app.use(session({
  secret: 'this is gopush secret'
}))
if(adminHook){
	// do something verify user
	adminHook(app);
}else{
	app.use((req, res, next) => res.send('you need a hook/admin.js to verify user'));
}

app.use('/' + util2.getPrefix(), express.static(__dirname + "/public"))

mongoose.connect(conn);
mongoose.Promise = global.Promise;

var schema = new mongoose.Schema(require('../schema/collection/event')(mongoose.Schema));
mongoose.model('event', schema);

schema = new mongoose.Schema(require('../schema/collection/client')(mongoose.Schema));
mongoose.model('client', schema);

schema = new mongoose.Schema(require('../schema/collection/message')(mongoose.Schema));
mongoose.model('message', schema);

schema = new mongoose.Schema(require('../schema/collection/user')(mongoose.Schema));
mongoose.model('user', schema);

restify.serve(router, mongoose.model('event'), {
	prefix: '/rest'
});
restify.serve(router, mongoose.model('client'), {
	prefix: '/rest'
});
restify.serve(router, mongoose.model('message'), {
	prefix: '/rest'
});
restify.serve(router, mongoose.model('user'), {
	prefix: '/rest'
});

app.use('/pushManager/admin',  router);

require('./router/index')(app, express.Router(), mongoose);

app.use(function (error, req, res, next) {
	res.send(error.stack);
});

var server = require('http').Server(app);

server.listen(6012, function () {
	console.log('Server listening on http://localhost:6012, Ctrl+C to stop')
});
