require("ts-node/register");
var app = require("./app");
var debug = require("debug")("agent2:server");
var http = require("http");
var request = require("request");
var config = require("../tools/getConfig")();
var fs = require("fs");
var fayeWebsocket = require("faye-websocket");
var environment = require("../tools/getEnvironment");
var getHash = require("../tools/getHash");
var parseCookies = require("../tools/parseCookies");
var upgrade = require("upgrade");
var getHookConfig = require("../tools/getHookConfig");
var upgradeMiddleware = getHookConfig("onupgrade");
var agentMiddleware = getHookConfig("agent");
var destConfig = getHookConfig("dest");
/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || config.agentPort);
app.set("port", port);

var server = http.createServer(app);
if (agentMiddleware) {
  // do something to verify to get uid
  agentMiddleware(app);
} else {
  app.use((req, res, next) => res.send("you need a hook/agent-middleware.js to save user to res.locals.uid"));
}
/**
 * 获取目标服务
 * @param {*} req
 * @param {*} res
 */
async function getDest(req, uid, res) {
  var cookies = parseCookies(req);
  // 如果有cookie，则是第一次请求保存的服务信息
  if (cookies["dest"]) {
    var [destName, ip, port] = decodeURIComponent(cookies["dest"]).split(":");
    ip -= 0;
    port -= 0;
    var dests = dest[destName];
    if (dests[ip] && dests[ip].ports[port]) {
      return {
        ip: dests[ip].ip,
        port: dests[ip].ports[port]
      };
    }
  }
  var query = req.query || getQueryParam(req);
  var destInfo = destConfig[query.product];
  if (destInfo) {
    var ipAndPort;
    var isArray = Array.isArray(destInfo);
    if (!isArray) {
      ipAndPort = await destInfo(req, uid);
    } else {
      // var rndServer = Math.floor(Math.random() * destInfo.length);
      // var destServer = destInfo[rndServer];
      // var ip = destServer.ip;
      // var rndPort = Math.floor(Math.random() * destServer.ports.length);
      // var port = destServer.ports[rndPort];

      var port = getPort(uid, destInfo);
      var ip = getServerIp(uid, destInfo);
      ipAndPort = {
        ip,
        port
      };
    }
    return ipAndPort;
  }
}
/**
 * 代理http
 */
app.use(async function(req, res, next) {
  var port, ip;
  var query = req.query;
  if(!query.product){
    return res.end("product not found");
  }
  // 如果存在dest参数或者cookie，则走目标代理流程，否则使用配置
  var dest = (await getDest(req, res.locals.uid, res)) || {};
  port = dest.port;
  ip = dest.ip;
  if (!ip || !port) {
    return res.end("service not found");
  }
  res.cookie("agent-info", port);
  console.log(
    `${req.protocol}://${ip}:${port}:${req.originalUrl}:${req.get("x-forwarded-for")}:${req.get("Upgrade")}:${req.get(
      "Connection"
    )}`
  );
  var url = `http://${ip}:${port}${req.originalUrl}`;
  if (url.indexOf("?") > -1) {
    url += `&uid=${res.locals.uid}`;
  } else {
    url += `?uid=${res.locals.uid}`;
  }
  req.pipe(request(url)).pipe(res);
});
/**
 * 代理websocket
 */
server.on("upgrade", async function(req, socket, body) {
  var uid;
  try {
    if (upgradeMiddleware) {
      uid = await upgradeMiddleware(req);
    }
    if (!uid) {
      throw "uid not found";
    }
    var query = getQueryParam(req)
    if(!query.product){
      return res.end("product not found");
    }
    var dest = (await getDest(req, uid)) || {};
    var {port, ip} = dest;
    if (!ip || !port) {
      throw "service not found";
    }
    // 前端websocket请求
    var frontend = new fayeWebsocket(req, socket, body),
      // 后端websocket请求
      backend = new fayeWebsocket.Client(`ws://${ip}:${port}${req.url}`);
    // console.log(req.url)
    frontend.on("error", function(event) {
      console.log(`frontend:error:ws://${ip}:${port}:${req.url}:${req.headers["x-forwarded-for"]}`);
    });
    backend.on("error", function(event) {
      console.log(`backend:error:ws://${ip}:${port}:${req.url}:${req.headers["x-forwarded-for"]}`);
    });
    console.log(`ws://${ip}:${port}:${req.url}:${req.headers["x-forwarded-for"]}`);
    // 前端pipe后端，后端再pipe前端，形成双工通讯
    frontend.pipe(backend).pipe(frontend);
  } catch (e) {
    console.log(e);
    sendSocketError(req, socket, body);
  }
});
/**
 * websocket返回错误
 * @param {*} req
 * @param {*} socket
 * @param {*} body
 */
function sendSocketError(req, socket, body) {
  var send = upgrade.getSend(socket);
  upgrade.writeHead(req, socket);
  send("403 error");
}
/**
 * 获取参数
 * @param {*} req
 */
function getQueryParam(req) {
  var url = req.url;
  url = url.substring(url.indexOf("?") + 1);
  var params = url.split("&");
  return params.reduce((param, item) => {
    return {
      ...param,
      [item.split("=")[0]]: item.split("=")[1]
    };
  }, {});
}
/**
 * hash uid返回的端口
 * @param {*} uid
 */
function getPort(uid, destInfo) {
  var serverIndex = getHash(uid) % destInfo.length;
  var portIndex = getHash(uid) % destInfo[serverIndex].ports.length;
  var port = destInfo[serverIndex].ports[portIndex];
  return port;
}
/**
 * hash uid返回的ip
 * @param {*} uid
 */
function getServerIp(uid, destInfo) {
  var index = getHash(uid) % destInfo.length;
  return destInfo[index].ip;
}
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
console.log(`listen port: ${port}`);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}
