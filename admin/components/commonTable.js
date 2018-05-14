/**
 * 通用后台管理列表类
 * Created by harry on 16/4/13.
 */

import React from 'react'
import {render, findDOMNode} from 'react-dom'
import {Table, Column, Cell} from 'fixed-data-table';
import EditDialog from './editDialog'
import RemoveDialog from './removeDialog'
import CommonDialog from './commonDialog'
import SubDocDialog from './subDocDialog'
import moment from 'moment'
import util from '../js/util'

// notifications
import '../css/bootstrap-notify.css'
import '../js/bootstrap-notify.js'

import '../css/mask.css'
import Select, {Option, OptGroup} from 'rc-select';
require('rc-select/assets/index.css');

var co = require('co');

export default config => {
	// 字段相关配置
	const fields = config.fields;
	// api配置
	const api = config.api;
	// component方法bind
	const bind = config.bind;
	const componentWillReceiveProps = config.componentWillReceiveProps;
	// table props
	const rowClassNameGetter = (config.table || {}).rowClassNameGetter;
	// 扩展工具栏
	const extendToolbar = config.extendToolbar || function () {
		return null
	};
	return React.createClass({
		/**
		 * 获取列表数据
		 */
		getData(){
			const that = this;
			// 自定义list接口
			if (typeof api.list == "function") {
				api.list(that, (data) => {
					that.setState({rows: data, rawRows : data, forceRefresh : false});
				});
			} else {
				$.get(util.getUrl('/' + util.getPrefix() + api.list), result => {
					that.setState({rows: result, rawRows : result});
				});
			}
		},
		forceRefresh(){
			this.setState({rows : null, rawRows : null});
			setTimeout(() => {this.getData();}, 0)
		},
		/**
		 * 绑定component
		 */
		bindThis(){
			const that = this;
			if (bind) {
				Object.keys(bind).forEach(value => that[value] = bind[value].bind(that))
			}
		},
		setLoading(isLoading){
			this.setState({isLoading: isLoading});
		},
		getInitialState() {
			const that = this;
			this.bindThis();
			setTimeout(() => {
				that.getData();
			}, 0);
			return {
				rows: [],
				extraContent: null,
				options: {},
				commonDialog: {},
				subDocDialog: {},
				columnWidths: {},
				isLoading: false
			};
		},
		componentWillReceiveProps(nextProps){
			if (componentWillReceiveProps) {
				componentWillReceiveProps(this, nextProps)
			}
		},
		/**
		 * 获取单元格的值
		 * @param field 字段
		 * @param value 数据
		 * @param model
		 * @param _fields
		 * @param columns
		 * @returns {*}
		 */
		getValue(field, value, model, _fields, columns){
			if (_fields.columnTemplate && _fields.columnTemplate[field.name]) {
				var result = _fields.columnTemplate[field.name].call(this, value, _fields, model);
				return result;
			}
			if (field.type == Date) { // 日期类型
				return (value == -1 || !value) ? '-' : moment(value).format('YYYY-MM-DD HH:mm:ss');
			} else if (_fields.options && _fields.options[field.name]) { // 列表类型
				var options = _fields.options[field.name];
				var result;
				if ($.type(options) == 'function') {
					result = options()[value + ''] || '';
				} else {
					result = _fields.options[field.name][value + ''] || '';
					if(!model['options_' + field.name]){
						model['options_' + field.name] = result;
					}
				}
				if (typeof result == 'undefined') {
					return ''
				} else {
					return result;
				}
			} else if ($.type(field.type) == 'array') { // 数组类型
				return <button className="btn btn-default btn-xs" onClick={this.manageSubDoc(field, value, model)}>
					管理</button>
			} else {
				return typeof value == 'boolean' ? value ? 'true' : 'false' : value;
			}
		},
		sort(item, rows){
			if (item) {
				rows = rows || this.state.rows;
				var name = item.name;
				var sort = item.sort;
				rows.sort((a, b) => {
					return a[name] == b[name] ? 0 : a[name] > b[name] ? (sort ? 1 : -1) : (sort ? -1 : 1);
				});
				this.setState({
					rows: this.state.rows
				});
				item.sort = !item.sort;
			}
		},
		getColumns(columns, rows, _fields, onRemove, onCreate, onUpdate, reloadSubDoc){
			var that = this;
			rows = rows || this.state.rows;
			_fields = _fields || fields;
			columns = columns || _fields.columns;
			var result = columns.map(field => {
				var item = typeof field == "function" ? field(that, _fields) : _fields.schema.tree[field];
				if (!item) {
					console.log(field);
					return null;
				}
				item.name = item.name || field;
				var fieldName = item.name;
				var width = _fields.width[fieldName];
				return <Column
					header={<Cell><span onClick={event => {
						this.sort(item, rows);
						reloadSubDoc();
					}}>{item.text || item.name}</span></Cell>}
					cell={(cell, ...props) => {
						var row = rows[cell.rowIndex];
						if (row) {
							return <Cell>
								{this.getValue(item, row[fieldName], row, _fields, columns)}
							</Cell>
						} else {
							if ('create' in _fields.actions && !_fields.actions.create) {
								return null;
							} else {
								var options = _fields.options && _fields.options[item.name];
								var editField = _fields.editFields.find(field => item.name == (field.name || field));
								return <Cell {...props}>
									{
										editField ?
											options ?
												item.name != 'goods' ? <select className="form-control" name={item.name} onChange={(event) => {
													if (_fields.onChange) {
														_fields.onChange(item.name, event.target.value, event.target);
													}
												}}>
													<option value="">请选择</option>
													{
														Object.keys(options).map(option => {
															var optionHtml = <option
																value={option}>{options[option]}</option>;
															if (editField.filter) {
																return editField.filter.includes(option) ? optionHtml : null;
															} else {
																return optionHtml;
															}
														})
													}
												</select> : 
												<Select
												name={item.name}
										          style={{ width: 200 }}
										          onChange={(selectValue, event) => {
										          	if (_fields.onChange) {
														_fields.onChange(item.name, selectValue, null);
													}
													this.setState({
												      selectValue
												    });
										          }}
										          defaultActiveFirstOption={false}
										          notFoundContent=""
										          allowClear
										          placeholder="please select"
										          combobox
										          value={this.state.selectValue}
										          filterOption={(value, option) => {
										          	return option.props.value.indexOf(value) > -1 || 
										          		option.props.children.indexOf(value) > -1
										          }}
										        >
													<option value="">请选择</option>
													{
														Object.keys(options).map(option => {
															var optionHtml = <option
																value={option}>{options[option]}</option>;
															if (editField.filter) {
																return editField.filter.includes(option) ? optionHtml : null;
															} else {
																return optionHtml;
															}
														})
													}
												</Select>: <input className='subDocInput' type={item.type == Boolean ? 'checkbox' : 'text'}
																   name={item.name}/> : null
									}
								</Cell>
							}
						}
					}}
					width={this.state.columnWidths[field] || width || 200}
					columnKey={field}
					isResizable={true}
				/>
			});
			result.push(<Column
				header={<Cell>操作</Cell>}
				cell={(cell, ...props) => {
					var row = rows[cell.rowIndex];
					return row ? _fields.isSubDoc ? <Cell>
						{_fields.actions.remove ? <i
							style={{cursor: "pointer"}}
							onClick={() => {
								if ($.type(_fields.actions.remove) == 'function') {
									_fields.actions.remove(rows[cell.rowIndex]);
								} else {
									onRemove(rows[cell.rowIndex]);
								}
							}}
							className="glyphicon glyphicon-remove"
							title="删除"
							aria-hidden="true"/> : null}&nbsp;

						{_fields.actions.update ? <i
							style={{cursor: "pointer"}}
							onClick={(event) => {
								var target = event.target;
								var cells = $(target).parents('.fixedDataTableCellGroupLayout_cellGroup')
									.find('.fixedDataTableCellLayout_main')
								Array.from(cells)
									.filter((cell, i) => {
										var column = _fields.columns[i];
										if (i == cells.length - 1 || !column) return false;
										if (typeof column != 'string') {
											column = column(that, _fields).name;
										}
										cell.field = column;
										var editFields = _fields.editExistFields || _fields.editFields;
										return editFields.find(field => {
											return typeof field == 'string' && column == field
										})
									})
									.forEach(cell => {
										var el = $(cell).find('.public_fixedDataTableCell_cellContent');
										cell._raw = el[0].innerHTML;
										el.html(function (i) {
											return '<div><input value="' + el[i].innerHTML + '" id="' + cell.field + '" /></div>'
										})
									})
								var inputs = cells.find('input');
								inputs.on('blur', function () {
									var newValue = Array.from(inputs).reduce((tmp, input) => {
										tmp[input.id] = input.value;
										return tmp;
									}, {})
									onUpdate($.extend({}, rows[cell.rowIndex], newValue));
									Array.from(cells).forEach(cell => {
										var el = $(cell).find('.public_fixedDataTableCell_cellContent');
										if(el.find('input')[0]) {
											el.html(el.find('input')[0].value);
										}
									});
								});
							}}
							className="glyphicon glyphicon-cog"
							title="修改"
							aria-hidden="true"/> : null}
					</Cell> : <Cell>
						{ this.apiAvailable(api.remove, this.state.rows[cell.rowIndex]) ? <i
							style={{cursor: "pointer"}}
							onClick={() => {
								this.setState({removeModel: rows[cell.rowIndex]})
							}}
							className="glyphicon glyphicon-remove"
							title="删除"
							aria-hidden="true"/> : null} &nbsp;&nbsp;
						{ this.apiAvailable(api.update, this.state.rows[cell.rowIndex]) ? <i
							style={{cursor: "pointer"}}
							onClick={() => this.setState({
								editModel: this.state.rows[cell.rowIndex]
								, editSchema: fields.editFields.map(field => {
									var schema = $.extend({editField: field}, fields.schema.tree[field]);
									schema.name = field;
									return schema;
								})
							})}
							className="glyphicon glyphicon-cog"
							title="修改"
							aria-hidden="true"/> : null} &nbsp;&nbsp;
						{
							config.operate ? config.operate(this, cell) : null
						}
					</Cell> : <Cell>
						<i
							style={{
								cursor: "pointer",
								display: ('create' in _fields.actions && !_fields.actions.create) ? 'none' : ''
							}}
							onClick={(event) => {
								var rowElement = event.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
								var newValue = {};
								var inputs = rowElement.getElementsByTagName('input');
								for (var i = 0; i < inputs.length; i++) {
									var inputValue = inputs[i].value.trim();
									if (inputValue != '')
										newValue[inputs[i].name || 'goods'] = inputValue;
								}
								var selects = rowElement.getElementsByTagName('select');
								for (var i = 0; i < selects.length; i++) {
									var inputValue = selects[i].value.trim();
									if (inputValue != '')
										newValue[selects[i].name] = inputValue;
								}
								onCreate(newValue);

							}}
							className="glyphicon glyphicon-plus"
							title="添加"
							aria-hidden="true"/>
					</Cell>
				}}
				width={100}
			/>);
			if (!_fields.isSubDoc) {
				result.splice(0, 0, <Column
					header={<Cell>序号</Cell>}
					cell={(cell, ...props) => {
						return <Cell>{cell.rowIndex + 1}</Cell>
					}}
					width={50}
				/>);
			}
			return result;
		},
		apiAvailable(api, model){
			if (api) {
				if ($.type(api) == 'function') {
					return true;
				} else {
					return true;
				}
			} else {
				return false;
			}
		},
		manageSubDoc(field, value, model){
			var that = this;
			var type = field.type[0];
			var isSchema = type instanceof mongoose.Schema;
			value = value || [];
			var _fields = fields.subDocFields[field.name];
			var queryList = value.length == 0 && _fields.actions && typeof _fields.actions.list == 'function';

			function getList() {
				if (isSchema) {
					return <div>
						<Table
							rowHeight={45}
							rowsCount={value.length + 1}
							width={1000}
							height={500}
							headerHeight={40}>
							{
								that.getColumns(_fields.columns, value, _fields,
									model => remove(model),
									model => add(model),
									model => update(model),
									() => {that.manageSubDoc(field, value, model)()}
								)
							}
						</Table>

						<div>
							{
								_fields.extend ? _fields.extend.call(that, model) : null
							}
						</div>
					</div>;
				} else {
					return <div>
						<ul>{
							value.map((item, i) => {
								return <li>{item}&nbsp;<a className="btn btn-default btn-xs" onClick={() => {
									remove(i)
								}}>删除</a></li>;
							})
						}</ul>
						<div><input id="subDocCreate"/>&nbsp;
							<button className="btn btn-default btn-xs" onClick={() => {
								add();
							}}>添加
							</button>
						</div>
					</div>
				}
			}

			function remove(removeModel) {
				var removeUrl = '/'+ util.getPrefix() +'/api/' + config.name + '/' + model._id + '/' + field.name + '/' + (removeModel._id || removeModel.item);
				$.ajax({
					method: 'post',
					url: util.getUrl(removeUrl, 'DELETE'),
					data: JSON.stringify({}),
					headers: {
						'X-HTTP-Method-Override': 'DELETE'
					},
					dataType: "json",
					contentType: "application/json; charset=utf-8",

					success: function () {
						if(queryList){
							that.manageSubDoc(field, model[field.name], model)();
						}else {
							model[field.name] = model[field.name] || [];
							if ($.type(removeModel) == 'number') {
								model[field.name].splice(removeModel, 1);
							} else {
								model[field.name] = model[field.name].filter(item => (item._id || item.item) != (removeModel._id || removeModel.item));
							}
							that.setState({editModel: model});
							that.manageSubDoc(field, model[field.name], model)();
							// that.getData();
						}
					},
					error: function (result) {
						that.showError(result)
					}
				})
			}

			function add(newValue) {
				newValue = newValue || $("#subDocCreate").val();
				if ($.type(newValue) == "object") {
					newValue.createdAt = new Date();
				}
				$.ajax({
					url: '/'+ util.getPrefix() +'/api/' + config.name + '/' + model._id + '/' + field.name,
					type: "POST",
					data: JSON.stringify(newValue),
					dataType: "json",
					contentType: "application/json; charset=utf-8",
					success: function (savedData) {
						// return object like this : {ok: 1, nModified: 1, n: 1}
						// why dont return the inserted obj?
						if(queryList){
							that.manageSubDoc(field, model[field.name], model)();
						}else {
							model[field.name] = model[field.name] || [];
							model[field.name].push(newValue);
							that.setState({editModel: model, forceRefresh: true});
							that.manageSubDoc(field, model[field.name], model)();
							that.getData();
						}
					},
					error: function (result) {
						that.showError(result)
					}
				})
			}

			function update(newValue) {
				if ($.type(newValue) == "object") {
					newValue.updatedAt = new Date();
				}
				$.ajax({
					url: '/'+ util.getPrefix() +'/api/' + config.name + '/' + model._id + '/' + field.name + '/' + newValue._id,
					type: "POST",
					data: JSON.stringify(newValue),
					dataType: "json",
					contentType: "application/json; charset=utf-8",
					success: function () {
						if(queryList){
							that.manageSubDoc(field, model[field.name], model)();
						}else {
							that.setState({editModel: model, forceRefresh: true});
							that.manageSubDoc(field, model[field.name], model)();
							that.getData();
						}
					},
					error: function (result) {
						that.showError(result)
					}
				})
			}

			return function () {
				co(function *(){
					if(queryList){
						value = yield new Promise((resolve, reject) => {
							_fields.actions.list(model, resolve);
						});
					}
					var subDocDialog = {
						content: <div>
							{
								getList()
							}

						</div>,
						title: '编辑' + field.text
					};
					that.setState({subDocDialog: subDocDialog});
				}).catch(err => {
					console.log(err);
				});
			}
		},
		showError(result){
			var text = result.responseText ? result.responseText : typeof result == "string" ? result : ''
			var regUnique = /expected `(.+?)` to be unique/;
			var reqRequire = /"Path `(.+?)` is required."/;
			var msg;
			if (result.responseJSON) {
				msg = JSON.stringify(result.responseJSON.errors || result.responseJSON);
				var regField = regUnique.test(msg) && RegExp.$1;
				if (regField) {
					text = (fields.schema.tree[regField] && fields.schema.tree[regField].text || regField) + " 不能重复";
				} else {
					regField = reqRequire.test(msg) && RegExp.$1;
					if (regField) {
						text = (fields.schema.tree[regField] && fields.schema.tree[regField].text || regField) + " 为必填";
					}
				}
			}

			$('.top-right').notify({
				message: {text: text || msg}
			}).show();
		},
		showInfo(msg){
			$('.top-right').notify({
				message: {text: msg}
			}).show();
		},
		remove(row, smsCode){
			const that = this;
			var url;
			if (typeof api.remove == "function") {
				return api.remove(row);
			} else {
				url = '/' + util.getPrefix() + api.remove;
			}
			$.ajax({
				method: 'post',
				url: util.getUrl(url + '/' + row._id + (that.state.showSms ? '?smsCode=' + smsCode : ''), 'DELETE'),
				data: JSON.stringify({}),
				headers: {
					'X-HTTP-Method-Override': 'DELETE'
				},
				dataType: "json",
				contentType: "application/json; charset=utf-8",
				success: function () {
					$("#listRemoveModal").modal('hide');
					setTimeout(
						function () {
							that.getData();
						}
						, 300);
				},
				error: function (result) {
					if (result.status == 401) {
						that.setState({showSms: true});
					} else {
						that.showError(result);
					}
				}
			})
		},
		create(){
			var state = {
				editSchema: fields.editFields.map(field => {
					var schema = $.extend({editField: field /*传入原始属性*/}, fields.schema.tree[(field.name || field)]);
					schema.name = field.name || field;
					return schema;
				})
			};
			if (fields.initNewModel) {
				state.editModel = fields.initNewModel();
			}
			this.setState(state);
		},
		save(model, smsCode){
			const that = this;
			var url, body;
			var action = '_id' in model ? 'update' : 'create';
			if (typeof api[action] == "function") {
				return api[action](that, model);
			} else {
				url = '/' + util.getPrefix() + api[action];
				body = model;
			}
			/*var requireField = Object.keys(fields.schema.tree).find(field => fields.schema.tree[field].required && !body[field]);
			if (requireField) {
				return that.showError('请输入“' + (fields.schema.tree[requireField].text || fields.schema.tree[requireField].name) + '”');
			}*/
			if ('_id' in model) {
				if (fields.editFields) {
					body = fields.editFields.reduce((tmp, field) => {
						tmp[field] = model[field];
						return tmp;
					}, {});
				}
			}
			$.ajax({
				url: util.getUrl(url + ('_id' in model ? ('/' + model._id) : '') + (that.state.showSms ? '?smsCode=' + smsCode : '')),
				type: "POST",
				data: JSON.stringify(body),
				dataType: "json",
				headers: '_id' in model ? {
					'X-HTTP-Method-Override': 'PATCH'
				} : null,
				contentType: "application/json; charset=utf-8",
				success: function () {
					that.setState({forceRefresh: true});
					that.getData();
					$("#listEditModal").modal('hide');
					that.setState({editSchema: null});
				},
				error: function (result) {
					if (result.status == 401) {
						that.setState({showSms: true});
					} else {
						that.showError(result);
					}
				}
			});
		},
		getCommonDialog(title, content, buttons){
			return <div className="modal fade" id="commonModal" tabindex="-1" role="dialog"
						aria-labelledby="myModalLabel">
				<div className="modal-dialog modal-lg" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span
								aria-hidden="true">&times;</span></button>
							<h4 className="modal-title">{title}</h4>
						</div>
						<div className="modal-body">
							{
								content
							}
						</div>
						<div className="modal-footer">
							{
								buttons
							}
						</div>
					</div>
				</div>
			</div>
		},
		showConfirm(msg, onOk, onClose) {
			var commonDialog = {
				content: <div>
					{msg}
				</div>,
				title: '操作确定',
				onOk: onOk,
				reset: onClose
			}
			this.setState({commonDialog: commonDialog});
		},
		_onColumnResizeEndCallback(newColumnWidth, columnKey) {
			this.setState(({columnWidths}) => ({
				columnWidths: {
					...columnWidths,
					[columnKey]: newColumnWidth,
				}
			}));
		},
		render() {
			return <div className={this.props.hide ? 'hide' : ''}>
				<div id="dvLoadingMask">
					<div className="loadingMask global"
						 style={{width: '100%', height: '100%', display: this.state.isLoading ? '' : 'none'}}>
						<div className="backColor"></div>
						<div className="backGif"></div>
					</div>
				</div>
				<div>
					<form method="post" id="frmExport2xls" ref={c => this._form = c} action="/goodsManager/query/export2xls">
						<input type="hidden" id="txtJSON" name="json" value={JSON.stringify(this.state.rows)}/>
						<input type="hidden" name="headers"
							   value={JSON.stringify(Object.keys(fields.schema.tree).map(field => {
								   return {
									   name: field,
									   text: fields.schema.tree[field].text
								   }
							   }))}/>
					</form>

				</div>
				<div style={{marginBottom: "10px", lineHeight: "40px"}} className="form-inline">
					<button className="btn btn-default" onClick={() => {
						this.forceRefresh();
					}}>刷新
					</button>&nbsp;&nbsp;
					<button className="btn btn-default" onClick={() => {
						if (this.state.rows) {
							this._form.submit();
						}
					}}>导出xls
					</button>
					&nbsp;&nbsp;
					搜索: <input className="form-control" onChange={event => {
						var value = event.target.value;
						this.setState({searchKey : value});
						if(value){
							var rows = this.state.rawRows;
							rows.forEach(row => {
								Object.keys(row).forEach(field => {
									if(this.state.options && this.state.options[field] 
										&& this.state.options[field][row[field]]){
										row['options_' + field] = this.state.options[field][row[field]]
									}
								});
							});
							if(rows) {
								this.setState({
									rows: rows.filter(row => {
										return Object.keys(row).reduce((tmp, key) => {
											return tmp || new RegExp(value).test(row[key] + '');
										}, false);
									})
								});
							}
						}else{
							this.setState({rows : this.state.rawRows || []});
						}
					}} />
					&nbsp;&nbsp;
					{api.create ? <button className="btn btn-primary" onClick={this.create}>添加</button> : null}
					{
						extendToolbar(this)
					}
				</div>
				<Table
					rowClassNameGetter={(row) => {
						return rowClassNameGetter && rowClassNameGetter(this.state.rows[row]);
					}}
					rowHeight={45}
					rowsCount={(this.state.rows || []).length}
					width={document.body.clientWidth - 220 - 50}
					height={document.body.clientHeight - 300}
					onColumnResizeEndCallback={this._onColumnResizeEndCallback}
					headerHeight={config.headerHeight || 40}
					isColumnResizing={false}
				>
					{this.getColumns()}
				</Table>
				<EditDialog
					schema={this.state.editSchema}
					fields={fields}
					save={this.save}
					showSms={this.state.showSms}
					model={this.state.editModel}
					reset={() => this.setState({editSchema: null, showSms: false})}
				/>
				<RemoveDialog
					model={this.state.removeModel}
					fields={fields}
					remove={this.remove}
					showSms={this.state.showSms}
					reset={() => this.setState({removeModel: null, showSms: false})}
				/>
				<CommonDialog
					model={this.state.editModel}
					content={this.state.commonDialog.content}
					title={this.state.commonDialog.title}
					onOk={this.state.commonDialog.onOk}
					showSms={this.state.showSms}
					reset={() => {
						if (this.state.commonDialog.reset) {
							this.state.commonDialog.reset();
						}
						this.setState({commonDialog: {}, showSms: false})
					}}
				/>
				<SubDocDialog
					model={this.state.editModel}
					content={this.state.subDocDialog.content}
					title={this.state.subDocDialog.title}
					onOk={this.state.subDocDialog.onOk}
					showSms={this.state.showSms}
					reset={() => {
						if (this.state.subDocDialog.reset) {
							this.state.subDocDialog.reset();
						}
						this.setState({subDocDialog: {}, showSms: false})
					}}
				/>
				<div>
					{
						this.state.extraContent
					}
				</div>
			</div>
		}
	})
}