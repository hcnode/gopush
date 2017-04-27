module.exports = function(schema){
    return {
        event : String,
		room : String,
		msg : schema.Types.Mixed
    }
}