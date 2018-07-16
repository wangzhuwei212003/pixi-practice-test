/**
 * Created by zhuweiwang on 2018/6/25.
 * 这个方法的目标就是，根据   this.odom.total_teeth_from_origin 的变化，
 * 或者说，
 * 是根据 更新的时间，updateTimeGap、currentSpeed、和当前的 odom，算出现在的 odom 应该是怎么样子的。
 *
 * return newOdom
 *
 * 首先，基于已有的二模库
 *
 */
import config from '../config'


export const updateOdom = function (updateTimeGap, curSpeed, odom, pathInfo) {
  const totalTeethAdd = updateTimeGap/1000 * curSpeed;
  const newOdom = JSON.parse(JSON.stringify(odom));
  const Actions = pathInfo.Actions; // 一个数组

  newOdom.total_teeth_from_origin += totalTeethAdd;

  let offsetChanged = false; // 判断这一次循环有没有把新的 offset 加上去，如果没有，在把整个 actions loop完之后是要再次加上的。

  // 每一次更新不能横跨多个 action，不能横跨两个格子。要给时间更新 odom
  // 转弯不能在一次更新中完成。

  // 找到这一段距离中的 actions，有可能是两个。
  for (let actionI = 0; actionI < Actions.length; actionI += 1) {
    if (
        Actions[actionI].target_teeth < odom.total_teeth_from_origin ||
        Actions[actionI].target_teeth > newOdom.total_teeth_from_origin
    ) {
      // 不在这次更新的范围内。
      continue
    }
    //否则就是这次前进阶段的 action
    const refNum = config.SpecificActions[Actions[actionI].specific_action];

    let target_teeth, horizontalAdd, verticalAdd;

    switch (refNum.toString()) {
      case config.SpecificActions['SA_PIN_OUTSTRETCH'].toString():
        console.log('action SA_PIN_OUTSTRETCH', '伸pin 对 odom 没有影响。');
        break;
      case config.SpecificActions['SA_PIN_RETRIEVE'].toString():
        console.log('action SA_PIN_RETRIEVE', '缩pin 对 odom 没有影响。');
        break;
      case config.SpecificActions['SA_ODOM_FORWARD_GROUND_AS_REFERENCE'].toString():
        console.log('action SA_ODOM_FORWARD_GROUND_AS_REFERENCE', '运动方向变为向前');
        /*// 运动方向由上升变为向前
         * 1. 偏移量开始改变增加的对象
         * 2. theoretical_moving_direction 改变
         * 3. 行列数也会发生改变，不会改变行列数。。。。。。。。！！！！
         * 4. turning: false, 转弯结束
         *
         * 其实这个动作，只有在上升列转为水平的一个点会有
         * */
        // 1. 偏移量发生改变，竖直方向的偏移量到头，归零，水平的偏移量开始增加。
        target_teeth = Actions[actionI].target_teeth;
        horizontalAdd = newOdom.total_teeth_from_origin - target_teeth;
        // 多出来的部分算作水平方向的偏移量
        newOdom.horizontal_offset_from_nearest_coordinate = horizontalAdd;
        newOdom.vertical_offset_from_nearest_coordinate = 0; // 实际的程序中似乎是没有这个归零的动作
        newOdom.theoretical_moving_direction = config.SpecificActions['SA_ODOM_FORWARD_GROUND_AS_REFERENCE'].toString();
        newOdom.turning = false; // 方向发生改变，turning 变为 false

        offsetChanged = true;
        break;
      case config.SpecificActions['SA_ODOM_BACKWARD_GROUND_AS_REFERENCE'].toString():
        console.log('action SA_ODOM_BACKWARD_GROUND_AS_REFERENCE', '运动方向变为向后');
        /*// 运动方向由下降变为向后，即下降列变为水平列运动。
         * 1. 偏移量开始改变增加的对象
         * 2. theoretical_moving_direction 改变
         * 3. 行列数也会发生改变，不会改变行列数。。。。。。。。！！！！
         * 4. turning: false, 转弯结束
         *
         * */
        // 1. 偏移量发生改变，竖直方向的偏移量到头，归零，水平的偏移量开始增加。
        target_teeth = Actions[actionI].target_teeth;
        horizontalAdd = newOdom.total_teeth_from_origin - target_teeth;
        // 多出来的部分算作水平方向的偏移量
        newOdom.horizontal_offset_from_nearest_coordinate = horizontalAdd;
        newOdom.vertical_offset_from_nearest_coordinate = 0; // 实际的程序中似乎是没有这个归零的动作
        newOdom.theoretical_moving_direction = config.SpecificActions['SA_ODOM_BACKWARD_GROUND_AS_REFERENCE'].toString();
        newOdom.turning = false; // 方向发生改变，turning 变为 false

        offsetChanged = true;
        break;
      case config.SpecificActions['SA_ODOM_UP_GROUND_AS_REFERENCE'].toString():
        console.log('action SA_ODOM_UP_GROUND_AS_REFERENCE', '运动方向变为向上');
        /*// 运动方向由水平变为上升，即水平列变为上升列运动。

         这里暂不考虑中间列向上运动取货的情况。TODO

         * 1. 偏移量开始改变增加的对象
         * 2. theoretical_moving_direction 改变
         * 3. 行列数也会发生改变，不会改变行列数。。。。。。。。！！！！
         * 4. turning: false, 转弯结束
         *
         * */
        // 1. 偏移量发生改变，竖直方向的偏移量到头，归零，水平的偏移量开始增加。
        target_teeth = Actions[actionI].target_teeth;
        verticalAdd = newOdom.total_teeth_from_origin - target_teeth;
        // 多出来的部分算作水平方向的偏移量
        newOdom.horizontal_offset_from_nearest_coordinate = 0;
        newOdom.vertical_offset_from_nearest_coordinate = verticalAdd; // 实际的程序中似乎是没有这个归零的动作
        newOdom.theoretical_moving_direction = config.SpecificActions['SA_ODOM_UP_GROUND_AS_REFERENCE'].toString();
        newOdom.turning = false; // 方向发生改变，turning 变为 false

        offsetChanged = true;
        break;
      case config.SpecificActions['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString():
        console.log('action SA_ODOM_DOWN_GROUND_AS_REFERENCE', '运动方向变为向下');
        /*// 运动方向由水平变为下降，即水平列变为下降列运动。

         这里暂不考虑中间列向上运动取货完成之后，再向下运动的情况。TODO 这个是特殊情况

         * 1. 偏移量开始改变增加的对象
         * 2. theoretical_moving_direction 改变
         * 3. 行列数也会发生改变，不会改变行列数。。。。。。。。！！！！
         * 4. turning: false, 转弯结束
         *
         * */
        // 1. 偏移量发生改变，竖直方向的偏移量到头，归零，水平的偏移量开始增加。
        target_teeth = Actions[actionI].target_teeth;
        verticalAdd = newOdom.total_teeth_from_origin - target_teeth;
        // 多出来的部分算作水平方向的偏移量
        newOdom.horizontal_offset_from_nearest_coordinate = 0;
        newOdom.vertical_offset_from_nearest_coordinate = verticalAdd; // 实际的程序中似乎是没有这个归零的动作
        newOdom.theoretical_moving_direction = config.SpecificActions['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString();
        newOdom.turning = false; // 方向发生改变，turning 变为 false

        offsetChanged = true;
        break;
      case config.SpecificActions['SA_TURNING_BEGIN_POINT'].toString():
        console.log('action SA_TURNING_BEGIN_POINT');
        /*
         * 开始转弯，
         * 1. 竖直或者是水平方向的偏移量不会在这里改变方向。
         * 2. theoretical_moving_direction也不是这里改变的
         * 3. 行列数会发生改变. 行列数好像也不是在这里改变的。。。。。。。。！
         * 4. truning 改为 true
         *
         * */
        newOdom.turning = true;
        break;
    }
  } // end loop of actions

  // action loop 完了之后，odom里面其他的值都在上面这个 loop 里解决。 更改行列数在loop完之后。
  if (!offsetChanged) {
    // 如果是没有改变 offset，就是根据当前的运动方向，改变 offset
    switch (odom.theoretical_moving_direction.toString()) {
      case config.SpecificActions['SA_ODOM_FORWARD_GROUND_AS_REFERENCE'].toString():
        // console.log('action SA_ODOM_FORWARD_GROUND_AS_REFERENCE', '运动方向为向前');
        newOdom.horizontal_offset_from_nearest_coordinate += totalTeethAdd;
        break;
      case config.SpecificActions['SA_ODOM_BACKWARD_GROUND_AS_REFERENCE'].toString():
        // console.log('action SA_ODOM_BACKWARD_GROUND_AS_REFERENCE', '运动方向为向后');
        newOdom.horizontal_offset_from_nearest_coordinate += totalTeethAdd;
        break;
      case config.SpecificActions['SA_ODOM_UP_GROUND_AS_REFERENCE'].toString():
        // console.log('action SA_ODOM_UP_GROUND_AS_REFERENCE', '运动方向为向上');
        newOdom.vertical_offset_from_nearest_coordinate += totalTeethAdd;
        break;
      case config.SpecificActions['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString():
        // console.log('action SA_ODOM_DOWN_GROUND_AS_REFERENCE', '运动方向为向下');
        newOdom.vertical_offset_from_nearest_coordinate += totalTeethAdd;
        break;
    }
  }

  /*
   * 之前说过的，两种特殊情况，向上取货以及，向上取货完毕，应该另外写一个方法，在下任务的时候就调用。
   * TODO：
   *
   * 现在考虑的都是没有上面说的这种特殊情况。
   * */
  // 上面完了之后，可以根据 offest 算行列数了。
  /*
   * 1. 根据现有的行列数、运动方向，找到下一个格子的齿数。
   * 2. 根据offset 来算格子数。
   *
   *
   * */

  const nextCellTeeth = findCellTeeth(odom.current_row, odom.current_column, odom.theoretical_moving_direction); // 这个是下一个格子的齿数。

  switch (odom.theoretical_moving_direction.toString()) {
    case config.SpecificActions['SA_ODOM_FORWARD_GROUND_AS_REFERENCE'].toString():
      if (newOdom.horizontal_offset_from_nearest_coordinate > nextCellTeeth) {
        newOdom.current_column += 1;
        newOdom.horizontal_offset_from_nearest_coordinate -= nextCellTeeth;
        newOdom.offsetPercent = 0; // 这里不准确。
      }else{
        newOdom.offsetPercent = newOdom.horizontal_offset_from_nearest_coordinate / nextCellTeeth
      }
      break;
    case config.SpecificActions['SA_ODOM_BACKWARD_GROUND_AS_REFERENCE'].toString():
      if (newOdom.horizontal_offset_from_nearest_coordinate > nextCellTeeth) {
        newOdom.current_column -= 1;
        newOdom.horizontal_offset_from_nearest_coordinate -= nextCellTeeth;
        newOdom.offsetPercent = 0;
      }else{
        newOdom.offsetPercent = newOdom.horizontal_offset_from_nearest_coordinate / nextCellTeeth
      }
      break;
    case config.SpecificActions['SA_ODOM_UP_GROUND_AS_REFERENCE'].toString():
      // console.log('yundongfangsxiangxiangshagn ');
      // console.log(nextCellTeeth);
      if (newOdom.vertical_offset_from_nearest_coordinate > nextCellTeeth) {
        newOdom.current_row += 1;
        newOdom.vertical_offset_from_nearest_coordinate -= nextCellTeeth;
        newOdom.offsetPercent = 0;
      }else{
        newOdom.offsetPercent = newOdom.vertical_offset_from_nearest_coordinate / nextCellTeeth
      }
      break;
    case config.SpecificActions['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString():
      if (newOdom.vertical_offset_from_nearest_coordinate > nextCellTeeth) {
        newOdom.current_row -= 1;
        newOdom.vertical_offset_from_nearest_coordinate -= nextCellTeeth;
        newOdom.offsetPercent = 0;
      }else{
        newOdom.offsetPercent = newOdom.vertical_offset_from_nearest_coordinate / nextCellTeeth
      }
      break;
  }

  return newOdom;
};

const findCellTeeth = function (current_row, current_column, theoretical_moving_direction) {
  // 直接就是odom里面的一样的数据。根据现有的行列数，以及 运动方向，找到对应的
  // 下一个格子的齿数
  const topRowIndex = config.bigRowNum - 1;
  const lastColIndex = config.bigColNum - 1;

  // 特殊的先来，从上到下
  if (
      current_row === topRowIndex &&
      current_column === 1
  ) {
    // 顶部特殊长度 52
    return config.specialTopPartBig;
  } else if (
      current_row === topRowIndex &&
      theoretical_moving_direction.toString() === config.SpecificActions['SA_ODOM_FORWARD_GROUND_AS_REFERENCE'].toString()
  ) {
    // 除此之外，往前走，上面的都是 normal
    return config.normalWidthBig;
  } else if (
      current_row === topRowIndex &&
      theoretical_moving_direction.toString() === config.SpecificActions['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString()
  ) {
    // 顶部一行，方向是向下，剩下的最上面一行的货位里的格子
    return config.topBoxNormalHeightBig;
  } else if (
      theoretical_moving_direction.toString() === config.SpecificActions['SA_ODOM_UP_GROUND_AS_REFERENCE'].toString() &&
      current_column === 0
  ) {
    // 上升列，
    if (current_row === config.SDownPartBigRow) {
      // S形弯道下部分
      return config.SDownPartBig;
    } else if (current_row === config.SUPPartBigRow) {
      return config.SUPPartBig;
    } else if (current_row === 0){
      return config.specialHeight; // 如果是 0，0 向上的运动方向，那么就是一个特殊长度。
    } else if(current_row === topRowIndex - 1){
      return config.topBoxNormalHeightBig
    } else {
      return config.normalHeightBig;
    }
  } else if (
      theoretical_moving_direction.toString() === config.SpecificActions['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString() &&
      current_column === lastColIndex
  ) {
    // 下降列，
    if (current_row === config.SDownPartBigRow + 1) {
      // S形弯道下部分
      return config.SDownPartBig;
    } else if (current_row === config.SUPPartBigRow + 1) {
      return config.SUPPartBig;
    }else if(current_row === 1){
      return config.specialHeight; //一个特殊长度。
    }else if(current_row === 0){
      // 倒数第一行 特殊宽度部分
      return config.doubleBottomPartBig;
    }else{
      return config.normalHeightBig;
    }
  } else if (
      current_row < topRowIndex && current_row > 1
  ) {
    // 中间正常部分
    return config.normalHeightBig;
  } else if (
      current_row === 1
  ) {
    // 倒数第二行 特殊高度部分
    if (
        theoretical_moving_direction.toString() === config.SpecificActions['SA_ODOM_UP_GROUND_AS_REFERENCE'].toString()
    ) {
      // 如果是向上运动，
      return config.normalHeightBig;
    } else {
      return config.specialHeight;
    }
  } else if (
      current_row === 0 &&
      current_column === 2
  ) {
    // 倒数第一行 特殊宽度部分
    return config.specialBottomPartBig;
  } else if (current_row === 0) {
    return config.normalWidthBig;
  } else {
    console.log('some situation senario not considered!!');
  }
};

export const switchOdomDownToUp = function (odom) {
  // 这里需要转换小车的odom，由于特殊情况
  // 根据发过来的路径（负号）判断出，小车odom需要转换了。本来是向下，转换成向上。

  const newOdom = JSON.parse(JSON.stringify(odom));
  // 向上运动的所在位置的格子都是正常齿数的格子。目前不可能是在（1，3）下面开始向上运动。
  newOdom.vertical_offset_from_nearest_coordinate = config.normalHeightBig - odom.vertical_offset_from_nearest_coordinate;
  newOdom.current_row -= 1;
  newOdom.theoretical_moving_direction = config.SpecificActions['SA_ODOM_UP_GROUND_AS_REFERENCE'].toString();

  return newOdom;
};
export const switchOdomUpToDown = function (odom) {
  // 这里需要转换小车的odom，由于特殊情况向上取货完成之后，要向下运动。
  // 本来是向上，转换成向下。

  const newOdom = JSON.parse(JSON.stringify(odom));
  // 向上运动的所在位置的格子都是正常齿数的格子。目前不可能是在（1，3）下面开始向上运动。
  newOdom.vertical_offset_from_nearest_coordinate = config.normalHeightBig - odom.vertical_offset_from_nearest_coordinate;
  newOdom.current_row += 1;
  newOdom.theoretical_moving_direction = config.SpecificActions['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString();

  return newOdom;
};