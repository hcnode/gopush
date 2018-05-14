/**
 * Created by harry on 16/4/12.
 */
import React from 'react'
var DatePicker = require('../js/datepicker/datepicker');
require('react-datepicker/dist/react-datepicker.css');
var moment = require('moment');

const EditDialog = React.createClass({
	getInitialState() {
		return {
			fields : {},
			model : this.props.model || {}
		}
	},
	componentDidUpdate(){
		const that = this;
		if(this.props.schema) {
			$("#listEditModal").modal('show');
			$('#listEditModal').on('hidden.bs.modal', function (e) {
				that.props.reset();
			})
		}
	},
	getField(field){
		const that = this;
		var fields = that.props.fields;
		var fieldName = field.name;
		var options = fields.options[fieldName];
		const id = '_field_' + fieldName;
		var type;
		try {
			type = $.type(new field.type);
		} catch (e) {
			type = field.type;
		}
		var value = that.props.model[fieldName];
		setTimeout(function () {
			if(type == 'date' && value) value = moment(value).format('YYYY-MM-DD HH:mm');
			if(type == 'boolean'){
				$('#_field_' + fieldName)[0].checked = value;
			}else {
				$('#_field_' + fieldName).val(value);
			}
		},300);
		if(fields.customEdit && fields.customEdit[fieldName]){
			return fields.customEdit[fieldName](value, function (value) {
				var model = that.state.model;
				model[fieldName] = value;
			});
		}
		var disabled = fields.disabledEdit && fields.disabledEdit.includes(fieldName) && that.props.model._id;
		if(options){
			return <select
					disabled={disabled}
					className="form-control"
					id={id} ref={fieldName} onChange={(event) => {
					if(field.onChange){
						field.onChange(that, event);
					}
				}}>
				<option value="">请选择</option>
				{
					Object.keys(options).map(option => {
						var optionHtml = <option value={option}>{options[option]}</option>;
						if(field.editField.filter){
							return field.editField.filter.includes(option) ? optionHtml : null;
						}else{
							return optionHtml;
						}
					})
				}
			</select>
		}else if(type == 'boolean'){
			return <div className="checkbox">
				<label>
					<input
						disabled={disabled}
						type="checkbox"
						id={id}
						ref={fieldName}
						value="" />
				</label>
			</div>
		}else if(type == 'textarea'){
			return <textarea
				disabled={disabled}
				type="text"
				className="form-control"
				id={id}
				ref={fieldName}
			/>
		}else if(type == 'date'){
			function setModel(value){
				var model = that.state.model;
				var time = moment(value, 'YYYY-MM-DD HH:mm');
				if(time.isValid()){
					model[fieldName] = time.toDate();
				}
			}
			return <DatePicker
				disabled={disabled}
				dateFormat="YYYY-MM-DD HH:mm"
				id={id}
				inputRef={fieldName}
				onChange={(date) => {
					var value = date.format('YYYY-MM-DD HH:mm');
					setTimeout(function () {
						$('#_field_' + fieldName).val(value);
						setModel(value);
					},300);
				}}
				onInputBlur={(event) => {
					setModel(event.target.value);
				}}
			/>
		}else{
			return <input
				disabled={disabled}
				type="text"
				className="form-control"
				id={id}
				ref={fieldName}/>
		}

	},
	getFields(){
		var result = this.props.schema.reduce((result, field) => {
			var pairIsFull = this.pairIsFull;
			if (pairIsFull) {
				this.pairIsFull = false;
				result.push(<div className="form-group">
					{this.first}
					<label
						className="col-sm-2 control-label">{field.text || field.name}<span style={{color:'red'}}>{field.required ? '*' : ''}</span></label>
					<div className="col-sm-4">
						{
							this.getField(field)
						}
					</div>
				</div>)
				this.first = null;
				result.push(<div className="line line-dashed b-b line-lg "></div>);
			} else {
				this.pairIsFull = true;
				this.first = [];
				this.first.push(<label
					className="col-sm-2 control-label">{field.text || field.name}<span style={{color:'red'}}>{field.required ? '*' : ''}</span></label>);
				this.first.push(<div className="col-sm-4">
					{
						this.getField(field)
					}
				</div>);
			}
			return result;
		}, []);
		if(this.first){
			result.push(<div className="form-group">{this.first}</div>)
			result.push(<div className="line line-dashed b-b line-lg "></div>);
			this.first = null;
			this.pairIsFull = false;
		}
		return result;
	},
	save(){
		var model = Object.keys(this.refs).reduce((tmp, value) => {
			var control = this.refs[value];
			tmp[value] = control.type == 'checkbox' ? control.checked : control.value;
			return tmp;
		}, {});

		this.props.save($.extend({}, this.props.model, model, this.state.model),
			this.props.showSms ? $('#txtSmsCode').val() : null);
	},
	render(){
		if(this.props.schema) {
			return <div className="modal fade" id="listEditModal" tabindex="-1" role="dialog"
						aria-labelledby="myModalLabel" style={{paddingLeft: "0px;"}}>
				<div className="modal-dialog modal-lg" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span
								aria-hidden="true">×</span></button>
							<h4 className="modal-title" id="myModalLabel">新增/修改记录</h4>
						</div>
						<div className="modal-body form-horizontal">
							<ul className="nav nav-tabs" role="tablist">
								<li role="presentation" className="active">
									<a href="#basicInfo"
									   aria-controls="basicInfo"
									   role="tab"
									   data-toggle="tab">基本信息</a>
								</li>
							</ul>
							<div className="panel panel-default" style={{borderTop:"0px;"}}>
								<div className="panel-body">
									<div id="myTabContent" className="tab-content">
										<div role="tabpanel" className="tab-pane  in active" id="basicInfo"
											 aria-labelledby="basicInfo-tab">
											{
												this.getFields()
											}
										</div>
									</div>
								</div>
								<footer className="panel-footer text-right bg-light lter">
									<span className={this.props.showSms ? '' : 'hide'}>输入验证码:<input id="txtSmsCode" />&nbsp;
										<button className="btn btn-default" onClick={(event) => {
										$.get('/getSmsCode', function(data) {
										  if(data.code == 200){
										  	event.target.innerHTML = '验证码已发送'
										  	event.target.disabled = true;
										  }
										})
									}}>获取验证码</button></span>
									&nbsp;&nbsp;
									<button type="button" className="btn btn-default" data-dismiss="modal"
											style={{marginRight: "5px;"}}>取消
									</button>&nbsp;&nbsp;
									<button className="btn btn-primary"
											onClick={this.save}
											style={{marginRight: "5px;"}}>保存
									</button>
								</footer>
							</div>
						</div>

					</div>
				</div>
			</div>
		}else{
			return <div></div>
		}
	}
});

export default EditDialog;