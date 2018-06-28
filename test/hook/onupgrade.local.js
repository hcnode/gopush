module.exports = function(req) {
  return new Promise((resolve, reject) => {
    var query = getQueryParam(req);
    resolve(query.uid);
  });
};
function getQueryParam(req) {
  var url = req.url;
  url = url.substring(url.indexOf("?") + 1);
  var params = url.split("&");
  return params.reduce((param, item) => {
    var [ key, value ] = item.split("=");
    return {
      ...param,
      [key]: decodeURIComponent(value)
    };
  }, {});
}
