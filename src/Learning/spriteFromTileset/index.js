/**
 * Created by zhuweiwang on 2018/6/22.
 */
import React, {Component} from 'react';
import * as PIXI from "pixi.js";
import {Menu, Icon, Button, Layout} from 'antd';

import tileImage from '../images/tileset.png'; // 这一步很关键，没有这句话，在下面直接用文件路径是不行的。

export default class spriteFromTileset extends Component {

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
          tileImage
        ])
        .on("progress", this.loadProgressHandler)
        .load(this.setUp.bind(this));
  }
  /*.add([
   {name: 'key4', url: 'http://...', onComplete: function () {} },
   {url: 'http://...', onComplete: function () {} },
   'http://...'
   ]);*/ // 很多用处的 loader

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
    //Create the `tileset` sprite from the texture
    let texture = PIXI.TextureCache[tileImage];

    //Create a rectangle object that defines the position and
    //size of the sub-image you want to extract from the texture
    //(`Rectangle` is an alias for `PIXI.Rectangle`)
    let rectangle = new PIXI.Rectangle(192, 128, 64, 64); //(x, y, width, height);

    //Tell the texture to use that rectangular section
    texture.frame = rectangle;

    //Create the sprite from the texture
    let rocket = new PIXI.Sprite(texture);

    //Position the rocket sprite on the canvas
    rocket.x = 32;
    rocket.y = 32;

    //Add the rocket to the stage
    this.stage.addChild(rocket);

    //Render the stage
    this.renderer.render(this.stage);
  }


  render() {
    return (
        <div ref="gameCanvas">
          <p>
            1. sprite From Tileset，Rocket <br/>
            2. Software. output PNG and JSON files in a standard format that is compatible with Pixi. <br/>
            3. treasureHunter TO be continued <br/>
            <br/><br/>
          </p>
          {/*<Button type='dahsed' onClick={this.removeSprite.bind(this)}>remove cat</Button>*/}
          {/*<Button type='dahsed' onClick={this.resumeSprite.bind(this)}>resume cat</Button>*/}
          {/*<Button type='primary' onClick={this.changePosition.bind(this)}>change position</Button>*/}
          {/*<Button type='primary' onClick={this.changeScale.bind(this)}>change Scale</Button>*/}
          {/*<Button type='primary' onClick={this.rotate.bind(this)}>rotate</Button>*/}
          <br/>
        </div>
    );
  }

}

