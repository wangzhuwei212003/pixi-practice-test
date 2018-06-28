/**
 * Created by zhuweiwang on 2018/6/28.
 */
import * as dispatch from '../CoopAStarDispatch/dispatch';
import {shuttles} from './shuttleInstances';

export const handleCmdMsgSwitch = function (msg) {
  // msg 是一个数字
  const command_ID = msg;
  console.log('command_ID in handleCmdMsgSwitch', command_ID);
  // 目前模拟小车用到的 command ID
  // 72 拿到货框、(72,73都是内部自己发给自己的，80是外界调用的。)
  // 73 还完货框、
  // 80 完成当前路径。

  // 79 注册成功

  switch (command_ID) {
    case '79':
      // shuttles 里面已经添加，TODO 在 dispatch 里添加一个小车。并更新一个往上方停靠点的路径
      this.registered = true;

      console.log('shuttles' ,shuttles);
      console.log('this.uid' , this.uid);

      dispatch.registerShuttle(this.uid);
      console.log('在 dispatch 里添加一个小车, uid:', this.uid);
      setTimeout(() => {
        dispatch.preGoUp(this.uid);
      }, 1000);
      break;

    case '72': {
      // 给货箱装货过程
      console.debug("小车拿到货箱");

      this.status = 3; // 小车状态变为 3
      this.loadBox = true;
      // const pathInfo = dispatch.goToPickUpSite(this.uid, this.cache.pickSiteName);

      // 给机器人发送返回拣货站命令动作信息 收到72只有是去拣货台的。
      // this.sendTargetActionToShuttle(pathInfo); // 这里this就是标识了 car 整个function了？可以调用car里面的方法。
      this.consoleTest(command_ID);
      this.consoleTest();
      break;
    }

    case '73': {
      console.debug('机器人成功归还货箱');
      if (this.status !== 6) {
        console.warn("!!!!!!!shuttle status is not 6, discard the job done request, do nothing!!!!!!!");
        return;
      }
      console.debug('机器人完成一个任务');
      // 完成任务

      this.status = 0; // 小车状态变为 3
      this.loadBox = false;
      break;
    }

    case '80': {
      console.info('一个动作序列完成，当前shuttle status: ', this.status);

      // 通知调度算法，当前动作序列完成
      dispatch.setReachGoalByUid(this.uid);

      if (this.status === 1) {
        console.debug('发送取箱子命令');
        this.status = 2; // 机器人状态为 开始拉箱子

        setTimeout(() => {
          this.handleCmdMsg('72');
        }, 3000); // 3秒之后拉箱子完成。

      } else if (this.status === 3) {
        console.debug('小车到达拣货站');
        this.status = 4; // 小车开始等待拣货。

        setTimeout(() => {
          // TODO 小车从拣货台去还箱子。
          console.log('小车从拣货台去还箱子');
        }, 3000); // 3秒之后拣货完成，小车去还箱子。

      } else if (this.status === 5) {
        console.debug('发送还箱子命令');
        this.status = 6; // 小车到达还箱子点

        setTimeout(() => {
          this.handleCmdMsg('73');
        }, 3000); // 3秒之后还箱子完成。

      }
      break;
    }

    default:
      console.log('收到 80 命令，this.status:', this.status);
  }

};