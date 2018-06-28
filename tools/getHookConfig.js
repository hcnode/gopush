var env = require("./getEnvironment");
module.exports = function(module) {
  try {
    var config = require(`${process.cwd()}/hook/${module}.${env}.js`);
    return config;
  } catch (error) {}
};
