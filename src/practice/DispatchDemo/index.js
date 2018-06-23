/**
 * Created by zhuweiwang on 2018/6/23.
 */
import React, {Component} from 'react';
import Button from 'antd/lib/button';
import CAR from './CarSvg.svg';
import './App.css';

import * as PIXI from "pixi.js";

const ButtonGroup = Button.Group;

const STARTPOINT = (0, 0);
const MAX_VELOCITY = 5;
const ACCELERATION = 0.375;

class DispatchDemo extends Component {
  constructor(props) {
    super(props);

    this.drawRect = this.drawRect.bind(this);
    this.initCars = this.initCars.bind(this);
    this.addCar = this.addCar.bind(this);
    this.clearAll = this.clearAll.bind(this);
    this.animate = this.animate.bind(this);

    this.state = {
      trajectory: [],
      carStatus: [],
      carInStage: [],
      task: [],
      disableAddCar: false,
      disableClearAll: false,
    }
  }

  componentDidMount() {
    this.renderer = PIXI.autoDetectRenderer(1100, 1300);

    this.stage = new PIXI.Container();
    this.stage.width = 1200;
    this.stage.height = 1000;

    this.renderer.view.style['transform'] = 'translatez(0)';
    this.refs.gameCanvas.appendChild(this.renderer.view);
    this.carTexture = new PIXI.Texture.fromImage(CAR);

    this.drawRect();
    this.initCars(7);


    // console.log(this.state.trajectory);
    this.animate();
  }

  //画出运动轨迹、背景，日后隐藏
  drawRect() {
    //draw col
    /*for (let i = 0; i < 4; i += 1) {
     let rect = new PIXI.Graphics();
     rect.lineStyle(0, 0xD8D8D8, 1);
     rect.beginFill(0x979797);
     rect.drawRect(200 * i, 0, 180, 1000);
     rect.endFill();
     rect.x = 160;
     rect.y = 200;
     this.stage.addChild(rect);
     }
     //draw horizontal trajectory
     for (let i = 0; i < 2; i += 1) {
     let rect = new PIXI.Graphics();
     rect.lineStyle(0, 0xD8D8D8, 1);
     rect.beginFill(0x4EAED9);
     rect.drawRect(0, 900 * i, 780, 100);
     rect.endFill();
     rect.x = 160;
     rect.y = 200;
     this.stage.addChild(rect);
     }*/
    // draw cargo position
    for (let i = 0; i < 7; i += 1) {
      let rect = new PIXI.Graphics();
      rect.lineStyle(1, 0x4EAED9, 1);
      rect.beginFill(0x50E3C2);
      rect.drawRect(100 * i, 0, 100, 100);
      rect.endFill();
      rect.x = 200;
      rect.y = 200;
      this.stage.addChild(rect);
    }
    for (let i = 0; i < 8; i += 1) {
      let rect = new PIXI.Graphics();
      rect.lineStyle(1, 0x4EAED9, 1);
      rect.beginFill(0x50E3C2);
      rect.drawRect(100 * i, 900, 100, 100);
      rect.endFill();
      rect.x = 200;
      rect.y = 200;
      this.stage.addChild(rect);
    }
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 8; j += 1) {
        let rect = new PIXI.Graphics();
        rect.lineStyle(1, 0x4EAED9, 1);
        rect.beginFill(0x50E3C2);
        rect.drawRect(200 * i, 100 * j, 100, 100);
        rect.endFill();
        rect.x = 200;
        rect.y = 200 + 100;
        this.stage.addChild(rect);
      }
    }
    // 以上画完实际样子的轨道，以下画出运动点的活动轨迹 作为辅助
    // draw rect car path
    let rect = new PIXI.Graphics();
    rect.lineStyle(4, 0xD8D8D8, 1);
    rect.beginFill(0x000000, 0);
    rect.drawRect(0, 0, 600, 900);
    rect.endFill();
    rect.x = 250;
    rect.y = 250;
    this.stage.addChild(rect);

    for (let i = 1; i < 3; i += 1) {
      let line = new PIXI.Graphics();
      line.lineStyle(4, 0xD8D8D8, 1);
      line.moveTo(200 * i, 0);
      line.lineTo(200 * i, 900);
      line.x = 250;
      line.y = 250;
      this.stage.addChild(line);
    }

  }

  // initialize cars, initialize the first frame
  initCars(num) {
    //给全局的 trajectory 抽象成二维数组 来表示。
    const arr = [];
    for (let i = 0; i < 8; i += 1) {
      arr[i] = [];
      for (let j = 0; j < 10; j += 1) {
        arr[i][j] = 0;
      }
    }
    // update the car status in the state
    let nowCarStatus = this.state.carStatus;
    let nowCarInStage = this.state.carInStage;
    let nowTrajectory = arr;
    for (let i = 0; i < num; i += 1) {
      nowCarStatus.push({
        id: i, // id 不能是数字吗, 这里的id就是小车的index
        curGoal: {
          i: 0,
          j: 0
        },
        curArea: {
          i: i,
          j: 0
        },
        // curGoal 到了一个路口之后再来算下面一个路口
        statu: "empty",
        cargoGoal: {
          i: null,
          j: null
        },
        velocity: 0,
        waitingTime: null
      });

      // 更新 state 里面的 trajectory，1 代表有车占位。如果是车位在轨道内，那么就更新占位信息。
      if (i <= 6) {
        nowTrajectory[i][0] = 1;
      }


      // let circle = new PIXI.Graphics();
      // circle.beginFill(0x559922);
      // circle.drawCircle(0, 0, 5);
      // circle.endFill();
      let box = new PIXI.Graphics();
      box.lineStyle(3, 0x4EAED9, 1);
      box.beginFill(0x858D89);
      box.drawRect(0, 0, 90, 50);
      box.endFill();
      box.x = 5;
      box.y = -50;

      let statuText = new PIXI.Text(
          '空闲',
          {fontFamily: "Arial", fontSize: 24, fill: "white"}
      );
      statuText.anchor.set(0.5, 0.5);
      statuText.position.set(50, -25);

      let circleCar = new PIXI.Sprite(this.carTexture);
      let carAndBox = new PIXI.Container();
      carAndBox.addChild(circleCar);
      carAndBox.addChild(box);
      carAndBox.addChild(statuText);
      carAndBox.x = 250 + 100 * i;
      carAndBox.y = 1150;
      carAndBox.pivot.set(50, -35);

      this.stage.addChild(carAndBox); // add child to stage

      nowCarInStage.push(carAndBox);

    }
    console.log(nowCarInStage);
    this.setState({
      trajectory: nowTrajectory,
      carStatus: nowCarStatus,
      carInStage: nowCarInStage
    })
  }

  clearAll() {
    //给全局的 trajectory 抽象成二维数组 来表示。
    const arr = [];
    for (let i = 0; i < 8; i += 1) {
      arr[i] = [];
      for (let j = 0; j < 10; j += 1) {
        arr[i][j] = 0;
      }
    }
    // update the car status in the state
    let nowTrajectory = arr;
    for (let i = 0; i < this.state.carInStage.length; i += 1) {
      this.stage.removeChild(this.state.carInStage[i])
    }
    this.setState({
      trajectory: nowTrajectory,
      carStatus: [],
      carInStage: []
    });
  }

  // add a new car 新增一个小车
  addCar() {
    //给全局的 trajectory 抽象成二维数组 来表示。

    // update the car status in the state
    let nowCarStatus = this.state.carStatus;
    let nowCarInStage = this.state.carInStage;
    let nowTrajectory = this.state.trajectory;

    let index = nowCarStatus.length;

    if (nowTrajectory[7][0] === 0) {
      nowCarStatus.push({
        id: index,
        // 初始位置为下方轨道最右端，curGoal 到了一个路口之后再来算下面一个路口
        curGoal: {
          i: 0,
          j: 0
        },
        curArea: {
          i: 7,
          j: 0
        },
        statu: "empty",
        cargoGoal: {
          i: null,
          j: null
        },
        velocity: 0,
        waitingTime: null
      });

      // 更新 state 里面的 trajectory，1 代表有车占位。如果是车位在轨道内，那么就更新占位信息。
      nowTrajectory[7][0] = 1;

      // let circle = new PIXI.Graphics();
      // circle.beginFill(0x559922);
      // circle.drawCircle(0, 0, 5);
      // circle.endFill();
      let circle = new PIXI.Sprite(this.carTexture);
      circle.x = 250 + 100 * 7;
      circle.y = 1150;
      circle.pivot.set(50, -35);

      this.stage.addChild(circle); // add child to stage

      nowCarInStage.push(circle);
      this.setState({
        trajectory: nowTrajectory,
        carStatus: nowCarStatus,
        carInStage: nowCarInStage,
      })
    }
  }

  pickOneThing() {

  }

  updateAllCar() {
    // 1. 确定curGoal（area 坐标），在转弯的时候更新下一个路口，否则是不用更新。可能值就是转弯点。
    // 2. 根据curArea，以及trajectory的占位情况 决定是否要走。
    // 2. 如果是前方2个block都没有车，就继续走。如果是路口，两个block方向不一样，有一个block会折叠。
    // 3. 现在确定往前走， 更新state里面的状态，更新stage里面的状态，加速度一定，
    let nowCarStatus = this.state.carStatus;
    let nowCarInStage = this.state.carInStage;
    let nowTrajectory = this.state.trajectory;

    for (let i = 0; i < nowCarStatus.length; i += 1) {
      //console.log('1st', nowTrajectory);
      // console.log('1st car statu', nowCarStatus[0]);
      // console.log('x',nowCarInStage[0].x, 'y', nowCarInStage[0].y);
      // 以下 根据小车的实际位置，更新 car status 里面的 curgoal、waiting time、statu
      if ((nowCarInStage[i].x >= 245 && nowCarInStage[i].x <= 255) && (nowCarInStage[i].y >= 1145 && nowCarInStage[i].y <= 1155)) {
        switch (nowCarStatus[i].statu) {
          case "empty" :
            // 小车到达起点，下一个目标area change to (0, 9)
            nowCarStatus[i].curGoal.j = 9;
            break;
          case "return" :
            //状态是 return 的在起点不停。
            nowCarStatus[i].curGoal.j = 9;
            break;
          case "fetch" :
            //如果是要去拿货给起点的，到达起点，停止3秒、更新目标位置
            if (nowCarStatus[i].waitingTime === null) {
              nowCarStatus[i].waitingTime = 180;
            } else if (nowCarStatus[i].waitingTime > 0) {
              nowCarStatus[i].waitingTime -= 1;
            } else if (nowCarStatus[i].waitingTime === 0) {
              nowCarStatus[i].waitingTime = null;
              nowCarStatus[i].statu = "return"; // 如果是逗留时间到了，就变状态
              nowCarStatus[i].curGoal.j = 9;
            }
            break;
        }
      } else if ((nowCarInStage[i].x >= 240 && nowCarInStage[i].x <= 260) && (nowCarInStage[i].y >= 245 && nowCarInStage[i].y <= 255)) {
        // 小车到达顶部的最左端。
        // console.log(" 到达顶端");
        switch (nowCarStatus[i].statu) {
          case "empty" :
            // 从后面3个路口任选一个,Math.random [0,1)
            nowCarStatus[i].curGoal.i = 2 * (1 + Math.floor(Math.random() * 3)); // 可能值为 2，4，6
            // console.log(nowCarStatus[i].curGoal.i);
            // console.log("curGoal");
            break;
            //如果是有任务的，就去有任务的 列
          case "return" :
            nowCarStatus[i].curGoal.i = nowCarStatus[i].cargoGoal.i;
            break;
          case "fetch" :
            nowCarStatus[i].curGoal.i = nowCarStatus[i].cargoGoal.i;
            break;
          default:
            // console.log("what statu?");
            // console.log(nowCarStatus[i].statu);
        }
      } else if ((nowCarInStage[i].x >= 245 + 100 * nowCarStatus[i].curGoal.i && nowCarInStage[i].x <= 255 + 100 * nowCarStatus[i].curGoal.i)
          && (nowCarInStage[i].y >= 245 && nowCarInStage[i].y <= 255)) {
        //小车到达了目标列上方，更新目标为列中的位置
        switch (nowCarStatus[i].statu) {
          case "empty" :
            // 从后面3个路口任选一个,Math.random [0,1), 这句话的意思是随机选择目标列中的位置停靠
            // nowCarStatus[i].curGoal.j = 1 + Math.floor(Math.random() * 8); // 可能值为 1，2，3，4，5，6，7，8
            nowCarStatus[i].curGoal.j = 0; // empty 的小车一直走。
            break;
            //如果是有任务的，就去有任务的 列
          case "return" :
            nowCarStatus[i].curGoal.j = nowCarStatus[i].cargoGoal.j;
            break;
          case "fetch" :
            nowCarStatus[i].curGoal.j = nowCarStatus[i].cargoGoal.j;
            break;
        }
      } else if ((nowCarInStage[i].x >= 245 + 100 * nowCarStatus[i].curGoal.i && nowCarInStage[i].x <= 255 + 100 * nowCarStatus[i].curGoal.i)
          && (nowCarInStage[i].y >= 1150 - 5 - 100 * nowCarStatus[i].curGoal.j && nowCarInStage[i].y <= 1150 + 5 - 100 * nowCarStatus[i].curGoal.j)
          && nowCarInStage[i].x >= 450 - 5 && nowCarInStage[i].y >= 350 - 5 && nowCarInStage[i].y <= 1050 + 5) {
        // 到达目标位置，并且是在放货物的3列中。
        console.log('daodagoal');
        switch (nowCarStatus[i].statu) {
          case "empty" :
            // 1. 如果是empty的小车，到达放货物的架子里的时候就是终点，可以停住了. 没有下一个目标点
            break;
          case "return" :
            //如果是有任务的，就强制停止3秒钟，loading, 180 对应 60 fps就是3秒。
            if (nowCarStatus[i].waitingTime === null) {
              nowCarStatus[i].waitingTime = 180;
            } else if (nowCarStatus[i].waitingTime > 0) {
              nowCarStatus[i].waitingTime -= 1;
            } else if (nowCarStatus[i].waitingTime === 0) {
              nowCarStatus[i].waitingTime = null;
              nowCarStatus[i].statu = "empty";
            }
            break;
          case "fetch" :
            //如果是要去拿货给起点的，停止、更新目标位置
            if (nowCarStatus[i].waitingTime === null) {
              nowCarStatus[i].waitingTime = 180;
            } else if (nowCarStatus[i].waitingTime > 0) {
              nowCarStatus[i].waitingTime -= 1;
            } else if (nowCarStatus[i].waitingTime === 0) {
              nowCarStatus[i].waitingTime = null;
              nowCarStatus[i].curGoal.j = 0;
            }
            break;
        }
      } else if ((nowCarInStage[i].x >= 245 + 100 * nowCarStatus[i].curGoal.i && nowCarInStage[i].x <= 255 + 100 * nowCarStatus[i].curGoal.i)
          && (nowCarInStage[i].y >= 1150 - 5 && nowCarInStage[i].y <= 1150 + 5)
          && nowCarInStage[i].x >= 450 - 5) {
        // 到达目标位置，并且是在最下面的一条横向导轨上。
        console.log('daoda');
        switch (nowCarStatus[i].statu) {
          case "empty" :

          case "return" :

          case "fetch" :
            // 都是去起点，没有区别
            nowCarStatus[i].curGoal.i = 0;
            break;
        }
      } else {
        // console.log('have sth not considered');
      }
      // 以上是根据小车在 stage 里的实际位置，更新 car status 里面的 当前目标

      // 得到前方两个block的占位情况。
      if (nowCarStatus[i].curArea.i === 0 && nowCarStatus[i].curArea.j === 0) {
        if (nowTrajectory[0][1] === 0 && nowTrajectory[0][2] === 0) {
          // 如果畅通，没有到最大速度 5 就加速，加速度是 0.125 保证 100 的最大刹车距离。
          if (nowCarStatus[i].velocity < MAX_VELOCITY) {
            nowCarStatus[i].velocity += ACCELERATION;
          } else if (nowCarStatus[i].velocity >= MAX_VELOCITY) {
            // do nothing
          }
        } else {
          // unimpleded
          if (nowCarStatus[i].velocity > 0) {
            nowCarStatus[i].velocity -= ACCELERATION;
          } else if (nowCarStatus[i].velocity === 0) {
            // do nothing
          }
        }

        let oldLeft = 0; //这个地方用小车左边的端点作为判断 所在区域。
        let oldRight = Math.round((nowCarInStage[i].x - 250 + 45) / 100); //这个地方用小车右边的端点作为判断 所在区域。

        //这个地方有问题，如果是（0，0）的话，是有可能横坐标并不是 250,
        if (nowCarInStage[i].x >= 250) {
          nowCarInStage[i].x -= nowCarStatus[i].velocity; // move in the y axis

          let newLeft = 0; //这个地方用小车左边的端点作为判断 所在区域。
          let newRight = Math.round((nowCarInStage[i].x - 250 + 45) / 100); //这个地方用小车右边的端点作为判断 所在区域。
          // console.log(newRight);

          if (oldLeft !== oldRight && newLeft === newRight) {
            nowTrajectory[0][0] = 1;
            nowTrajectory[1][0] = 0;
            nowCarStatus[i].curArea.i = 0;
          } else if (newLeft !== newRight) {
            nowTrajectory[newRight][0] = 1;
            nowTrajectory[newLeft][0] = 1;
            nowCarStatus[i].curArea.i = newLeft;
          }
        } else {
          // 更新y轴方向。
          nowCarInStage[i].y -= nowCarStatus[i].velocity; // move in the y axis
          let newJ = Math.round((1150 - nowCarInStage[i].y) / 100);
          //update the car statu and trajectory
          if (newJ !== 0) {
            nowTrajectory[0][0] = 0;
            nowTrajectory[0][1] = 1;
            nowCarStatus[i].curArea.j = 1;
          }
        }
      } else if (nowCarStatus[i].curArea.i === 0 && nowCarStatus[i].curArea.j >= 1 && nowCarStatus[i].curArea.j <= 8) {
        // 在起点到顶部左上角那段直线。不存在中途停车，有空位就往前走。
        let jIndex = nowCarStatus[i].curArea.j;
        let unimpeded;
        if (nowCarStatus[i].curArea.j === 8) {
          unimpeded = nowTrajectory[0][9] === 0 && nowTrajectory[1][9] === 0;
        } else {
          unimpeded = nowTrajectory[0][jIndex + 1] === 0 && nowTrajectory[0][jIndex + 2] === 0;
        }

        if (unimpeded) {
          // 如果畅通，没有到最大速度 5 就加速，加速度是 0.125 保证 100 的最大刹车距离。
          if (nowCarStatus[i].velocity < MAX_VELOCITY) {
            nowCarStatus[i].velocity += ACCELERATION;
          } else if (nowCarStatus[i].velocity >= MAX_VELOCITY) {
            // do nothing
          }
        } else if (!unimpeded) {
          // 前方有阻塞，立刻减速, 直到速度为 0
          if (nowCarStatus[i].velocity > 0) {
            nowCarStatus[i].velocity -= ACCELERATION;
          } else if (nowCarStatus[i].velocity === 0) {
            // do nothing
          }
        }
        // after the velocity updated, the position in the stage should be updated
        nowCarInStage[i].y -= nowCarStatus[i].velocity; // move in the y axis

        // find out the current area
        let newJ = Math.round((1150 - nowCarInStage[i].y) / 100);

        //update the car statu and trajectory
        let oldJ = nowCarStatus[i].curArea.j;
        if (newJ !== oldJ) {
          nowTrajectory[0][oldJ] = 0;
          nowTrajectory[0][oldJ + 1] = 1;
          nowCarStatus[i].curArea.j = newJ;
        }
      } else if (nowCarStatus[i].curArea.i === 0 && nowCarStatus[i].curArea.j === 9) {
        let unimpeded = nowTrajectory[1][9] === 0 && nowTrajectory[2][9] === 0;
        if (unimpeded) {
          // 如果畅通，没有到最大速度 5 就加速，加速度是 0.125 保证 100 的最大刹车距离。
          if (nowCarStatus[i].velocity < MAX_VELOCITY) {
            nowCarStatus[i].velocity += ACCELERATION;
          }
        } else if (!unimpeded) {
          // 前方有阻塞，立刻减速, 直到速度为 0
          if (nowCarStatus[i].velocity > 0) {
            nowCarStatus[i].velocity -= ACCELERATION;
          }
        }
        // when it comes to the corner the stage coordinate depends
        if (nowCarInStage[i].y <= 250) {
          nowCarInStage[i].x += nowCarStatus[i].velocity;
        } else {
          nowCarInStage[i].y -= nowCarStatus[i].velocity;
        }

        let newI = Math.round((nowCarInStage[i].x - 250) / 100);
        let oldI = nowCarStatus[i].curArea.i;
        if (newI !== oldI) {
          nowTrajectory[oldI][9] = 0;
          nowTrajectory[oldI + 1][9] = 1;
          nowCarStatus[i].curArea.i = newI;
        }
        // possible to update to (1,9) area.
      } else if ((nowCarStatus[i].curArea.i === 1 || nowCarStatus[i].curArea.i === 3 || nowCarStatus[i].curArea.i === 5) && nowCarStatus[i].curArea.j === 9) {
        // it depends on which col the car going to
        let positionI = nowCarStatus[i].curArea.i; // 1,3,5 当前的位置横坐标
        let colGoal = nowCarStatus[i].curGoal.i;
        let unimpeded;
        if (colGoal === positionI + 1) {
          unimpeded = nowTrajectory[colGoal][9] === 0 && nowTrajectory[colGoal][8] === 0;
        } else {
          // console.log(nowTrajectory);
          // console.log(nowTrajectory[positionI + 1]);
          // console.log(nowTrajectory[positionI + 2]);
          // console.log(positionI);
          // console.log(colGoal);
          // console.log(nowCarInStage[i].y);
          unimpeded = nowTrajectory[positionI + 1][9] === 0 && nowTrajectory[positionI + 2][9] === 0;
        }

        if (unimpeded) {
          // 如果畅通，没有到最大速度 5 就加速，加速度是 0.125 保证 100 的最大刹车距离。
          if (nowCarStatus[i].velocity < MAX_VELOCITY) {
            nowCarStatus[i].velocity += ACCELERATION;
          }
        } else if (!unimpeded) {
          // 前方有阻塞，立刻减速, 直到速度为 0
          if (nowCarStatus[i].velocity > 0) {
            nowCarStatus[i].velocity -= ACCELERATION;
          }
        }
        nowCarInStage[i].x += nowCarStatus[i].velocity;
        let newI = Math.round((nowCarInStage[i].x - 250) / 100);
        if (newI !== positionI) {
          nowTrajectory[positionI][9] = 0;
          nowTrajectory[positionI + 1][9] = 1;
          nowCarStatus[i].curArea.i = newI;
        }
        // possible to (2,9)（4，9）（6，9）
      } else if ((nowCarStatus[i].curArea.i === 2 || nowCarStatus[i].curArea.i === 4 || nowCarStatus[i].curArea.i === 6) && nowCarStatus[i].curArea.j === 9) {
        // it depends on which col the car going to
        let colGoal = nowCarStatus[i].curGoal.i;
        let unimpeded;
        if (colGoal === 2 && nowCarStatus[i].curArea.i === 2) {
          unimpeded = nowTrajectory[2][8] === 0 && nowTrajectory[2][7] === 0;
        } else if (colGoal === 4 && nowCarStatus[i].curArea.i === 4) {
          unimpeded = nowTrajectory[4][8] === 0 && nowTrajectory[4][7] === 0;
        } else if (colGoal === 6 && nowCarStatus[i].curArea.i === 6) {
          unimpeded = nowTrajectory[6][8] === 0 && nowTrajectory[6][7] === 0;
        } else if (nowCarStatus[i].curArea.i === 2) {
          unimpeded = nowTrajectory[3][9] === 0 && nowTrajectory[4][9] === 0;
        } else if (nowCarStatus[i].curArea.i === 4) {
          unimpeded = nowTrajectory[5][9] === 0 && nowTrajectory[6][9] === 0;
        }

        //console.log('goal row of 1st car', nowCarStatus[0].curGoal.j);
        if (unimpeded) {
          // 如果目的地就在8行，那么就匀速到达。
          if (nowCarStatus[i].curGoal.j === 8) {
            nowCarStatus[i].velocity = 1;
          } else if (nowCarStatus[i].velocity < MAX_VELOCITY) {
            nowCarStatus[i].velocity += ACCELERATION;
          }
        } else if (!unimpeded) {
          // 前方有阻塞，立刻减速, 直到速度为 0
          if (nowCarStatus[i].velocity > 0) {
            nowCarStatus[i].velocity -= ACCELERATION;
          }
        }

        if (nowCarStatus[i].curGoal.j !== 9) {
          nowCarInStage[i].y += nowCarStatus[i].velocity;
        } else {
          nowCarInStage[i].x += nowCarStatus[i].velocity;
        }

        let newI = Math.round((nowCarInStage[i].x - 250) / 100);
        let newJ = Math.round((1150 - nowCarInStage[i].y) / 100);
        let oldI = nowCarStatus[i].curArea.i;
        if (newI !== oldI) {
          nowTrajectory[oldI][9] = 0;
          nowTrajectory[oldI + 1][9] = 1;
          nowCarStatus[i].curArea.i = newI;
        }
        if (newJ !== 9) {
          nowTrajectory[oldI][9] = 0;
          nowTrajectory[oldI][9 - 1] = 1;
          nowCarStatus[i].curArea.j = newJ;
        }
        // possible to (3,9),(5,9) or (2, 8)(4, 8)(6, 8)
      } else if ((nowCarStatus[i].curArea.i === 2 || nowCarStatus[i].curArea.i === 4 || nowCarStatus[i].curArea.i === 6) && nowCarStatus[i].curArea.j >= 1 && nowCarStatus[i].curArea.j <= 8) {
        // cargo position 堆放货物的列数里面
        let positionI = nowCarStatus[i].curArea.i;
        let positionJ = nowCarStatus[i].curArea.j;
        let unimpeded;

        if (positionJ === 1) {
          // if(!!nowTrajectory[positionI + 1]){
          //   unimpeded = nowTrajectory[positionI][0] === 0 && nowTrajectory[positionI - 1][0] === 0 && nowTrajectory[positionI + 1][0] === 0;
          // }else{
          unimpeded = nowTrajectory[positionI][0] === 0 && nowTrajectory[positionI - 1][0] === 0;
          // }
        } else {
          unimpeded = nowTrajectory[positionI][positionJ - 1] === 0 && nowTrajectory[positionI][positionJ - 2] === 0;
        }

        // 如果要等，就速度为零，或者已经到达目标位置（curgoal 和 当前 nowCarInStage 的位置一样）, no new curGoal, the car will stop now.
        if (nowCarStatus[i].waitingTime > 0
            || (
                (nowCarInStage[i].x >= 250 - 5 + nowCarStatus[i].curGoal.i * 100 && nowCarInStage[i].x <= 250 + 5 + nowCarStatus[i].curGoal.i * 100)
                && (nowCarInStage[i].y >= 1150 - 5 - nowCarStatus[i].curGoal.j * 100 && nowCarInStage[i].y <= 1150 + 5 - nowCarStatus[i].curGoal.j * 100)
            )) {
          console.log('wait time of 1st car', nowCarStatus[i].waitingTime);
          console.log('wait time of 1st car', nowCarStatus[i].waitingTime > 0);
          console.log('stage x of 1st car', nowCarInStage[i].x);
          console.log('stage y of 1st car', nowCarInStage[i].y);
          console.log('cur goal of 1st car', nowCarStatus[i].curGoal);
          nowCarStatus[i].velocity = 0;
        } else if (unimpeded) {
          // 如果目的地就在当前行、当前列，那么就保持 velocity 为 1 匀速到达。
          if (nowCarStatus[i].curGoal.j === positionJ && nowCarStatus[i].curGoal.i === positionI) {
            nowCarStatus[i].velocity = 1;
          } else if (nowCarStatus[i].velocity < MAX_VELOCITY) {
            nowCarStatus[i].velocity += ACCELERATION;
          }
        } else if (!unimpeded) {
          // 前方有阻塞，立刻减速, 直到速度为 0
          if (nowCarStatus[i].velocity > 0) {
            nowCarStatus[i].velocity -= ACCELERATION;
          }
        }

        // 在y轴方向移动，
        nowCarInStage[i].y += nowCarStatus[i].velocity;

        // 这一段是有可能本身所在区域就是 终点。
        // 更新小车 curArea 和 trajectory 的数据
        let newJ = Math.round((1150 - nowCarInStage[i].y) / 100);
        if (newJ !== positionJ) {
          nowTrajectory[positionI][positionJ] = 0;
          nowTrajectory[positionI][positionJ - 1] = 1;
          nowCarStatus[i].curArea.j = newJ;
        }
        // possible to 2/4/6 上面的货物列里面。and possible to （2，0）（4，0）（6，0）
      } else if ((nowCarStatus[i].curArea.i === 2 || nowCarStatus[i].curArea.i === 4 || nowCarStatus[i].curArea.i === 6) && nowCarStatus[i].curArea.j === 0) {
        // 最下面轨道的三个点 路口，
        //console.log('到达最下面一条横轨道');
        let positionI = nowCarStatus[i].curArea.i;
        let unimpeded = nowTrajectory[positionI - 1][0] === 0 && nowTrajectory[positionI - 2][0] === 0;

        let oldLeft = Math.round((nowCarInStage[i].x - 250 - 40) / 100); //这个地方用小车左边的端点作为判断 所在区域。
        let oldRight = Math.round((nowCarInStage[i].x - 250 + 40) / 100); //这个地方用小车右边的端点作为判断 所在区域。
        // console.log('oldLeft', oldLeft, 'oldRight', oldRight);

        if (unimpeded) {
          // 如果畅通，没有到最大速度 5 就加速，加速度是 0.125 保证 100 的最大刹车距离。
          if (nowCarStatus[i].velocity < MAX_VELOCITY) {
            nowCarStatus[i].velocity += ACCELERATION;
          }
        } else if (!unimpeded) {
          // 前方有阻塞，立刻减速, 直到速度为 0
          if (nowCarStatus[i].velocity > 0) {
            nowCarStatus[i].velocity -= ACCELERATION;
          }
        }

        // 这李有问题，没有到达中心点的时候是不能直接向左移动的。
        if (nowCarStatus[i].curGoal.i !== 0) {
          nowCarInStage[i].y += nowCarStatus[i].velocity;
        } else {
          // 在x轴方向移动，
          nowCarInStage[i].x -= nowCarStatus[i].velocity;
        }

        // let newI = Math.round((nowCarInStage[i].x - 250) / 100); 这个地方做一点修改，
        let newI = Math.round((nowCarInStage[i].x - 250 - 40) / 100); //这个地方用小车左边的端点作为判断 所在区域。
        let newIRight = Math.round((nowCarInStage[i].x - 250 + 40) / 100); //这个地方用小车右边的端点作为判断 所在区域。
        // console.log('newLeft', newI, 'newRight', newIRight);

        // 只要左右端点不在同一个 area 上，那么，小车 curarea 就是左端的一个，占位是both area；
        // 如果左右端点判断在同一个area，那么 curarea 和 占位 area 就是同一个。
        if (newI !== newIRight) {
          nowTrajectory[newIRight][0] = 1;
          nowTrajectory[newI][0] = 1;
          nowCarStatus[i].curArea.i = newI;
        } else if (oldLeft !== oldRight && newI === newIRight) {
          nowTrajectory[newI][0] = 1;
          nowTrajectory[oldRight][0] = 0;
          nowCarStatus[i].curArea.i = newI;
        }
        // possible to (1,0)(3,0)(5,0)

      } else if ((nowCarStatus[i].curArea.i === 1 || nowCarStatus[i].curArea.i === 3 || nowCarStatus[i].curArea.i === 5 || nowCarStatus[i].curArea.i === 7) && nowCarStatus[i].curArea.j === 0) {
        //针对这3个点，
        let positionI = nowCarStatus[i].curArea.i;
        let unimpeded = nowTrajectory[positionI - 1][0] === 0 && nowTrajectory[positionI - 1][1] === 0;

        let oldLeft = Math.round((nowCarInStage[i].x - 250 - 40) / 100); //这个地方用小车左边的端点作为判断 所在区域。
        let oldRight = Math.round((nowCarInStage[i].x - 250 + 40) / 100); //这个地方用小车右边的端点作为判断 所在区域。

        if (unimpeded) {
          // 如果畅通，没有到最大速度 5 就加速，加速度是 0.125 保证 100 的最大刹车距离。
          if (nowCarStatus[i].velocity < MAX_VELOCITY) {
            nowCarStatus[i].velocity += ACCELERATION;
          }
        } else if (!unimpeded) {
          // 前方有阻塞，立刻减速, 直到速度为 0
          if (nowCarStatus[i].velocity > 0) {
            nowCarStatus[i].velocity -= ACCELERATION;
          }
        }

        // 在x轴方向移动，
        nowCarInStage[i].x -= nowCarStatus[i].velocity;
        let newI = Math.round((nowCarInStage[i].x - 250 - 40) / 100); //这个地方用小车左边的端点作为判断 所在区域。
        let newIRight = Math.round((nowCarInStage[i].x - 250 + 40) / 100); //这个地方用小车右边的端点作为判断 所在区域。
        if (newI !== newIRight) {
          nowTrajectory[newI][0] = 1;
          nowTrajectory[newIRight][0] = 1;
          nowCarStatus[i].curArea.i = newI;
        } else if (oldLeft !== oldRight && newI === newIRight) {
          nowTrajectory[newI][0] = 1;
          nowTrajectory[oldRight][0] = 0;
          nowCarStatus[i].curArea.i = newI;
        }
        // possible to (0,0)(2,0)(4,0) , (0,0)是已经考虑过的，
      }
      //以上，更新了 nonowCarStatus 里面的 curArea， 以及 nowCarInStage 里面的位置。

      // console.log(nowTrajectory[0][0], nowTrajectory[1][0], nowTrajectory[2][0], nowTrajectory[3][0],);
      // 最后应该就是 更新 state 里面的数据了
      this.setState({
        trajectory: nowTrajectory,
        carStatus: nowCarStatus,
        carInStage: nowCarInStage,
      })

    }


  }

  animate() {
    // if(!!this.state.trajectory[0]){
    //   console.log(this.state.trajectory[0][0]);
    // } component did mount 的时候是没有完全给this.state.trajectory里面赋好值的。

    requestAnimationFrame(this.animate); // loop animate 60 fps

    if (!!this.state.trajectory[0]) {
      this.updateAllCar();
    }
    this.renderer.render(this.stage);

    /*setTimeout(() => {
     requestAnimationFrame(this.animate);

     if (!!this.state.trajectory[0]) {
     this.updateAllCar();
     }

     this.renderer.render(this.stage);
     }, 10);*/
  }

  render() {
    return (
        <div className="App">
          <div className="pixi-container" ref="gameCanvas">

          </div>

          <div className="interface">
            <div className="fixed-window">
              <p className="carNum">小车数量：{this.state.carStatus.length}</p>
              <Button type="primary" onClick={this.addCar}>add</Button>
              <Button type="primary" onClick={this.clearAll}>clear all</Button>
            </div>
            <div className="group-box">
              <p className="rowNum">1</p>
              <ButtonGroup class="box-group">
                <Button type="primary" size="large">1</Button>
                <Button type="primary" size="large">2</Button>
                <Button type="primary" size="large">3</Button>
              </ButtonGroup>
              <br/>
              <br/>
              <p className="rowNum">2</p>
              <ButtonGroup class="box-group">
                <Button type="primary" size="large">1</Button>
                <Button type="primary" size="large">2</Button>
                <Button type="primary" size="large">3</Button>
              </ButtonGroup>
              <br/>
              <br/>
              <p className="rowNum">3</p>
              <ButtonGroup class="box-group">
                <Button type="primary" size="large">1</Button>
                <Button type="primary" size="large">2</Button>
                <Button type="primary" size="large">3</Button>
              </ButtonGroup>
              <br/>
              <br/>
              <p className="rowNum">4</p>
              <ButtonGroup class="box-group">
                <Button type="primary" size="large">1</Button>
                <Button type="primary" size="large">2</Button>
                <Button type="primary" size="large">3</Button>
              </ButtonGroup>
              <br/>
              <br/>
              <p className="rowNum">5</p>
              <ButtonGroup class="box-group">
                <Button type="primary" size="large">1</Button>
                <Button type="primary" size="large">2</Button>
                <Button type="primary" size="large">3</Button>
              </ButtonGroup>
              <br/>
              <br/>
              <p className="rowNum">6</p>
              <ButtonGroup class="box-group">
                <Button type="primary" size="large">1</Button>
                <Button type="primary" size="large">2</Button>
                <Button type="primary" size="large">3</Button>
              </ButtonGroup>
              <br/>
              <br/>
              <p className="rowNum">7</p>
              <ButtonGroup class="box-group">
                <Button type="primary" size="large">1</Button>
                <Button type="primary" size="large">2</Button>
                <Button type="primary" size="large">3</Button>
              </ButtonGroup>
              <br/>
              <br/>
              <p className="rowNum">8</p>
              <ButtonGroup class="box-group">
                <Button type="primary" size="large">1</Button>
                <Button type="primary" size="large">2</Button>
                <Button type="primary" size="large">3</Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
    );
  }
}

export
default
DispatchDemo;
