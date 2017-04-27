/**
 * Created by harry on 16/4/14.
 */
import React from 'react'
import commonTable from './commonTable'
import util from '../js/util'

var schema = require('../../schema/collection/user')(mongoose.Schema);
const User = commonTable({
	name : 'user',
	extendToolbar: function (that) {
		var uidInput;
		return <div>
			uid：<input className="form-control" ref={input => uidInput = input} />&nbsp; 
			<button className="btn btn-default" onClick={event => {
				that.setState({uid : uidInput.value});
				setTimeout(() => {
					that.getData();
				}, 100)
			}}>查询</button>
		</div>
	},
	fields : {
		schema : util.convertSchema(require('../../schema/collection/user').getMessageSchema(mongoose.Schema)),
		width : {
			'sentSocketId' :200,  'messageId' : 100, 'isSent' : 100, 'sendTime' : 180, 'event' : 100
		},
		columns : ['event', function (that, fields) {
			if(!fields.options.messageId) {
				util.getOptions(that, fields, 'messageId', '/rest/v1/message', '_id', 'name');
			}
			return {
				name : 'messageId',
				text : '消息名称'
			}
		}, 'isSent', 'sendTime', 'sentSocketId'],
		editFields : [
			
		],
		subDocFields : {
			
		},
		options : {
		},
		initNewModel : function () {
			return {}
		}
	},
	bind : {
	},
	api : {
		list : function(that, cb){
			if(that.state.uid){
				$.get('/'+ util.getPrefix() +'/rest/v1/user?query={"uid" : "'+ that.state.uid +'"}', function(data){
					cb(data.length == 0 ? [] : data[0].messages)
				})
			}else{
				cb([])
			}
		},
		create : null,
		update : null,
		remove : null
	}
});
export default User