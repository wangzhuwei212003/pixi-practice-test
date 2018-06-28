/**
 * Created by zhuweiwang on 2018/6/23.
 */
//var Node = require('./Node');
// import Node from './Node';
import config from '../config';
import {
  updateOdom,
  switchOdomDownToUp,
  switchOdomUpToDown
} from './updateOdom';
import {
  handleCmdMsgSwitch
} from './handleCmdMsg';
import * as dispatch from '../CoopAStarDispatch/dispatch.js';

function car(uid) {

  // 初始化小车，初始化 shuttle config。这个都是不会变的。
  this.shuttleConfig = {
    gate_speed: 1,
    max_speed: 5,
    acceleration: 1,
    deceleration: 1,
    wheel_to_chain: 21,
    wheel: 29,
  };

  this.currentSpeed = 40; // 当前的速度，单位：齿每秒

  this.odom = this._initialOdom(); // 每个小车当前的 odom

  this.pathInfo = this._initialPathInfo();

  this.uid = uid;
  this.status = 0; // 初始小车的 statu 是 0 。
  this.loadBox = false;
  this.cache = {
    targetRow: null,
    targetCol: null,
    pickSiteName: "SiteA", // 默认全是 SiteA
  };
  this.registered = false;

  this.updateOdomInterval = setInterval(() => {
    try {
      if (this.registered) {
        // 如果是已经注册了的，就开始向后端 dispatch 不停的发位置报告。
        dispatch.setStartNode(this.uid, this.odom);
      }
    } catch (e) {
      console.error("error in updateOdomInterval to dispatch", e);
    }
  }, 200); // 每 100 毫秒向 dispatch 文件避障服务器发送一次odom数据

  this.handleCmdMsg.bind(this);
}

car.prototype._initialOdom = function () {
  // 初始化car里的odom
  console.log('initial Odom');
  return JSON.parse(JSON.stringify(config.Odometry)); // 返回config里的初始的原点处的 odom
  // return config.Odometry; // 返回config里的初始的原点处的 odom
};
car.prototype._initialPathInfo = function () {
  // 初始化car里的odom
  console.log('initial PathInfo');
  return JSON.parse(JSON.stringify(config.pathInfoInit)); // 返回config里的初始的原点处的 odom
  // return config.pathInfo; // 返回config里的初始的原点处的 odom
};

car.prototype.updateOdomTest = function (updateTimeGap) {
  // 测试，
  this.odom.total_teeth_from_origin += this.currentSpeed;

};

car.prototype.consoleTest = function (hello = 'hello') {
  // 测试，
  console.log(hello);
};

// 处理 command ID
car.prototype.handleCmdMsg = function (msg) {
  console.log('小车收到命令', msg);
  console.log(this);
  handleCmdMsgSwitch.bind(this)(msg);
};

// 对外的接口
car.prototype.updateOdomByTime = function (updateTimeGap) {
  // 根据更新的时间间隔 单位毫秒，来按照速度更新 odom

  if (this.odom.total_teeth_from_origin >= this.pathInfo.total_teeth) {
    // 如果是小车已经走到了，就不再往前走。
    console.log('小车到达目前路径的终点');
    this.currentSpeed = 0; // 强行把小车速度降为0.

    this.handleCmdMsg('80'); // 小车到达目前路径，发送 80 command ID

    return
  } else {
    // 改变car里面的odom
    // console.log('Update Odom');
    this.odom = updateOdom(updateTimeGap, this.currentSpeed, this.odom, this.pathInfo);
    return
  }
};

car.prototype.getOdom = function (updateTimeGap) {
  console.log('get Odom');
  return this.odom;
};

car.prototype.handleVelocityReceived = function () {
// 接收到 velocity，后续的动作
  console.log('handle Velocity Received');

};

car.prototype.handlePathInfoReceived = function (newPathInfo) {
  console.log('handle PathInfo Received');
  // 如果上一个路径还没有走完，就不能开始下一个路径。报错。
  // 注意，total_teeth_from_origin 并不是从原点开始走了多少个齿，而是，从一段路径的起点开始。
  // 一段路径走完之后，要有 total_teeth_from_origin 归零。
  if (this.odom.total_teeth_from_origin < Math.abs(this.pathInfo.total_teeth)) {
    // 如果是小车还没走到之前的路径，就不接收新的路径。
    console.log('小车还没走到之前的路径，就不接收新的路径');
    return
  } else {
    /*
     TODO
     * 有一种重要的情况就是，发过来的路径是负数，actions是空，这个是特殊情况。小车向上运动取货。
     *
     * 以及另一种特殊情况就是小车向上取货完毕之后，开始向下运动。这个odom也是要改的。
     * */
    if (newPathInfo.total_teeth < 0 && this.pathInfo.total_teeth > 0) {
      // 负数意味着向上取货
      // 立即更改odom方向为向上
      this.odom = switchOdomDownToUp(this.odom);
    } else if (newPathInfo.total_teeth > 0 && this.pathInfo.total_teeth < 0) {
      this.odom = switchOdomUpToDown(this.odom);
    }

    console.log('Update pathinfo');
    this.pathInfo = newPathInfo;
    return
  }
};

car.prototype.sendTargetActionToShuttle = function (newPathInfo) {
  console.log('handle PathInfo Received');
  // 如果上一个路径还没有走完，就不能开始下一个路径。报错。
  // 注意，total_teeth_from_origin 并不是从原点开始走了多少个齿，而是，从一段路径的起点开始。
  // 一段路径走完之后，要有 total_teeth_from_origin 归零。
  if (this.odom.total_teeth_from_origin < Math.abs(this.pathInfo.total_teeth)) {
    // 如果是小车还没走到之前的路径，就不接收新的路径。
    console.log('小车还没走到之前的路径，就不接收新的路径');
    return
  } else {
    /*
     TODO
     * 有一种重要的情况就是，发过来的路径是负数，actions是空，这个是特殊情况。小车向上运动取货。
     *
     * 以及另一种特殊情况就是小车向上取货完毕之后，开始向下运动。这个odom也是要改的。
     * */
    if (newPathInfo.total_teeth < 0 && this.pathInfo.total_teeth > 0) {
      // 负数意味着向上取货
      // 立即更改odom方向为向上
      this.odom = switchOdomDownToUp(this.odom);
    } else if (newPathInfo.total_teeth > 0 && this.pathInfo.total_teeth < 0) {
      this.odom = switchOdomUpToDown(this.odom);
    }

    console.log('Update pathinfo');
    this.pathInfo = newPathInfo;
    return
  }
};


export default car;
