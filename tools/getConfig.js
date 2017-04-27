module.exports = function(){
    return require(`${process.cwd()}/config/${require('./getEnvironment')}.json`);
}