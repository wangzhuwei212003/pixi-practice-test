/**
 * Created by zhuweiwang on 2018/6/23.
 */
/**
 * Created by zhuweiwang on 2018/6/22.
 */
import React, {Component} from 'react';
import * as PIXI from "pixi.js";
import {Menu, Icon, Button, Collapse} from 'antd';
import config from './config';
import car from './core/car'
import {
  shuttles,
  addOneMore
} from './core/shuttleInstances'
import {initialDispatch} from './CoopAStarDispatch/dispatch';

import tileImage from '../../Learning/images/tileset.png'; // 这一步很关键，没有这句话，在下面直接用文件路径是不行的。
const Panel = Collapse.Panel;
const text = `
  1. 注册一辆小车，
  2. 注册上来之后，起始位置在原点
  3. 直接去顶部停靠点
  4. 到达顶部停靠点之后，分配一个任务（简化为随机生成一个目标点。一个随机的行列数）（分配任务假定耗时2秒，看起来正常点。）
  5. 开始执行任务的流程
  6. 任务执行完成之后，再次进行第 4 步，自行找到一个随机目标点。（简化）
`;

export default class VirtualCar extends Component {

  constructor(props) {
    super(props);
    this.state = {
      sprite: null,
      car: null,
    };
    this.gameLoop = this.gameLoop.bind(this); // 关键，不然就是requestanimate找不到this.gameloop
    // this.testCar = this.testCar.bind(this); // 关键，不然就是requestanimate找不到this.gameloop
  }

  componentDidMount() {
    this.createRenderer();
    this.loadImage();
  }

  createRenderer() {
    // let renderer = PIXI.autoDetectRenderer(366, 768);
    this.renderer = PIXI.autoDetectRenderer(
        1556,                     //Width
        1556,                     //Height
        {                        //Options
          antialiasing: false,
          transparent: false,
          resolution: 1
        },
        false                    //Optionally force canvas rendering
    );
    this.refs.gameCanvas.appendChild(this.renderer.view);
    this.stage = new PIXI.Container();
    this.renderer.view.style.border = "10px dashed black";
  }

  loadImage() {
    PIXI.loader
        .add([
          tileImage
        ])
        .on("progress", this.loadProgressHandler)
        .load(this.setUp.bind(this));
  }

  loadProgressHandler(loader, resource) {
    console.log("loading: " + resource.url);
    console.log("progress: " + loader.progress + "%");
    console.log("loading: " + resource.name);
  }

  setUp() {
    let texture = PIXI.utils.TextureCache[tileImage];
    let rectangle = new PIXI.Rectangle(192, 128, 64, 64); //(x, y, width, height);
    texture.frame = rectangle;
    let rocket = new PIXI.Sprite(texture);
    rocket.x = 32;
    rocket.y = 32;
    rocket.scale.set(0.5);

    this.setState({
      sprite: rocket,
    });

    this.addMap();

    this.stage.addChild(rocket);
    this.renderer.render(this.stage);
  }

  addMap() {
    let maps = new PIXI.Container();

    for (let rowIndex = 0; rowIndex < config.bigRowNum; rowIndex += 1) {
      for (let colIndex = 0; colIndex < config.bigColNum; colIndex += 1) {
        let circle = new PIXI.Graphics();
        circle.beginFill(0x554455);
        // circle.beginFill(0x9966FF);
        circle.drawCircle(0, 0, config.pixelGap / 2);
        circle.endFill();
        circle.x = colIndex * config.pixelGap;
        circle.y = rowIndex * config.pixelGap;
        maps.addChild(circle);
      }
    }
    maps.position.set(0, config.pixelGap);
    this.stage.addChild(maps);
  }

  testCar() {
    // console.log('test car pressed');
    // this.state.car.updateOdomByTime(50); // 这里的参数是每次循环，小车走过的实际时间。这里应该是给后端更新数据
    // this.state.car.updateOdomTest(100);
    // console.log(this.state.car);
    this.state.sprite.y = config.bigRowNum * config.pixelGap - this.state.car.odom.current_row * config.pixelGap;
    this.state.sprite.x = this.state.car.odom.current_column * config.pixelGap;
    switch (this.state.car.odom.theoretical_moving_direction.toString()) {
      case config.SpecificActions['SA_ODOM_FORWARD_GROUND_AS_REFERENCE'].toString():
        this.state.sprite.x += this.state.car.odom.offsetPercent * config.pixelGap;
        break;
      case config.SpecificActions['SA_ODOM_BACKWARD_GROUND_AS_REFERENCE'].toString():
        this.state.sprite.x -= this.state.car.odom.offsetPercent * config.pixelGap;
        break;
      case config.SpecificActions['SA_ODOM_UP_GROUND_AS_REFERENCE'].toString():
        this.state.sprite.y -= this.state.car.odom.offsetPercent * config.pixelGap;
        break;
      case config.SpecificActions['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString():
        this.state.sprite.y += this.state.car.odom.offsetPercent * config.pixelGap;
        break;
    }
  }

  gameLoop() {
    this.loop = setTimeout(() => {
      const startT = Date.now();

      this.testCar();
      // console.log('gameloop occurred');
      requestAnimationFrame(this.gameLoop);
      this.renderer.render(this.stage); // 这句也是关键，这个是改变了之后要重新 render

      const endT = Date.now();
      // console.log('循环一步时间：', endT - startT);
    }, 20); // 这里是循环的频率。每次循环的间隔。如果这里的时间设的太短，stop loop 的按钮需要按很多下。不是很灵。
  }

  sendTestPathInfo() {
    this.state.car.handlePathInfoReceived(config.pathInfo_test1);
    // 更新小车的当前路径。
    // 这里应该是调用后端的方法，更改后端的数据。。

    console.log(shuttles);
    console.log('流程2 ')

  }

  stopLoop() {
    console.log('stop loop function occurred');
    clearTimeout(this.loop);
  }

  initialDispatch() {
    initialDispatch();
  }

  registerOneMore() {
    // 注册一辆车，初始位置在原点
    const uid = Date.now();
    addOneMore(uid);
    console.log(shuttles); //这个就是做出改变的数据
    console.log('流程1，添加一辆小车 ')

    // 以上是后端数据
    this.state.car = shuttles[uid];
    this.gameLoop();
  }

  findNextGoal(){
    console.log('find next goal...')

    console.log('流程4 ')

  }

  render() {
    return (
        <div ref="gameCanvas">
          <p>
            调度相关的代码和小车交互： <br/>
            1. 发送整个路径 pathInfo，总齿数、actions；<br/>
            2. 实时给小车发送速度. 三档 最大速度、过活门速度、0速 <br/>
            3. 实时接收小车当前的 odom (DONE,注册过的小车会以一定的频率给dispatch文件发位置报告。)<br/>
          </p>
          <Collapse accordion>
            <Panel header="路径格式， pathInfo 格式" key="1">
              <p>{JSON.stringify(config.pathInfo)}</p>
            </Panel>
            <Panel header="位置报告格式，odom 格式" key="2">
              <p>{JSON.stringify(config.Odometry)}</p>
            </Panel>
            <Panel header="流程：" key="3">
              <p>{text}</p>
            </Panel>
          </Collapse>
          <Button type='primary' onClick={this.testCar}>test car</Button>
          <Button type='dashed' onClick={this.gameLoop.bind(this)}>game loop</Button>
          <Button type='danger' onClick={this.sendTestPathInfo.bind(this)}>send test pathInfo </Button>
          <Button type='dashed' onClick={this.stopLoop.bind(this)}>stop loop </Button>
          <br/>
          <br/>
          <Button type='primary' onClick={this.initialDispatch.bind(this)}>initial dispatch </Button>
          <br/>
          <br/>
          <p>首先 initial dispatch，再添加一辆车。</p>
          <Button type='primary' onClick={this.registerOneMore.bind(this)}>流程1：注册一辆小车（后端注册一辆小车） </Button>
          <br/>
          <Button type='primary' onClick={this.sendTestPathInfo.bind(this)}>流程2：注册上来后，起始位置在原点，直接去顶部停靠点（更新小车的 pathinfo ） </Button>
          <br/>
          <Button type='primary' onClick={this.gameLoop.bind(this)}>流程2-1：开始运动 </Button>
          <br/>
          <Button type='primary' onClick={this.findNextGoal.bind(this)}>流程4：到达之后，找一个随机目标点，生成下一段 pathinfo </Button>

        </div>
    );
  }

}

