var config = require('./tools/getConfig')();
module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    // server
    {
      name      : "gopush-server",
      script    : __dirname + "/server/server.js",
      instances : config.serverWorkers,
      exec_mode : "cluster"
    },
    // agent
    {
      name      : "gopush-agent",
      script    : __dirname + "/agent/index",
      instances : config.agentWorkers,
      exec_mode : "cluster"
    },
    // admin
    // {
    //   name      : "gopush-admin",
    //   script    : __dirname + "/admin/admin.js",
    //   exec_mode : "fork"
    // }
  ]
}
