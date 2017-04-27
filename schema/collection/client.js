module.exports = function (schema) {
	return {
		socketId: {
			type: String,
			index: true
		},
		uid: {
			type: String,
			index: true
		},
		server : {
			type: {
				ip : {
					type : String
				},
				port : {
					type : String
				}
			}
		},
		online: {
			type: Boolean,
			index: true,
			text : "是否在线"
		},
		connectTime: {
			type : Date,
			text : "连接时间"
		},
		disconnectTime: {
			type : Date,
			text : "断开时间"
		},
	}
}