/**
 * Created by zhuweiwang on 2018/6/23.
 */
import React, {Component} from 'react';
import * as PIXI from "pixi.js";
import {Menu, Icon, Button, Layout} from 'antd';

import catImage from '../images/cat.png'; // 这一步很关键，没有这句话，在下面直接用文件路径是不行的。
import doorImage from '../images/door.png'; //

export default class moving extends Component {

  constructor(props) {
    super(props);
    this.state = {
      sprite: null
    };
    this.gameloop = this.gameloop.bind(this); // 关键，不然就是requestanimate找不到this.gameloop
  }

  componentDidMount() {
    this.createRenderer();
    this.loadImage();
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

  loadImage() {
    PIXI.loader
        .add([
          catImage,
          doorImage
        ])
        .on("progress", this.loadProgressHandler)
        .load(this.setUp.bind(this));
  }

  loadProgressHandler(loader, resource) {
    //Display the file `url` currently being loaded
    console.log("loading: " + resource.url);

    //Display the percentage of files currently loaded
    console.log("progress: " + loader.progress + "%");

    //If you gave your files names as the first argument
    //of the `add` method, you can access them like this
    console.log("loading: " + resource.name);
  }
  setUp() {
    let cat = new PIXI.Sprite(
        PIXI.loader.resources[catImage].texture
    );
    // add the cat to the stage
    this.setState({
      sprite: cat
    });

    cat.x = 97;
    cat.y = 97;
    cat.vx = 0;
    cat.vy = 0;

    this.stage.addChild(cat);
    this.renderer.render(this.stage); // 这个是必须要的，不然显示不出来。

    // create a new Sprite from an image path
    // let bunny = PIXI.Sprite.fromImage('../images/cat.png') // 这是另一种loadimage的方法。
  }

  removeSprite() {
    console.log('remove sprite');
    this.stage.removeChild(this.state.sprite);
    this.stage.removeChildren(); // bug 如果没有这句话，点击两次resume，就remove不掉了。
    this.renderer.render(this.stage);
  }

  resumeSprite() {
    console.log('resume sprite');
    this.setUp();
  }

  changePosition(){
    let cat = this.state.sprite;
    cat.position.set(123,123);

    cat.width = 50;
    cat.height = 80;

    this.renderer.render(this.stage);
  }

  changeScale(){
    let cat = this.state.sprite;
    cat.scale.x = 2;
    cat.scale.y = 2;
    // cat.scale.set(2,2); 一样的效果。

    this.renderer.render(this.stage);
  }
  rotate(){
    let cat = this.state.sprite;

    cat.anchor.x = 0.5;
    cat.anchor.y = 0.5; // 很奇怪，这个 rotate 不是中心旋转。

    cat.rotation = 0.5;

    this.renderer.render(this.stage);
  }

/*  moveSetUp(){
    let self = this;
    //Start the game loop by adding the `gameLoop` function to
    //Pixi's `ticker` and providing it with a `delta` argument. ticker renderer里没有？还是用 requestAnimationFrame
    this.renderer.ticker.add(delta => self.gameLoop.bind(self, delta));
  }*/
  gameloop(){
    console.log('gameloop occurred');
    //Call this `gameLoop` function on the next screen refresh
    //(which happens 60 times per second)
    requestAnimationFrame(this.gameloop);

    //Move the cat 1 pixel
    this.state.sprite.x += 1;

    this.renderer.render(this.stage); // 这句也是关键，这个是改变了之后要重新 render
  }

  velocity = () => {
    let cat = this.state.sprite;

    //Update the cat's velocity
    cat.vx = 5;
    cat.vy = 5;

    //Apply the velocity values to the cat's
    //position to make it move
    cat.x += cat.vx;
    cat.y += cat.vy;

    this.renderer.render(this.stage);
  };

  render() {
    return (
        <div ref="gameCanvas">
          <p>
            1. load image，<br/>
            2. movement, velocity <br/>
            3. keyboard movement TO be continued... <br/>
            <br/>
          </p>
          <Button type='dahsed' onClick={this.removeSprite.bind(this)}>remove cat</Button>
          <Button type='dahsed' onClick={this.resumeSprite.bind(this)}>resume cat</Button>
          {/*<Button type='primary' onClick={this.changePosition.bind(this)}>change position</Button>*/}
          {/*<Button type='primary' onClick={this.changeScale.bind(this)}>change Scale</Button>*/}
          {/*<Button type='primary' onClick={this.rotate.bind(this)}>rotate</Button>*/}
          <Button type='primary' onClick={this.gameloop.bind(this)}>moveSetUp</Button>
          <Button type='primary' onClick={this.velocity}>velocity</Button>
          <br/>
        </div>
    );
  }

}