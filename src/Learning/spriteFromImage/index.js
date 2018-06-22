/**
 * Created by zhuweiwang on 2018/6/22.
 */
import React, {Component} from 'react';
import * as PIXI from "pixi.js";

import catImage from '../images/cat.png';

export default class spriteFromImage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      sprite: null
    };

  }

  componentDidMount() {
    this.renderer = PIXI.autoDetectRenderer(566, 768);

    this.stage = new PIXI.Container();
    this.stage.width = 500;
    this.stage.height = 500;
    console.log(this.stage);
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
    this.refs.gameCanvas.appendChild(this.renderer.view);


    this.loadImage();
  }

  loadImage(){
    PIXI.loader
        .add(catImage)
        .load(this.setUp.bind(this));
  }

  setUp(){
    let cat = new PIXI.Sprite(
        PIXI.loader.resources[catImage].texture
    );
    console.log(cat);

    this.setState({
      sprite: cat
    });
    console.log(this.state.sprite);
    // add the cat to the stage
    this.stage.addChild(cat);
    this.renderer.render(this.stage);


    // create a new Sprite from an image path
    let bunny = PIXI.Sprite.fromImage('../images/cat.png')

    console.log(bunny);

// center the sprite's anchor point
    bunny.anchor.set(0.5);

// move the sprite to the center of the screen
    bunny.x = this.renderer.screen.width / 2;
    bunny.y = this.renderer.screen.height / 2;
    console.log(bunny.x, bunny.y);

    this.stage.addChild(bunny);

    this.renderer.render(this.stage);
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