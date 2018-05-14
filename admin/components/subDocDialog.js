/**
 * Created by harry on 16/4/12.
 */
import React from 'react'

const CommonDialog = React.createClass({
	componentDidUpdate(){
		var that = this;
		if(this.props.content) {
			$("#commonModal").modal('show');
			$('#commonModal').on('hidden.bs.modal', function (e) {
				that.props.reset();
			})
		}
	},
	render(){
		if(this.props.content) {
			return <div className="modal fade" id="commonModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
				<div className="modal-dialog" style={{width:'1100px'}} role="document">
					<div className="modal-content">
						<div className="modal-header">
							<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
							<h4 className="modal-title">{this.props.title}</h4>
						</div>
						<div className="modal-body">
							{this.props.content}
						</div>
						<div className="modal-footer">
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
							</button>
							{
								this.props.onOk ? <button type="button" className="btn btn-default"
											   onClick={() => {
											   		this.props.onOk();
											   }}
											   style={{marginRight: "5px;"}}>确定
								</button> : null
							}
						</div>
					</div>
				</div>
			</div>
		}else{
			return <div></div>
		}
	}
});

export default CommonDialog;