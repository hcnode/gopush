var parseCookies = require('../tools/parseCookies');
module.exports = function(req){
	return new Promise((resolve, reject) => {
        var cookies = parseCookies(req);
        resolve(cookies.uid);
    });
}