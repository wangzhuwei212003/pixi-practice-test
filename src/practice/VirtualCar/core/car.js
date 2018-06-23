/**
 * Created by zhuweiwang on 2018/6/23.
 */
//var Node = require('./Node');
// import Node from './Node';
import odom from '../config';

function car() {

  // 初始化小车，初始化 shuttle config。这个都是不会变的。
  this.shuttleConfig = {
    gate_speed: 1,
    max_speed: 5,
    acceleration: 1,
    deceleration: 1,
    wheel_to_chain: 21
  };

  this.odom = this._initialOdom();
}

car.prototype._initialOdom = function () {
  // 初始化car里的odom
  console.log('initial Odom');

  return odom
};

// 对外的接口
car.prototype.getUpdateOdom = function () {
  // 改变car里面的odom
  console.log('get Update Odom');

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
