module.exports = async (port) => {
  return new Promise((resolve, reject) => {
    var app = require("express")();
    var http = require("http").Server(app);
    var io = require("socket.io")(http);
    app.get("/", function(req, res) {
      res.end("index");
    });

    io.on("connection", function(socket) {
      console.log("a user connected");
      socket.emit("port", port);
    });
    http.listen(port, function() {
      console.log("listening on *:" + port);
      require("../agent/index");
      resolve();
    });
  });
};
