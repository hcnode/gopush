/**
 * Created by harry on 16/4/14.
 */
var pathPrefix = 'pushManager/admin';
module.exports = {
 	flatten : obj => {
		return Object.keys(obj).reduce((newObj, key) => {
			if(Object.prototype.toString.call(obj[key].type) == '[object Object]'){
				Object.assign(newObj, module.exports.flatten(obj[key].type));
			}else{
				newObj[key] = obj[key];
			}
			return newObj;
		}, {});
	},
	getUrl: (url, method) => {
		if (method) {
			url += (url.indexOf('?') > -1 ? '&' : '?') + '_method=' + method
		}
		return url;
	},
	getAttr: schema => {
		return schema.tree;
	},
	convertSchema: schema => {
		return new mongoose.Schema(module.exports.flatten(schema));
	},
	getOptions: (that, fields, field, api, optionValue, optionText, cb) => {
		$.ajax({
			url: '/' + module.exports.getPrefix() + api,
			type: "GET",
			success: function (result) {
				var options = result.reduce((tmp, value) => {
					tmp[value[optionValue]] = value[optionText];
					if(optionText == 'name' && value.skuDesc){
						tmp[value[optionValue]] += '('+ value.skuDesc +')';
					}
					return tmp;
				}, {});
				var allOptions = that.state.options; // just for re-render, not the data source
				allOptions[field] = options;
				fields.options[field] = options;
				fields.options.raw = fields.options.raw || {}
				fields.options.raw[field] = result;
				that.setState({options: allOptions});
				cb && cb();
			}
		});
	},
	getOptionsData: ( api, optionValue, optionText, cb) => {
		$.ajax({
			url: '/' + module.exports.getPrefix() + api,
			type: "GET",
			success: function (result) {
				var options = result.reduce((tmp, value) => {
					tmp[value[optionValue]] = value[optionText];
					return tmp;
				}, {});
				cb && cb();
			}
		});
	},
	
	getPrefix : function (){
		return pathPrefix;
	},

	getApiPathPrefix : function (){
		return pathPrefix + '/rest/';
	}
}