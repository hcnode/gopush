/**
 * Created by harry on 16/6/29.
 */
module.exports = {
	goods:{
		type: String,
		ref:"goods",
		text:"商品信息"
	},
	captain:{
		type: String,
		require:true,
		ref:"user",
		text:"团长"
	},
	triggerTime : {
		type : Date
	},
	orders:{
		type:[new mongoose.Schema(require('./order'))],
		text:"团内订单"
	},
	status:{
		type:Number,
		text:"状态"
	},
	create_time:{
		type:Date,
		text:"开团时间"
	},
	success_time:{
		type:Date,
		text:"成团时间"
	},
	yx_groupon_id:{
		type:String,
		text:"提供给严选用的id"
	}
};