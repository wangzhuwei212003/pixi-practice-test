/**
 * Created by zhuweiwang on 2018/6/23.
 */
/**
 * Created by zhuweiwang on 2018/6/22.
 */
import React, {Component} from 'react';
import * as PIXI from "pixi.js";
import {Menu, Icon, Button, Layout} from 'antd';

import catImage from '../images/cat.png'; // 这一步很关键，没有这句话，在下面直接用文件路径是不行的。
import doorImage from '../images/door.png'; //

export default class groupSprite extends Component {

  constructor(props) {
    super(props);
    this.state = {
      sprite: null
    }
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
    //The cat
    let cat = new PIXI.Sprite(
        PIXI.loader.resources[catImage].texture
    );
    cat.position.set(16, 16);

//The hedgehog
    let door = new PIXI.Sprite(
        PIXI.loader.resources[doorImage].texture
    );
    door.position.set(32, 32);

    let animals = new PIXI.Container();
    animals.addChild(cat);
    animals.addChild(door);

    console.log(animals);
    console.log(animals.children); // 到时候能不能直接用 children 来改变，不用在this state 里存所有的。是可以的

    animals.position.set(10,10);

    console.log(animals.toGlobal(cat.position)); // parentSprite.toGlobal(childSprite.position)
    console.log(cat.parent.toGlobal(cat.position)); //
    console.log(door.getGlobalPosition().x); //

    console.log(door.toLocal(door.position, cat).x); //Use toLocal to find the distance between a sprite and any other sprite.

    this.setState({
      sprite: animals
    });

    this.stage.addChild(animals);
    this.renderer.render(this.stage);

    // let cat = new PIXI.Sprite(
    //     PIXI.loader.resources[catImage].texture
    // );
    // // add the cat to the stage
    // this.setState({
    //   sprite: cat
    // });
    //
    // cat.x = 97;
    // cat.y = 97;
    //
    // this.stage.addChild(cat);
    // this.renderer.render(this.stage); // 这个是必须要的，不然显示不出来。

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

  changeCatPosition(){
    let cat = this.state.sprite.children[0];
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

  render() {
    return (
        <div ref="gameCanvas">
          <p>
            1. load image，<br/>
            2. position and rotate <br/>
            3. Using a ParticleContainer to group sprites TO BE CONTINUED <br/>
            <br/><br/>
          </p>
          <Button type='dahsed' onClick={this.removeSprite.bind(this)}>remove cat</Button>
          <Button type='dahsed' onClick={this.resumeSprite.bind(this)}>resume cat</Button>
          <Button type='primary' onClick={this.changeCatPosition.bind(this)}>change position</Button>
          <Button type='primary' onClick={this.changeScale.bind(this)}>change Scale</Button>
          <Button type='primary' onClick={this.rotate.bind(this)}>rotate</Button>
          <br/>
        </div>
    );
  }

}