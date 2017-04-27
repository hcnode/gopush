module.exports = function(app){
	app.use(function(req, res, next){
        res.locals.uid = req.cookies.uid;
        next();
    });
}
