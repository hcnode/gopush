/**
 * Created by harry on 16/4/11.
 */
import React from 'react'
import {render, findDOMNode} from 'react-dom'
import readmin from 'readmin'
// 系统样式
import './css/app.css'
import './css/global.css'
import './css/treechart.css'
// 引用bootstrap css和js
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.js'
import 'fixed-data-table/dist/fixed-data-table.css'

import Message from './components/message'
import User from './components/user'
import OnlineUser from './components/onlineUser'

import {Table, Column, Cell} from 'fixed-data-table';

var navConf = [
	{
		text : '消息推送管理',
		items : [
			{
				id: "message",
				text: "消息管理",
				component: Message
			},{
				id: "user",
				text: "用户消息查询",
				component: User
			},{
				id: "onlineUser",
				text: "在线用户",
				component: OnlineUser
			}
		]
	}
];
function getNav() {
	var result = ['message', 'user', 'onlineUser'];
	return result;
}
readmin({
	components: navConf,
	nav: getNav(),
	componentDidMount: function () {
		$(document.body).append('<div style="position:absolute;right:10px;top:10px;">' +
			'<a href="http://reg.163.com/Logout.jsp?url=http://' + location.hostname + (location.port ? ':' + location.port : '') + '/">退出</a></div>');
	},
	index: function (that) {
		return <div>

		</div>;
	},
	containerId: 'container'
});

