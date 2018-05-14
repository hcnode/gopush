var getHash = require('./getHash');
var config = require('./getConfig')();
module.exports = function(uid){
    var hash = getHash(uid);
    return {
        host : config.serverIps[hash % config.serverIps.length],
        serverPort : config.serverPortStart + (hash % config.serverWorkers),
        senecaPort : config.senecaPort + (hash % config.serverWorkers)
    }
}