/**
 * Created by zhuweiwang on 2018/6/23.
 */
/**
 * Created by zhuweiwang on 2018/6/23.
 */
/**
 * Created by zhuweiwang on 2018/6/22.
 */
import React, {Component} from 'react';
import * as PIXI from "pixi.js";
import {Menu, Icon, Button, Layout} from 'antd';

export default class primitiveText extends Component {

  constructor(props) {
    super(props);
    this.state = {
      sprite: null
    }
  }

  componentDidMount() {
    this.createRenderer();
    this.drawRect();
    this.drawCircle();
    this.drawEllipse();
    this.drawRoundedRect();
    this.drawLines();
    this.drawPolygons();
    this.drawText();
  }

  createRenderer() {
    // let renderer = PIXI.autoDetectRenderer(366, 768);
    this.renderer = PIXI.autoDetectRenderer(
        256,                     //Width
        256,                     //Height
        {                        //Options
          antialiasing: false,
          transparent: false,
          resolution: 1
        },
        false                    //Optionally force canvas rendering
    );

    //Add the canvas to the HTML document
    // document.body.appendChild(renderer.view);
    this.refs.gameCanvas.appendChild(this.renderer.view);

    //Create a container object called the `stage`. The `stage` is the root container for all your objects
    this.stage = new PIXI.Container();

    //The `renderer.view` is just an ordinary `<canvas>` element.
    //Here's how you can reference to add an optional dashed
    //border around the canvas
    this.renderer.view.style.border = "10px dashed black";
  }

  drawRect() {
    let rectangle = new PIXI.Graphics();
    rectangle.lineStyle(4, 0xFF3300, 1);
    rectangle.beginFill(0x66CCFF);
    rectangle.drawRect(0, 0, 64, 64);
    rectangle.endFill();
    rectangle.x = 170;
    rectangle.y = 170;
    this.stage.addChild(rectangle);
    this.renderer.render(this.stage);
  }

  drawCircle() {
    let circle = new PIXI.Graphics();
    circle.beginFill(0x9966FF);
    circle.drawCircle(0, 0, 32);
    circle.endFill();
    circle.x = 64;
    circle.y = 130;
    this.stage.addChild(circle);
    this.renderer.render(this.stage);
  }

  drawEllipse() {
    let ellipse = new PIXI.Graphics();
    ellipse.beginFill(0xFFFF00);
    ellipse.drawEllipse(0, 0, 50, 20);
    ellipse.endFill();
    ellipse.x = 180;
    ellipse.y = 130;
    this.stage.addChild(ellipse);
    this.renderer.render(this.stage);

  }

  drawRoundedRect() {
    let roundBox = new PIXI.Graphics();
    roundBox.lineStyle(4, 0x99CCFF, 1);
    roundBox.beginFill(0xFF9933);
    roundBox.drawRoundedRect(0, 0, 84, 36, 10);
    roundBox.endFill();
    roundBox.x = 48;
    roundBox.y = 190;
    this.stage.addChild(roundBox);
    this.renderer.render(this.stage);
  }

  drawLines() {
    let line = new PIXI.Graphics();
    line.lineStyle(4, 0xFFFFFF, 1);
    line.moveTo(0, 0);
    line.lineTo(80, 50);
    line.x = 32;
    line.y = 32;
    this.stage.addChild(line);
    this.renderer.render(this.stage);
  }

  drawPolygons() {
    let triangle = new PIXI.Graphics();
    triangle.beginFill(0x66FF33);

//Use `drawPolygon` to define the triangle as
//a path array of x/y positions

    triangle.drawPolygon([
      -32, 64,             //First point
      32, 64,              //Second point
      0, 0                 //Third point
    ]);

//Fill shape's color
    triangle.endFill();

//Position the triangle after you've drawn it.
//The triangle's x/y position is anchored to its first point in the path
    triangle.x = 180;
    triangle.y = 22;

    this.stage.addChild(triangle);
    this.renderer.render(this.stage);
  }

  drawText() {
    let style = new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: 36,
      fill: "white",
      stroke: '#ff3300',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 6,
    });

    let message = new PIXI.Text("Hello Pixi!", style);
    message.position.set(54, 96);

    message.text = "Text changed!";

    this.stage.addChild(message);
    this.renderer.render(this.stage);
  }



  render() {
    return (
        <div ref="gameCanvas">
          <p>
            1. And, fortunately, it uses almost the same API as the Canvas Drawing API ，<br/>
            2. learning 暂时告一段落，TOBE Continued, case study, take it further <br/>
            <br/><br/>
          </p>
          {/*<Button type='dahsed' onClick={this.removeSprite.bind(this)}>remove cat</Button>*/}
          {/*<Button type='dahsed' onClick={this.resumeSprite.bind(this)}>resume cat</Button>*/}
          {/*<Button type='primary' onClick={this.changeCatPosition.bind(this)}>change position</Button>*/}
          {/*<Button type='primary' onClick={this.changeScale.bind(this)}>change Scale</Button>*/}
          {/*<Button type='primary' onClick={this.rotate.bind(this)}>rotate</Button>*/}
          <br/>
        </div>
    );
  }

}