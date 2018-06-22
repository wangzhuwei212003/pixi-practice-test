/**
 * Created by zhuweiwang on 2018/6/22.
 */
import React, {Component, PropTypes} from 'react';
import * as PIXI from "pixi.js";

class DotPath extends Component {

  static propTypes = {};

  constructor(props) {
    super(props);
    // bind animate function 这个地方一定要有 bind，因为下面没有用箭头函数。
    this.animate = this.animate.bind(this);
    this.addDot = this.addDot.bind(this);

    this.state = {
      dotsCurGoal: [],
      direction: 0, // 打算用0，1，2，3，4分别标识静止，x加y加，x减y加，x减y减，x加y减的5种情况。
      dots: []
    };
  }

  componentDidMount() {
    this.renderer = PIXI.autoDetectRenderer(1366, 768);

    this.stage = new PIXI.Container();
    this.stage.width = 1000;
    this.stage.height = 500;
    console.log(this.stage);

    this.isWebGL = this.renderer instanceof PIXI.WebGLRenderer;

    if (!this.isWebGL) {
      this.renderer.context.mozImageSmoothingEnabled = false;
      this.renderer.context.webkitImageSmoothingEnabled = false
    }
    /*
     * Fix for iOS GPU issues
     */
    this.renderer.view.style['transform'] = 'translatez(0)';

    this.refs.gameCanvas.appendChild(this.renderer.view);

    // this.dotTexture = new PIXI.Texture.fromImage(logo,undefined,undefined, 1.0);
    // dot container
    // this.dotContainer = new PIXI.particles.ParticleContainer(1000, [false, true, false, false, false]);
    // this.stage.addChild(this.dotContainer);
    // for(let i=0; i<10; i++){
    //   this.addDot()
    // }


    // draw rect
    this.rect = new PIXI.Graphics();
    this.rect.lineStyle(4, 0xFF3300, 1);
    this.rect.beginFill(0x66CCFF);
    this.rect.drawRect(0, 0, 64, 64);
    this.rect.endFill();
    this.rect.x = 170;
    this.rect.y = 170;
    this.stage.addChild(this.rect);

    // // draw circle
    this.circle = new PIXI.Graphics();
    this.circle.beginFill(0x9966FF);
    this.circle.drawCircle(0, 0, 32);
    this.circle.endFill();
    this.circle.x = 64;
    this.circle.y = 64;
    this.stage.addChild(this.circle);

    // path
    const p1 = {
      x: -50,
      y: 0
    };
    const p2 = {
      x: 380,
      y: 0
    };
    const p3 = {
      x: 380,
      y: 150
    };
    const p4 = {
      x: 180,
      y: 150
    };
    const p5 = {
      x: 180,
      y: 350
    };
    const p6 = {
      x: 1080,
      y: 350
    };
    const p7 = {
      x: 1080,
      y: 250
    };
    const p8 = {
      x: 780,
      y: 250
    };
    const p9 = {
      x: 780,
      y: 150
    };
    const p10 = {
      x: 950,
      y: 150
    };
    this.path = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10];

    this.path.reduce((oldValue, newValue) => {
      //self.drawTrack(key, newValue, oldValue);
      console.log(oldValue, newValue);
      return newValue
    });

    // debugger;
    // draw line
    this.line = new PIXI.Graphics();
    this.line.lineStyle(4, 0xFFFFFF, 1);
    this.line.moveTo(this.path[0].x, this.path[0].y);
    // this.line.lineTo(80, 0);
    // this.line.lineTo(80, 150);
    // this.line.lineTo(180, 150);
    // this.line.lineTo(180, 350);
    // this.line.lineTo(480, 350);
    for (let i = 1; i < this.path.length; i++) {
      //this.line.lineTo(this.path[i].x, this.path[i].y)
    }
    this.line.x = 64;
    this.line.y = 64;
    this.stage.addChild(this.line);

    // draw path

    console.log(this.path);
    this.pathData = [
      {
        x: -50,
        y: 0
      },{
        x: 380,
        y: 0
      },{
        x: 380,
        y: 10
      },{
        x: 380,
        y: 40
      },{
        x: 380,
        y: 50
      },{
        x: 380,
        y: 110
      },{
        x: 380,
        y: 150
      },{
        x: 180,
        y: 150
      },{
        x: 180,
        y: 160
      },{
        x: 180,
        y: 165
      },{
        x: 180,
        y: 177
      },{
        x: 180,
        y: 250
      },{
        x: 180,
        y: 350
      },{
        x: 1080,
        y: 350
      },{
        x: 1080,
        y: 250
      },{
        x: 780,
        y: 250
      },{
        x: 780,
        y: 150
      },{
        x: 950,
        y: 150
      }
    ];
    this.findAnglePoint(this.pathData); // 根据一段机器人发来的pathData算出拐点。

    this.initDots(20);

    this.animate(); // 循环更新
  }

  // initialize the first frame
  //initDots(totalNum) {
  initDots(gap) {


    let startPoint = this.path[0];
    console.log('this.path from init dots');
    console.log(this.path);
    let nowX = startPoint.x;
    let nowY = startPoint.y;
    let nextPointIndex = 1;
    let nextPoint = this.path[nextPointIndex];
    this.addDot(nowX, nowY, nextPointIndex); // 起点加一个点

    let totalPath = 0; // 算出路径总长度
    this.path.forEach((ele, index, array)=>{
      if(index+1 !== array.length){
        if (ele.x === array[index+1].x){
          totalPath += Math.abs(array[index+1].y - ele.y);
        }else if(ele.y === array[index+1].y){
          totalPath += Math.abs(array[index+1].x - ele.x);
        }else{
          console.log('path 里面的点不是规则的点？')
        }
      }
      console.log(index);
      console.log(totalPath);
    });
    console.log(totalPath);

    let totalNum = ~~(totalPath/gap); // 根据gap算出所有点的个数
    console.log(totalNum);

    // let gap = totalPath/totalNum; // 根据所有点的个数 算出 gap
    // console.log(gap);

    console.log(`start init ${totalNum} dots`);
    for (let i = 1; i < totalNum; i += 1) {
      // 算出每一个 dot 的x y，对应的下一个目标拐点，然后用 add cart。
      // 第一个点是起点。
      if (nowX === nextPoint.x) {
        // console.log(`now X Y: ${nowX} ${nowY}`);
        // console.log(nextPoint); // 这个判断是错误的，这个x相同应该是y方向在变化
        // console.log(`判断为在${nowX}和${nextPoint.x}之间，y方向变化`); // 这个判断是错误的，这个x相同应该是y方向在变化
        // console.log(`第${i}个点`);
        if (nextPoint.y - nowY  > 0 && nextPoint.y - nowY > gap) {
          nowY += gap;
          this.addDot(nowX, nowY, nextPointIndex);
        } else if (nextPoint.y - nowY < 0 && nowY - nextPoint.y > gap) {
          nowY -= gap;
          this.addDot(nowX, nowY, nextPointIndex);
        } else {
          // 如果gap不够这一段，那么下一段肯定是x方向变化
          let newIndex = nextPointIndex + 1;
          const gapRemain = gap - Math.abs(nowY - nextPoint.y);

          // console.log(newIndex);
          console.log(this.path[newIndex].x);
          // console.log(nextPoint.x);
          // console.log(gapRemain);

          if(newIndex === this.path.length){
            // 如果超了，整个的 init 都可以 return 了。
            return;
          }else{
            if (this.path[newIndex].x - nextPoint.x > 0 && this.path[newIndex].x - nextPoint.x > gapRemain) {
              nowY = nextPoint.y;
              nowX += gapRemain;
              this.addDot(nowX, nowY, newIndex);

              // console.log(newIndex);
              // console.log(nowX);
              // console.log(nowY);

              nextPoint = this.path[newIndex];
              nextPointIndex = newIndex;
            } else if (this.path[newIndex].x - nextPoint.x < 0 && nextPoint.x - this.path[newIndex].x  > gapRemain) {
              nowY = nextPoint.y;
              nowX -= gapRemain;
              this.addDot(nowX, nowY, newIndex);

              // console.log(newIndex);
              // console.log(nowX);
              // console.log(nowY);

              nextPoint = this.path[newIndex];
              nextPointIndex = newIndex;
            }else{
              console.log('gap 太大 或者是 拐点太密');
              // console.log('todo，gap横跨2个及2个以上的拐点');
              nowY = nextPoint.y;
              nowX = nextPoint.x;
            }
          }
        }
      } else if (nowY === nextPoint.y) {
        // console.log(`now X Y: ${nowX} ${nowY}`);
        // console.log(nextPoint);
        // console.log(`判断为在${nowY}和${nextPoint.y}点之间，x方向变化`);
        // console.log(`第${i}个点`);
        if (nextPoint.x - nowX  > 0 && nextPoint.x - nowX > gap) {
          nowX += gap;
          this.addDot(nowX, nowY, nextPointIndex);
        } else if (nextPoint.x - nowX < 0 && nowX - nextPoint.x > gap) {
          nowX -= gap;
          this.addDot(nowX, nowY, nextPointIndex);
        } else {
          // 如果gap不够这一段，那么下一段肯定是y方向变化
          let newIndex = nextPointIndex + 1;
          const gapRemain = gap - Math.abs(nowX - nextPoint.x);

          // console.log(newIndex);
          // console.log(gapRemain);
          console.log(this.path[newIndex]);
          console.log(nextPoint);

          if(newIndex === this.path.length){
            // 如果超了，整个的 init 都可以 return 了。
            return;
          }else{
            if (this.path[newIndex].y - nextPoint.y > 0 && this.path[newIndex].y - nextPoint.y > gapRemain) {
              nowX = nextPoint.x;
              nowY += gapRemain;
              this.addDot(nowX, nowY, newIndex);
              nextPoint = this.path[newIndex];
              nextPointIndex = newIndex;
              // console.log(nowX);
              // console.log(nowY);

            } else if (this.path[newIndex].y - nextPoint.y < 0 && nextPoint.y - this.path[newIndex].y> gapRemain) {
              nowX = nextPoint.x;
              nowY -= gapRemain;
              this.addDot(nowX, nowY, newIndex);
              nextPoint = this.path[newIndex];
              nextPointIndex = newIndex;
            }else{
              console.log('gap 太大 或者是 拐点太密');
              // console.log('todo，gap横跨2个及2个以上的拐点');
              nowY = nextPoint.y;
              nowX = nextPoint.x;
            }
          }
        }
      }
    }

  }

  // 在 initDots 里面添加 dot, 更新state 以及 添加点到 pixi stage
  addDot(x, y, goalIndex) {
    // let dot = new PIXI.Sprite(this.dotTexture);
    // console.log('dot',dot);
    // 先不想 svg 这种复杂的

    let circle = new PIXI.Graphics();
    circle.beginFill(0x559922);
    circle.drawCircle(0, 0, 5);
    circle.endFill();
    circle.x = this.line.x + x;
    circle.y = this.line.y + y; // 首先就从line的起点开始。偏移量加上计算出来的距离

    let preDotCurGoal = this.state.dotsCurGoal;
    let preDot = this.state.dots;
    preDotCurGoal.push({
      i: goalIndex,
      x: this.path[goalIndex].x,
      y: this.path[goalIndex].y,
    });
    preDot.push(circle);
    this.setState({
      dotsCurGoal:preDotCurGoal,
      dots: preDot
    }); // 在state里面保存每一个点的当前目标, 以及当前的点的 pixi graphics。

    // console.log(this.state.dotsCurGoal);
    // console.log(this.state.dots);
    this.stage.addChild(circle); // 所谓的 addDot， 关键就是在这一步，添加dot到container里面去。
  }
  // 有一个地方，就是我这些点只在 initDot 这里面 addChild 了，然后后面 update 都是直接在 this.state 里面更新的。
  // 也就是说，这里的 addChild 相当于add了一个地址，然后后面我改this.state里面的这个地址的元素，该元素是依然已经 addChild 了。
  // 所以 对应到 Robot Panel 里面，需要改变的 pixi 的元素就得 最好放在 this.state 里面。

  updateDotState(index, circle){
    let preDots =  this.state.dots;
    preDots[index] = circle;
    this.setState({
      dots: preDots,
    })
  }

  updateDotGoalState(index, curGoal){
    let preDotsCurGoal = this.state.dotsCurGoal;
    preDotsCurGoal[index] = curGoal;
    this.setState({
      dotsCurGoal: preDotsCurGoal,
    })

    //console.log(this.state.dotsCurGoal[5])
  }

  animate() {
    // render the stage container
    // this.rect.x += 1;
    // if (this.rect.x === 200) {
    //   this.rect.x = 0
    // }

    //console.log(this.state.dots);

    if (this.state.dots.length !== 0) {
      for(let i=0;i<this.state.dots.length; i+=1){
        this.updateSingleDot(i); // 改变每一个点的位置，并setState。好像如果不 setState 不会有变化
      }
    }

    this.renderer.render(this.stage);
    // this.frame = requestAnimationFrame(this.animate); // loop this function 60 per second
    requestAnimationFrame(this.animate); // loop this function 60 per second
  }

  // 根据 index 更新一个点的位置, dots, dotsCurGoal. 这个函数可以说是用来分配下一个 goal 的。
  // 但是多个点需要首先初始状态设置好，然后再来用这个函数来foreach整个dots。
  updateSingleDot(index){
    let curCircle = this.state.dots[index];
    let curX = curCircle.x - this.line.x;
    let curY = curCircle.y - this.line.y; // 减去偏移量 才有可比较性
    // console.log(curX);
    // console.log(curY);
    const goalX = this.state.dotsCurGoal[index].x;
    const goalY = this.state.dotsCurGoal[index].y;

    if(index ===1){
      //console.log(this.state.dotsCurGoal[index]);
    }
    //console.log(this.state.dotsCurGoal[index]);
    // 这里首先确定一个线速度
    const v = 1;

    if (curX === goalX) {
      //console.log(`判断为在${curY}和${goalY}之间，y方向变化`); // 这个判断是错误的，这个x相同应该是y方向在变化
      if (goalY - curY > 0 && goalY - curY > v) {
        curCircle.y += v;
        this.updateDotState(index, curCircle);
      } else if (goalY - curY < 0 && curY - goalY > v) {
        curCircle.y -= v;
        this.updateDotState(index, curCircle);
      } else {
        let laterIndex = this.state.dotsCurGoal[index].i + 1;
        if(laterIndex === this.path.length){
          curCircle.y = this.path[0].y + this.line.y;
          curCircle.x = this.path[0].x + this.line.x;
          this.updateDotState(index, curCircle);
          this.updateDotGoalState(index, {
            i:1,
            x:this.path[1].x,
            y:this.path[1].y,
          });
        }else{
          curCircle.y = goalY + this.line.y;
          this.updateDotState(index, curCircle);
          this.updateDotGoalState(index, {
            i:laterIndex,
            x:this.path[laterIndex].x,
            y:this.path[laterIndex].y,
          });
        }
      }
    } else if (curY === goalY) {
      //console.log(`判断${index}点变化`);
      //console.log(`判断为在${curX}和${goalX}点之间，x方向变化`);
      if (goalX - curX > 0 && goalX - curX > v) {
        curCircle.x += v;
        this.updateDotState(index, curCircle);
      } else if (goalX - curX < 0 && curX - goalX > v) {
        curCircle.x -= v;
        this.updateDotState(index, curCircle);
      } else {
        let laterIndex = this.state.dotsCurGoal[index].i + 1;
        if(laterIndex === this.path.length){
          curCircle.x = this.path[0].x + this.line.x;
          curCircle.y = this.path[0].y + this.line.y;
          this.updateDotState(index, curCircle);
          this.updateDotGoalState(index, {
            i:1,
            x:this.path[1].x,
            y:this.path[1].y,
          });
        }else{
          curCircle.x = goalX + this.line.x;
          this.updateDotState(index, curCircle);
          this.updateDotGoalState(index, {
            i:laterIndex,
            x:this.path[laterIndex].x,
            y:this.path[laterIndex].y,
          });
        }
      }
    }
  }

  // 给出一串点，找出拐点
  // 相邻的三个点，1、3两点x、y对应都不同，1、2两点相同的x或y坐标是拐点的坐标，另一坐标是第三点的x或y坐标。
  // 首尾是算不出来的，直接push进去
  findAnglePoint = (pathData)=>{
    let result = [pathData[0]];
    for(let i = 0;i < pathData.length - 2;i += 1){
      const exist =  pathData[i].x !== pathData[i+2].x && pathData[i].y !== pathData[i+2].y;
      if(!exist){
        continue;
      }else{
        let anglePoint = {};
        if(pathData[i].x === pathData[i+1].x){
          console.log('拐点x坐标确定');
          anglePoint.x = pathData[i].x;
          anglePoint.y = pathData[i+2].y;
        }else if(pathData[i].y === pathData[i+1].y){
          console.log('拐点y坐标确定');
          anglePoint.x = pathData[i+2].x;
          anglePoint.y = pathData[i].y;
        }
        console.log(anglePoint);
        result.push(anglePoint);
      }
    }
    result.push(pathData[pathData.length - 1]);
    console.log(result);
    return result;
  };

  render() {
    return (
        <div ref="gameCanvas">
          <p>
            1. 首先创建 renderer，以及 stage，<br/>
            2. child 存在this.state里，然后 addchild 在 stage 里  <br/>
            3. 然后是画线、画点。直接就是 update this.state 里的数据，<br/>
            4. 在animate（更新画面的函数里this.renderer.render(this.stage);）不停的 render stage， 就能够动起来。
            <br/><br/><br/>

          </p>
        </div>
    );
  }
}

export default DotPath;
