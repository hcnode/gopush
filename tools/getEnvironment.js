var IS_NODE_ENV_PRODUCTION = (process.env.NODE_ENV === 'production');
module.exports = IS_NODE_ENV_PRODUCTION ? 'production' 
        : (require('os').platform() == 'darwin' || require('os').platform() == 'win32') ? 'local' : 'develop'