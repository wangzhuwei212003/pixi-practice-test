/**
 * Created by zhuweiwang on 2018/6/23.
 */
//var Node = require('./Node');
// import Node from './Node';
import config from '../config';

function car() {

  // 初始化小车，初始化 shuttle config。这个都是不会变的。
  this.shuttleConfig = {
    gate_speed: 1,
    max_speed: 5,
    acceleration: 1,
    deceleration: 1,
    wheel_to_chain: 21
  };

  this.currentSpeed = 10; // 当前的速度，单位：齿每秒

  this.odom = this._initialOdom();
}

car.prototype._initialOdom = function () {
  // 初始化car里的odom
  console.log('initial Odom');
  return config.Odometry; // 返回config里的初始的原点处的 odom
};

// 对外的接口
car.prototype.updateOdom = function (updateTimeGap) {
  // 根据更新的时间间隔 单位毫秒，来按照速度更新 odom
  this.odom.total_teeth_from_origin += this.currentSpeed * updateTimeGap / 1000;

  // 改变car里面的odom
  console.log('Update Odom');
  console.log(this); // 在这个方法里打 this 会是什么？

};

car.prototype.getOdom = function (updateTimeGap) {
  console.log('get Odom');
  return this.odom;
};

car.prototype.handleVelocityReceived = function () {
// 接收到 velocity，后续的动作
  console.log('handle Velocity Received');

};

car.prototype.handlePathInfoReceived = function () {
  // 接收到pathInfo，后续的动作
  console.log('handle PathInfo Received');
};



export default car;
