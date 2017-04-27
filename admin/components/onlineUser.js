/**
 * Created by harry on 16/4/14.
 */
import React from 'react'
import commonTable from './commonTable'
import util from '../js/util'

var schema = require('../../schema/collection/client')(mongoose.Schema);
const Client = commonTable({
	name : 'client',
	extendToolbar: function (that) {
		var uidInput;
		return <div>
			<button className="btn btn-default" onClick={event => {
				$.get('/pushManager/admin/api/checkOnline', function(data){

				});
			}}>刷新在线用户</button>
		</div>
	},
	fields : {
		schema : util.convertSchema(schema),
		width : {
			'uid' :150,  'online' : 100, 'connectTime' : 180, 'socketId' : 180
		},
		columns : ['uid', 'online', 'connectTime', 'socketId'],
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
		list : '/rest/v1/client?query={"online" : true}',
		create : null,
		update : null,
		remove : null
	}
});
export default Client