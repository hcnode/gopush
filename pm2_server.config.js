var config = require('./tools/getConfig')();
module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    // server
    {
      name      : "socket-io-server",
      script    : __dirname + "/server/index.js",
      instances : config.serverWorkers,
      exec_mode : "cluster"
    },
    // agent
    {
      name      : "socket-io-agent",
      script    : __dirname + "/agent/bin/www",
      instances : config.agentWorkers,
      exec_mode : "cluster"
    },
    // admin
    {
      name      : "socket-io-admin",
      script    : __dirname + "/admin/server.js",
      exec_mode : "fork"
    }
  ]
}
