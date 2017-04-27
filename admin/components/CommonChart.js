import React from 'react';

import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, ReferenceLine,
  ReferenceDot, Tooltip, CartesianGrid, Legend, Brush } from 'recharts';

// 图表曲线的颜色
var colors = ['#da002e', '#cd00da', '#5200da', 
              '#006cda', '#009bda', '#00c3da', 
              '#00da8a', '#00ea4d', '#80da00', 
              '#dad200', '#da7600', '#da1f00'];

export default function(config){
  // 不显示的字段
  const reservedKeys = config.reservedKeys || [];
  // 默认显示的字段
  const showDefKeys = config.showDefKeys || [];
  // 获取数据接口
  const getData = config.getData || function(){}
  // 组件更新后调用
  const componentDidUpdate = config.componentDidUpdate || function(){}
  // 自定义工具栏
  const getToolbar = config.getToolbar || function(){return null};
  // 显示title
  const getTitle = config.getTitle || function(){return null};
  // 扩展state
  const extendState = config.extendState || function(that, query, state){return state};
  const getInitialState = config.getInitialState || function(){return {}};

  return React.createClass({
    getInitialState:function(){

      var query = this.getQuery();
      return Object.assign(getInitialState(), extendState(this, query, {
        data:[], // 数据
        dict:[], // 字典
        chartType : "0", // 图标类型，0为linechart，1为areachart
        showDefKey:config.showDefKey
      }));
    },
    getQuery(){
      // 通过router获取参数
      var query = this.props.location ? this.props.location.query : null;
      // 通过属性获取参数
      if(!query){
        query = this.props;
      }
      return query;
    },
    getData:function(range){
      getData(this, range);
    },
    componentDidMount: function() {
      this.getData();
    },
    componentDidUpdate: function() {
      componentDidUpdate(this);
    },
    getToolbar(){
      return getToolbar(this);
    },
    getTitle(){
      return getTitle(this);
    },
    getChart(){
      
      switch(this.state.chartType){
        case "0": // 生成linechart
          return <LineChart width={1100} height={400} data={this.state.data}
                  margin={{top: 5, right: 30, left: 20, bottom: 5}}>
             <XAxis dataKey="mtime"/>
             <YAxis/>
             <CartesianGrid strokeDasharray="3 3"/>
             <Tooltip/>
             <Legend />
            {
                this.state.showDefKey ? <Line
                type="monotone"
                dataKey={this.state.showDefKey}
                stroke={colors[1]}
                name={(this.state.dict.find((value) => {
                  return value.dictId == this.state.showDefKey
                }) || {dictName:this.state.showDefKey}).dictName} /> : null
            }
            </LineChart>
        case "1":// 生成areachart
          return <AreaChart width={1100} height={400} data={this.state.data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="mtime" />
            <YAxis />
            <Tooltip />
            <Legend />
            {
              this.state.showDefKey ? <Area
                  type="monotone"
                  dataKey={this.state.showDefKey}
                  stroke={colors[0]}
                  fill={colors[3]}
                  name={(this.state.dict.find((value) => {
                  return value.dictId == this.state.showDefKey
                }) || {dictName:this.state.showDefKey}).dictName} /> : null
            }
            </AreaChart>
      }
    },
    render() {
      return (
        <div className='line-charts'>
          <div className='container'>
            <p>
              {this.props.history 
                ? <button className='btn btn-primary btn-xs' onClick={this.props.history && this.props.history.goBack}>Back</button>
                : null}
              &nbsp;&nbsp;{this.getTitle()}
            </p>
            <div>
              图表类型：&nbsp;
              <select className='select' onChange={
                  event => this.setState({chartType : event.target.value})
                }>
                <option value='0' selected={this.state.chartType == '0'}>LineChart</option>
                <option value='1' selected={this.state.chartType == '1'}>AreaChart</option>
              </select>
              &nbsp;&nbsp;
              <button className='btn btn-primary btn-xs' onClick={this.getData}>刷新</button>
              &nbsp;&nbsp;
              {this.getToolbar()}
            </div>
            {
              this.state.dict.map(value => {
                if(reservedKeys.includes(value.dictId))
                  return null
                else
                  return <span>
                            <input type='radio' id={value.dictId} value={value.dictId}
                                onChange={event => {
                                    var checked = event.target.checked;
                                    // var showDefKeys = this.state.showDefKeys;
                                    // showDefKeys[value.dictId] = checked;
                                    // this.setState({showDefKeys : showDefKeys});
                                    this.setState({showDefKey : value.dictId});
                                }}
                                checked={this.state.showDefKey == value.dictId} />
                            &nbsp;<label htmlFor={value.dictId}>{value.dictName}</label> &nbsp;
                          </span>
              })
            }
          </div>
          <div className='line-chart-wrapper'>
            {this.getChart()}
          </div>

        </div>
      );
    }
  });
}
