module.exports = function(req){
	return new Promise((resolve, reject) => {
        var cookies = parseCookies(req);
        resolve(cookies.uid);
    });
}
function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;
    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = (parts.join('='));
    });
    return list;
}