module.exports = function(){
    var config = require(`${process.cwd()}/config/${require('./getEnvironment')}.json`);
    return config;
}