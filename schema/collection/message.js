module.exports = function (schema) {
	return {
		name: {
			type : String,
			name : 'name'
		},
		event : {
			type : String,
			name : 'event'
		},
		content: {
			type : schema.Types.Mixed,
			name : 'content'
		},
		total: {
			type : Number,
			default : 0
		},
		sentCount: {
			type : Number,
			default : 0
		}
	}
}