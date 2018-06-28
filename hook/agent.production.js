var parseCookies = require('../tools/parseCookies');
module.exports = function(app){
	app.use(function(req, res, next){
        var cookies = parseCookies(req);
        res.locals.uid = cookies.uid;
        next();
    });
}
