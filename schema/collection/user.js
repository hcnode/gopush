var getMessageSchema = function(schema){
	return {
		messageId : schema.Types.ObjectId,
		id : schema.Types.ObjectId,
		sentSocketId : {
			type : String
		},
		isSent : {
			type : Boolean,
			index : true,
			text : "是否已发送"
		},
		sendTime : {
			type : Date,
			text : "发送时间"
		},
		message : {
			type : schema.Types.Mixed,
			text : '消息体'
		},
		event : {
			type : String,
			index : true,
			text : "事件"
		},
		createdAt : {
			type : Date,
			text : "创建时间",
			default : Date.now
		}
	}
}
module.exports = function(schema){
    return {
        uid : {
			type : String,
			index : true
		},
		messages : [new schema(getMessageSchema(schema))]
    }
}
module.exports.getMessageSchema = function(schema){
	return getMessageSchema(schema)
}