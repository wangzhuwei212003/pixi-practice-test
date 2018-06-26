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

import tileImage from '../../Learning/images/tileset.png'; // 这一步很关键，没有这句话，在下面直接用文件路径是不行的。

const Panel = Collapse.Panel;
const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`;

export default class VirtualCar extends Component {

  constructor(props) {
    super(props);
    this.state = {
      sprite: null
    };
    this.gameLoop = this.gameLoop.bind(this); // 关键，不然就是requestanimate找不到this.gameloop
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
    let texture = PIXI.TextureCache[tileImage];
    let rectangle = new PIXI.Rectangle(192, 128, 64, 64); //(x, y, width, height);
    texture.frame = rectangle;
    let rocket = new PIXI.Sprite(texture);
    rocket.x = 32;
    rocket.y = 32;
    rocket.scale.set(0.5);

    this.setState({
      sprite:rocket
    });

    this.stage.addChild(rocket);
    this.renderer.render(this.stage);
  }

  testCar(){
    console.log('test car pressed');
    const testCar = new car();
    testCar.updateOdomTest(100);

    this.state.sprite.y = testCar.odom.total_teeth_from_origin;
  }

  gameLoop(){
    this.testCar();
    console.log('gameloop occurred');
    requestAnimationFrame(this.gameLoop);

    this.renderer.render(this.stage); // 这句也是关键，这个是改变了之后要重新 render
  }

  render() {
    return (
        <div ref="gameCanvas">
          <p>
            调度相关的代码和小车交互： <br/>
            1. 发送整个路径 pathInfo，总齿数、actions；<br/>
            2. 实时给小车发送速度. 三档 最大速度、过活门速度、0速 <br/>
            3. 实时接收小车当前的 odom <br/>
          </p>
          <Collapse accordion>
            <Panel header="路径格式， pathInfo 格式" key="1">
              <p>{JSON.stringify(config.pathInfo)}</p>
            </Panel>
            <Panel header="位置报告格式，odom 格式" key="2">
              <p>{JSON.stringify(config.Odometry)}</p>
            </Panel>
            <Panel header="This is panel header 3" key="3">
              <p>{text}</p>
            </Panel>
          </Collapse>
          <Button type='primary' onClick={this.testCar}>test car</Button>
          <Button type='primary' onClick={this.gameLoop.bind(this)}>game loop</Button>
          <br/>
        </div>
    );
  }

}

