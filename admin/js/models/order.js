/**
 * Created by harry on 16/6/29.
 */
module.exports = {
	user:{
		type: String,
		require:true,
		text:"用户外联"
	},
	create_time:{
		type:Date,
		default:Date.now,
		text:"订单时间"
	},
	pay_time:{
		type:Date,
		text:"付款时间"
	},
	status:{
		type:Number,
		text:"订单状态"
	},
	shipPrice:{
		type:Number,
		require:true,
		text:"物流费用"
	},
	price:{
		type:Number,
		require:true,
		text:"费用"
	},
	isRobot:{
		type:Boolean,
		default:false,
		text:"机器人订单"
	}
};