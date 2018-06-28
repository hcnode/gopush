/**
 * 服务器端
 */
var express = require("express");
var cookieParser = require("cookie-parser");
var mongoose = require("mongoose");
var event = require("./event");
var config = require("../tools/getConfig")();
var app = express();
var bodyParser = require("body-parser");
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var redis = require("socket.io-redis");
// calculate server port
var instanceIndex = process.env.NODE_APP_INSTANCE;
var port = config.serverPortStart + (typeof instanceIndex == "undefined" ? 0 : instanceIndex - 0);
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
if (config.redisAdapter) {
  io.adapter(redis(config.redisAdapter));
}
server.listen(port);
console.log("Server listening at port %d", port);
app.use(express.static(__dirname + "/public"));
if (config.mongodb) {
  mongoose.connect(config.mongodb);
  mongoose.Promise = global.Promise;
  ["event", "client", "message", "user"].forEach(collection => {
    var schema = new mongoose.Schema(require(`../schema/collection/${collection}`)(mongoose.Schema));
    mongoose.model(collection, schema);
  });
}
var service;
if (config.mongodb) {
  // service and event might use io instance to broadcast, for example
  service = require("./service")(io);
}
var eventBind = event(io);
io.on("connection", socket => {
  eventBind(socket);
  if (service) {
    setTimeout(function() {
      var uid = socket.handshake.query.uid;
      if (uid) {
        service.userOnlineNotify(uid, socket.id);
      }
    }, 1000);
  }
});
// init seneca service, each server instance bind a seneca service with increace port
if (config.senecaPort) {
  var Seneca = require("seneca");
  var seneca = new Seneca();
  var senecaPort = config.senecaPort + (typeof instanceIndex == "undefined" ? 0 : instanceIndex - 0);
  seneca.use(require("../seneca/interface")(service)).listen(senecaPort);
  console.log("started push service microservice port : " + senecaPort);
}
