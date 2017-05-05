/**
 * Created by harry on 16/4/14.
 */
import React from 'react'
import commonTable from './commonTable'
import util from '../js/util'
function showDialog(that, msg, onOk, onClose) {
	var commonDialog = {
		content: <div>
			{msg}
		</div>,
		title: '发送消息',
		onOk : onOk,
		reset : onClose
	}
	that.setState({commonDialog: commonDialog});
}
var schema = require('../../schema/collection/message')(mongoose.Schema);
const Message = commonTable({
	name : 'message',
	extendToolbar: function (that) {
		return <div>
			<button className="btn btn-default" onClick={event => {
				var eventInput, usersInput, contentInput;
				showDialog(that, <div>
						event：<br/><input type="text" ref={input => eventInput = input} /><br/><br/>
						用户uid列表(每行一个帐号)：<br/><textarea cols="60" rows="10" ref={input => usersInput = input}></textarea><br/><br/>
						消息内容(json格式)：<br/><textarea cols="60" rows="10" ref={input => contentInput = input}></textarea><br/>
						只发给在线用户：<input type="checkbox" ref={input => sendOnlineOnlyInput = input} />
					</div>, () => {
						var event = eventInput.value;
						var users = usersInput.value;
						var content = contentInput.value;
						var sendOnlineOnly = sendOnlineOnlyInput.checked;
						try{
							var contentJson = JSON.parse(content);
							contentJson.event = event;
							$.ajax({
								url: '/pushManager/admin/api/message/customSub',
								type: "POST",
								data: JSON.stringify({
									content : JSON.stringify(contentJson),
									sendOnlineOnly : sendOnlineOnly,
									uids : users
								}),
								dataType: "json",
								contentType: "application/json; charset=utf-8",
								success: function () {
									that.showInfo('done')
								},
								error: function (result) {
									that.showError(result);
								}
							});
						}catch(e){}
				}, () => {})
			}}>自定义订阅消息</button>
		</div>
	},
	fields : {
		columnTemplate : {
			sub: function (value, fields, model) {
				var that = this;
				return <button onClick={() => {
					var users;
					showDialog(that, <div>
							用户uid列表：<br/><textarea cols="60" rows="10" ref={input => users = input}></textarea>
						</div>, () => {
						$.ajax({
							url: '/pushManager/admin/api/message/sub',
							type: "POST",
							data: JSON.stringify({
								messageId : model._id,
								uids : users.value
							}),
							dataType: "json",
							contentType: "application/json; charset=utf-8",
							success: function () {
								that.showInfo('done')
							},
							error: function (result) {
								that.showError(result);
							}
						});
					}, () => {})
					
				}}>发送消息</button>
			},
		},
		schema : util.convertSchema(schema),
		width : {
			'content' : 150, 'event' : 100, 'total' : 100, 'sentCount' : 100
		},
		columns : ['name', 'content', 'event', 'total', 'sentCount', function () {
			return {
				name: 'sub',
				text : '发送消息'
			}
		}],
		editFields : ['name', 'content', 'event'],
		subDocFields : {},
		options : {},
		initNewModel : function () {
			return {}
		}
	},
	bind : {
	},
	api : {
		list : '/rest/v1/message',
		create : '/rest/v1/message',
		// create : (that, model) => {
		// 	var body = {};
		// 	Object.assign(body, model);
			
		// 	$.ajax({
		// 		url: '/pushManager/admin/api/createMessage',
		// 		type: "POST",
		// 		data: JSON.stringify(body),
		// 		dataType: "json",
		// 		contentType: "application/json; charset=utf-8",
		// 		success: function () {
		// 			that.setState({forceRefresh: true});
		// 			that.getData();
		// 			$("#listEditModal").modal('hide');
		// 			that.setState({editSchema: null});
		// 		},
		// 		error: function (result) {
		// 			that.showError(result);
		// 		}
		// 	});
		// },
		update : null,
		remove : null
	}
});
export default Message