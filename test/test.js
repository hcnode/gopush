var ioc = require("socket.io-client");
var assert = require("assert");
function assertClient({ product, uid, port, transport = "websocket" }) {
  var client = ioc(`ws://127.0.0.1:6003?product=${product}&uid=${encodeURIComponent(uid)}`, {
    reconnection: false,
    transports: [transport]
  });
  return new Promise(resolve => {
    client.on("connect", () => {
      console.log("connected");
    });
    client.on("port", portData => {
      if (Array.isArray(port)) {
        assert.equal(port.indexOf(portData) > -1, true);
      } else {
        assert.equal(portData, port);
      }
      resolve();
    });
  });
}
before(async () => {
  try {
    await require("./app")(3000);
    await require("./app")(3001);
    await require("./app")(3002);
    await require("./app")(3003);
    require("../agent/index");
    require("../server/server");
  } catch (error) {
    console.log(error);
  }
});
after(done => {
  process.exit(0);
  done();
});

describe("agent", function() {
  it("#websocket 1", async function() {
    await assertClient({
      product: "test",
      uid: "test1@gmail.com",
      port: 3000
    });
  });

  it("#websocket 2", async function() {
    await assertClient({
      product: "test",
      uid: "test2@gmail.com",
      port: 3001
    });
  });

  it("#websocket 3", async function() {
    await assertClient({
      product: "test2",
      uid: "test@gmail.com",
      port: [3002, 3003]
    });
  });

  it("#default", async function() {
    await assertClient({
      product: "",
      uid: "test@gmail.com",
      port: [3000]
    });
  });

  it("#polling 1", async function() {
    await assertClient({
      product: "test",
      uid: "test1@gmail.com",
      port: 3000,
      transport: "polling"
    });
  });

  it("#polling 2", async function() {
    await assertClient({
      product: "test",
      uid: "test2@gmail.com",
      port: 3001,
      transport: "polling"
    });
  });

  it("#polling 3", async function() {
    await assertClient({
      product: "test2",
      uid: "test@gmail.com",
      port: [3002, 3003],
      transport: "polling"
    });
  });
  var client1, client2;
  it("#server hello world", function(done) {
    client1 = ioc(`ws://127.0.0.1:6003?product=buitInServer&uid=${encodeURIComponent("test@gmail.com")}`, {
      reconnection: false,
      transports: ["websocket"]
    });
    client1.on("go:push", portData => {
      assert.equal(portData, "hello world");
      done();
    });
  });

  it("#server room", async function() {
    client2 = ioc(`ws://127.0.0.1:6003?product=buitInServer&uid=${encodeURIComponent("test@gmail.com")}`, {
      reconnection: false,
      transports: ["websocket"]
    });
    client1.emit('room', {
      room : 'room1'
    })
    client2.emit('room', {
      room : 'room1',
      event : 'hello',
      message : 'hello client1'
    })
    
    await Promise.all([
      new Promise(resolve => {
        client1.on('hello', msg => {
          assert.equal(msg.room, 'room1');
          assert.equal(msg.event, 'hello');
          assert.equal(msg.message, 'hello client1');
          client1.emit('room', {
            room : 'room1',
            event : 'hello',
            message : 'hello client2'
          })
          resolve()
        });
      }), 
      new Promise(resolve => {
        client2.on('hello', msg => {
          assert.equal(msg.room, 'room1');
          assert.equal(msg.event, 'hello');
          assert.equal(msg.message, 'hello client2');
          resolve()
        });
      })
    ])
  });
});
