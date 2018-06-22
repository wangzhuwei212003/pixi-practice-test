/**
 * Created by zhuweiwang on 2018/6/22.
 */
import React, {Component} from 'react';
import * as PIXI from "pixi.js";

class helloWorld extends Component {

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    // this.renderer = PIXI.autoDetectRenderer(1366, 768);
    //
    // this.stage = new PIXI.Container();
    // this.stage.width = 1000;
    // this.stage.height = 500;
    // console.log(this.stage);
    //
    // this.isWebGL = this.renderer instanceof PIXI.WebGLRenderer;
    //
    // if (!this.isWebGL) {
    //   this.renderer.context.mozImageSmoothingEnabled = false;
    //   this.renderer.context.webkitImageSmoothingEnabled = false
    // }
    // /*
    //  * Fix for iOS GPU issues
    //  */
    // this.renderer.view.style['transform'] = 'translatez(0)';
    //
    // this.refs.gameCanvas.appendChild(this.renderer.view);


    this.sayHello();
    this.createApplication();
    this.createRenderer();
  }

  sayHello() {
    let type = "WebGL";
    if (!PIXI.utils.isWebGLSupported()) {
      type = "canvas"
    }

    PIXI.utils.sayHello(type);
    console.log('sayHello occurred', type);
  }

  createRenderer() {
    // let renderer = PIXI.autoDetectRenderer(366, 768);
    let renderer = PIXI.autoDetectRenderer(
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
    document.body.appendChild(renderer.view);

    //Create a container object called the `stage`. The `stage` is the root container for all your objects
    let stage = new PIXI.Container();

    //The `renderer.view` is just an ordinary `<canvas>` element.
    //Here's how you can reference to add an optional dashed
    //border around the canvas
    renderer.view.style.border = "10px dashed black";

    // renderer.render(stage); // 第一次不需要 render stage
    this.changeRenderer(renderer); // 后面改也没有调用 render stage ！ 可能是改变的是renderer，而不是 stage。
  }

  createApplication() {
    //Create a Pixi Application
    // let app = new PIXI.Application({width: 256, height: 256});
    let app = new PIXI.Application({
          width: 256,         // default: 800
          height: 256,        // default: 600
          antialias: true,    // default: false 抗锯齿
          transparent: false, // default: false
          resolution: 1       // default: 1
          // forceCanvas: true,
        }
    );

    //Add the canvas that Pixi automatically created for you to the HTML document
    // document.body.appendChild(app.view); // 这里是直接 document body appendChild，还可以是 ref addChild
    this.refs.gameCanvas.appendChild(app.view);

    // setTimeout(this.changeRendererApp(app), 2000); // 错误示范，直接就执行了，没有等
    setTimeout(this.changeRendererApp.bind(this, app), 2000);
  }

  changeRendererApp(app) {
    app.renderer.backgroundColor = 0x061639;

    app.renderer.autoResize = true;
    app.renderer.resize(512, 512);

    app.renderer.view.style.position = "absolute";
    app.renderer.view.style.display = "block";
    app.renderer.autoResize = true;
    app.renderer.resize(window.innerWidth, window.innerHeight); // 能够填满整个屏幕的大小
  }

  changeRenderer(renderer) {
    //If you want to make the canvas fill the entire window, you can apply this
//CSS styling:
     renderer.view.style.position = "absolute"
     renderer.view.style.width = window.innerWidth + "px";
     renderer.view.style.height = window.innerHeight + "px";
     renderer.view.style.display = "block";
    renderer.view.style.border = "15px dashed green";

//To resize the canvas
    renderer.resize(512, 512);

//To change the background color
    renderer.backgroundColor = 0x061639;
  }


  render() {
    return (
        <div ref="gameCanvas">
          <p>
            1. sayHello occurred 意味着 sayhello 方法生效，<br/>
            2. 一个 black square -》createApplication 方法生效 <br/>
            3. black square变化，-》changeRenderer 生效，<br/>
            <br/><br/><br/>

          </p>
        </div>
    );
  }
}

export default helloWorld;
