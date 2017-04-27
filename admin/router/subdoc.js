/**
 * Created by harry on 16/5/11.
 */
/**
 * 定义sub-doc的路由
 * @param app express的app
 * @param mongoose
 * @param model model名称
 * @param subdoc 子doc名称
 * @param post
 * @param pre
 */
module.exports = function (app, router, mongoose, model, subdoc, post, pre) {
	var Model = mongoose.model(model);
	pre = pre || function (req, res, next) {
		next();
	}
	// 创建子文档
	router.post('/api/'+ model +'/:id/'+ subdoc +'', function (req, res, next) {
		pre(req, res, function (err) {
			if(err){
				res.status(400);
				res.json(err);
			}else{
				var body = req.body;
				var id = req.params.id;
				var push = {};
				push[subdoc] = req._simpleValue ? req._simpleValue : body;
				Model.update({_id : id}, {"$push": push}).then(result => {
					// return object like this : {ok: 1, nModified: 1, n: 1}
					post ? post(req, res) : res.json(result);
				}, err => {
					res.status(400);
					res.json(err);
				});
			}
		})
	});
	// 删除子文档
	router.delete('/api/'+ model +'/:id/'+ subdoc +'/:subid', function (req, res, next) {
		pre(req, res, function (err) {
			if (err) {
				res.status(400);
				res.json(err);
			} else {
				var id = req.params.id;
				var subid = req.params.subid;
				var pull = {};
				pull[subdoc] = req._simpleValue ? subid : {_id : subid};
				Model.update({_id: id}, {
					$pull: pull
				}).then(result => {
					post ? post(req, res) : res.json(result);
				}, err => {
					res.status(400);
					res.json(err);
				});
			}
		});
	});
	// 修改子文档
	router.post('/api/'+ model +'/:id/'+ subdoc + '/:subid', function (req, res, next) {
		pre(req, res, function (err) {
			if (err) {
				res.status(400);
				res.json(err);
			} else {
				var body = req.body;
				var id = req.params.id;
				var subid = req.params.subid;
				var cond = {_id : id};
				cond[subdoc + '._id'] = subid;
				var $set = {};
				Object.keys(body).forEach(key => {
					$set[subdoc + ".$." + key] = body[key];
				});
				Model.update(cond,{
					$set : $set
				}).then(result => {
					post ? post(req, res) : res.json(result);
				}, err => {
					res.status(400);
					res.json(err);
				});
			}
		});
	});
	app.use('/', router)
}