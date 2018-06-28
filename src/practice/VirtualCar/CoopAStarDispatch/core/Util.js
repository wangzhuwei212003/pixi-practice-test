/**
 * Created by zhuweiwang on 02/04/2018.
 */
import dispatchConfig from '../config/dispatchConfig';
import config from '../config/config';
import {shuttles} from '../../core/shuttleInstances.js';

import {
  findIdleUidOb,
  findIndexByUid,
  findParkingGoal,
  setGoal
} from '../dispatch';


const {
  rowNum,
  colNum,
  usedRowNum,

  pickStationRow,
  firstGoDownCol,
  lastGoDownCol,
  lastGoDownPickCol,
  divideCell,
  lookUpRowNum,

  h2vUpPinOutStretchCell,
  h2vDownSpecialPinOutStretchCell,
  h2vDownNormalPinOutStretchCell,

  specialTopStartCellCol,
  specialBtmStartCellCol,
  topBoxNormalHeightStartRow,
  topBoxNormalHeightEndRow,
  SDownPartStartRow,
  SDownPartEndRow,
  SUPPartStartRow,
  SUPPartEndRow,
  specialHeightStartRow,
  specialHeightEndRow,

  normalWidth, //水平方向一格的宽度
  normalHeight, // 一般货位高度是 66.83
  topBoxNormalHeight, // 最上面一行货位的高度是 60.23
  specialHeight, // 底部特殊高度，31.62
  compensate, // 方向改变的时候，齿数补偿，25 + 90度
  specialBottomPart, // 底部的特殊部分
  doubleBottomPart,
  specialTopPart, // 顶部的特殊部分
  SUPPart, // S形弯道上部分齿数
  SDownPart, // S形弯道下部分齿数
  timeGap,

  pickSitesSmallRow,
  pickSitesRowGap,

  occupyRowConfig,
  occupyColConfig,
  occupyRowConfigUnload,
  delayGap,
  slowPassGate,
  validSpeedDuration,
  avoidDist,
  crossRoadoccupyRowConfig
} = dispatchConfig;
const {showDispatchLog} = config;


export const backtrace = function (node) {
  const path = [[node.row, node.col]];
  while (node.parent) {
    node = node.parent;
    path.push([node.row, node.col]);
  }
  return path.reverse();
};

export const backtraceNode = function (node) {
  const pathTest = [node];
  while (node.parent) {
    node = node.parent;
    pathTest.push(node);
  }
  return pathTest.reverse();
};

/**
 * Huicang priority.
 *
 * @param {number} row - unit 当前点的 row.
 * @param {number} col - unit 当前点的 col
 *
 * @return {number} 具有期望效果的 priority，用来在heap里比较优先级。
 *
 * 分为6个部分
 * 1. 左边拣货台上面一格 到 顶部水平行开始转弯
 * 2. 中间有货位顶部一行部分
 * 3. 中间货位没有和水平运动交错的部分
 * 4. 右边下降列到底部
 * 5. 最底一行和下降列交汇的部分
 * 6. 剩下的部分到拣货台。
 *
 */

export const CalcPriority = function (cellRow, cellCol) {
  // 需要用到的数据
  // const pickStationRow = pickStationRow; // 拣货台的行数 21
  // const firstGoDownCol = firstGoDownCol; // 开始下降的第一列列数 8
  // const lastGoDownCol = lastGoDownCol; // 开始下降的有货位的最后一列列数 24
  // const lastGoDownPickCol = lastGoDownPickCol; // 下降列拣货台的列数 32
  const btmInterBeginRow = rowNum - 1 - crossRoadoccupyRowConfig; // 底部开始有交汇的行数，开始进入底部的通道 20 。这个地方不能太靠上。和occupyRow这个值不必一样。
  const btmRow = rowNum - 1; // 最底部一行行数 26
  const lastCol = colNum - 1; // 最后一列列数 35

  if (
      cellRow >= 0 && cellRow < pickStationRow &&
      cellCol >= 0 && cellCol < firstGoDownCol
  ) {
    // 拣货台上方一格到第一列即将转弯下降的一格
    return pickStationRow - cellRow + cellCol;
    // 最小：pickStationRow - (pickStationRow - 1) + 0, 1
    // 最大：pickStationRow - 0 + (firstGoDownCol - 1), 21 + 7 = 28
  } else if (
      cellRow === 0 &&
      cellCol >= firstGoDownCol && cellCol <= lastGoDownCol
  ) {
    // 中间货位顶部一行。
    return pickStationRow + cellCol;
    // 最小：pickStationRow + firstGoDownCol， 21 + 8 = 29，
    // 最大：pickStationRow + lastGoDownCol， 21 + 36 - 12 = 45
  } else if (
      cellRow > 0 && cellRow < btmInterBeginRow &&
      cellCol >= firstGoDownCol && cellCol <= lastGoDownCol
  ) {
    // 中间货位，不存在和底部横向的小车交汇的区域，不包括顶部一行。
    return pickStationRow + lastGoDownCol + 1 + (lastGoDownCol) * cellRow - cellCol;
    // 最小：pickStationRow + lastGoDownCol + 1 + (lastGoDownCol) * 1 - lastGoDownCol, 46，
    // 最大：pickStationRow + lastGoDownCol + 1 + (lastGoDownCol) * btmInterBeginRow - firstGoDownCol，46 + 24*(26-7) - 8 = 494
  } else if (
      cellRow >= 0 && cellRow < btmInterBeginRow &&
      cellCol <= lastCol && cellCol > lastGoDownCol
  ) {
    // 下降列 + 一小段水平轨道。
    return pickStationRow + cellCol + cellRow;
    // 最小：pickStationRow + （lastGoDownCol + 1） + 0， 46，
    // 最大：pickStationRow + （lastGoDownPickCol） + btmInterBeginRow，21 + 32 + （27 - 1 - 7）= 72
  } else if (
      cellRow <= btmRow && cellRow >= btmInterBeginRow &&
      cellCol <= lastCol && cellCol >= firstGoDownCol
  ) {
    // 这里面一个for循环。这里应该构造一个区域就是 occupyRow 高，occupyColConfig宽的一个区域。同样进来的点优先级应该一样。
    if (cellCol === lastGoDownPickCol) {
      return pickStationRow + lastGoDownCol + 1 + (lastGoDownCol) * btmInterBeginRow - firstGoDownCol
          + cellCol + cellRow;
    } else if (cellRow === btmRow) {
      return pickStationRow + lastGoDownCol + 1 + (lastGoDownCol) * btmInterBeginRow - firstGoDownCol
          + lastGoDownPickCol + btmRow
          + lastGoDownPickCol - cellCol;
    } else if ((cellCol - firstGoDownCol) % divideCell === 0) {
      // 刚进入 interSection 区域时，优先级是一样的。这个区域的高度：btmInterBeginRow决定，宽度：occupyColConfig
      return pickStationRow + lastGoDownCol + 1 + (lastGoDownCol) * btmInterBeginRow - firstGoDownCol
          + lastGoDownPickCol + btmRow
          + lastGoDownPickCol - cellCol
          - occupyColConfig + 1 // 让 intersection 区域的区域，和occupyColConfig区域的优先级一样。
          + (occupyColConfig - 1) * Math.floor(2 * (cellRow - btmInterBeginRow) / (btmRow - btmInterBeginRow)); // //要么是0要么是1, occupyCol最好不要再小了
    } else {
      return 0; //阴影部分
    }
    // 最大：pickStationRow + lastGoDownCol + 1 + (lastGoDownCol) * btmInterBeginRow - firstGoDownCol
    //+ lastGoDownPickCol + btmRow
    //+ lastGoDownPickCol - firstGoDownCol
  } else if (
      cellRow <= btmRow && cellRow >= pickStationRow &&
      cellCol >= 0 && cellCol < firstGoDownCol
  ) {
    // 最后到拣货台部分
    return pickStationRow + lastGoDownCol + 1 + (lastGoDownCol) * btmInterBeginRow - firstGoDownCol
        + lastGoDownPickCol + btmRow
        + lastGoDownPickCol - firstGoDownCol
        + firstGoDownCol - cellCol + (btmRow - cellRow);
  } else {
    console.warn('some scenario not considered! 行列数超出范围。');
  }
};

export const generateMatrix = function () {
  // 根据中间货位的行数、列数来得到整个代表物理障碍的 0-1 矩阵，看起来并不像实际的地图，这个是根据划分格子方法为了寻路。
  const matrixData = [];
  for (let row = 0; row < rowNum; row += 1) {
    matrixData.push([]);
    for (let column = 0; column < colNum; column += 1) {
      let ob = 1;
      // 0 表示没有障碍，1 表示有障碍。
      // 因为看起来是有障碍的点比较多，默认就是有障碍。
      // 我这边是为了显示的方便，使用的 web 里的坐标系，左上角是（0，0），往右往下变大。
      if (
          (row === 0 && column <= lastGoDownPickCol) ||
          (row === rowNum - 1 && column <= lastGoDownPickCol)
      ) {
        // 第一行、最后一行的点，没有障碍的点
        ob = 0;
      }
      if (
          column === 0 ||
          column === lastGoDownPickCol
      ) {
        ob = 0; // 第一列，最后一列没有障碍
      }
      if (
          column >= firstGoDownCol &&
          column <= lastGoDownCol &&
          (column - firstGoDownCol) % divideCell === 0
      ) {
        // 中间正常货位部分，没有障碍
        ob = 0;
      }
      matrixData[row].push(ob);
    }
  }
  // console.debug(matrixData);
  return matrixData;
};

export const generateAvoidMatrix = function () {
  // 避障的地图
  const matrixData = [];
  for (let row = 0; row < rowNum; row += 1) {
    matrixData.push([]);
    for (let column = 0; column < colNum; column += 1) {
      let ob = 1;
      // 0 表示没有障碍，1 表示有障碍。
      // 因为看起来是有障碍的点比较多，默认就是有障碍。
      // 我这边是为了显示的方便，使用的 web 里的坐标系，左上角是（0，0），往右往下变大。
      if (
          (row === 0 && column <= lastGoDownPickCol) ||
          (row === rowNum - 1 && column <= lastGoDownPickCol)
      ) {
        // 第一行、最后一行的点，没有障碍的点
        ob = 0;
      }
      if (
          column === 0 ||
          column === lastGoDownPickCol
      ) {
        ob = 0; // 第一列，最后一列没有障碍
      }
      // if (
      //     column >= firstGoDownCol &&
      //     column <= lastGoDownCol &&
      //     (column - firstGoDownCol) % divideCell === 0
      // ) {
      //   // 中间正常货位部分，没有障碍
      //   ob = 0;
      // }
      matrixData[row].push(ob);
    }
  }
  // console.debug(matrixData);
  return matrixData;
};

export const generateZeroMatrix = function () {
  // 生成全0矩阵，0标识没有障碍
  const matrixData = [];
  for (let row = 0; row < rowNum; row += 1) {
    matrixData.push([]);
    for (let column = 0; column < colNum; column += 1) {
      matrixData[row].push(0);
    }
  }
  // console.debug(matrixData);
  return matrixData;
};

export const calSectionLockMapForGeneral = function (row, col) {
  // 传进来的是小格子的行列数
  if (
      row > rowNum - 1 || row < 0 ||
      col > lastGoDownPickCol || col < 0
  ) {
    console.warn('行列超出范围', row, col);
  }

  let globalMap = generateZeroMatrix();
  let occupyRowReal = occupyRowConfig;
  // 根据判断，在交叉路口的小车的占位 track 不止 occupyRowConfig 这么高。还要加上 crossRoadoccupyRowConfig。这里的条件和HCCoopFinder的增大reservation table的占位是一个道理。
  if (
      row >= rowNum - 1 - crossRoadoccupyRowConfig &&
      col >= firstGoDownCol && col <= lastGoDownCol
  ) {
    // 只用是中间货位的交叉路口处。
    occupyRowReal += crossRoadoccupyRowConfig; //如果是将要进入交叉路口，occupyRowReal增加occupyRowConfigUnload

    // 根据 occupyRowConfig、occupyColConfig 数字算出占位
    for (let occupyCol = 0; occupyCol < occupyColConfig; occupyCol += 1) {
      for (let occupyRow = 0; occupyRow < occupyRowReal; occupyRow += 1) {
        if (!!globalMap[row - occupyRow + crossRoadoccupyRowConfig]) {
          globalMap[row - occupyRow + crossRoadoccupyRowConfig][col + occupyCol] = 1;
        }
      }
    } // 每一个点有 占位。

  } else {
    // 根据 occupyRowConfig、occupyColConfig 数字算出占位
    for (let occupyCol = 0; occupyCol < occupyColConfig; occupyCol += 1) {
      for (let occupyRow = 0; occupyRow < occupyRowReal; occupyRow += 1) {
        if (!!globalMap[row - occupyRow]) {
          globalMap[row - occupyRow][col + occupyCol] = 1;
        }
      }
    } // 每一个点有 占位。
  }

  return globalMap;
};

export const checkObstacle = function (uidInx, row, col, trackById) {
  const btmInterBeginRow = rowNum - 1 - crossRoadoccupyRowConfig; // 底部开始有交汇的行数，开始进入底部的通道 20 。这个地方不能太靠上。和occupyRow这个值不必一样。
  const btmRow = rowNum - 1; // 最底部一行行数 26
  const lastCol = colNum - 1; // 最后一列列数 35
  /* fatal !!! 这里和上面的 CalcPriority 方法里的3个常量有关系。 */

  let globalMaps = trackById;
  let obInTheWay = false; // 默认是没有障碍
  for (let i = 0; i < globalMaps.length; i += 1) {
    if (obInTheWay) {
      break; // 如果是已经有障碍了，直接就跳出循环
    }
    if (i === uidInx) {
      continue; // 如果是自己的 track 就跳过。
    }
    let globalMap = globalMaps[i];

    /*
     中间就靠路径避障。
     剩下的部分，上升列、（现在看来是上升列是有漏洞的，底部横向的应该是没有问题。）
     1.
     */
    if (col === 0) {
      // obInTheWay = ((!globalMap[row - occupyRowConfig]) ? false : globalMap[row - occupyRowConfig][0] === 1) ||
      //     ((!globalMap[row - occupyRowConfig - 1]) ? false : globalMap[row - occupyRowConfig - 1][0] === 1) ||
      //     ((!globalMap[row - occupyRowConfig - 2]) ? false : globalMap[row - occupyRowConfig - 2][0] === 1) ||
      //     ((!globalMap[row - occupyRowConfig - 3]) ? false : globalMap[row - occupyRowConfig - 3][0] === 1) ||
      //     ((!globalMap[row - occupyRowConfig - 4]) ? false : globalMap[row - occupyRowConfig - 4][0] === 1) ||
      //     ((!globalMap[row - occupyRowConfig - 5]) ? false : globalMap[row - occupyRowConfig - 5][0] === 1) ||
      //     ((!globalMap[row - occupyRowConfig - 6]) ? false : globalMap[row - occupyRowConfig - 6][0] === 1); //这里只是上升列的判断。往上判断 6 格 TODO：for循环 配置

      for (let i = 0; i <= lookUpRowNum; i += 1) {
        obInTheWay = obInTheWay ||
            ((!globalMap[row - occupyRowConfig - i]) ? false : globalMap[row - occupyRowConfig - i][0] === 1);
        if (obInTheWay) {
          return true;
        }
      }
    } else if (row === rowNum - 1 && col <= firstGoDownCol + divideCell) {
      // 在最底部一行往拣货台走的时候，要阻止小车过来。
      for (let i = 0; i <= lookUpRowNum; i += 1) {
        obInTheWay = obInTheWay ||
            ((!globalMap[row - 1 - i]) ? false : globalMap[row - 1 - i][0] === 1);
        if (obInTheWay) {
          return true;
        }
      }
    } else if (
        row < btmRow && row >= btmInterBeginRow &&
        col <= lastCol && col >= firstGoDownCol
    ) {
      // 在路口的时候，加上区间控制，弥补相邻列优先级缺陷。向后、下方看，有车就需要停。
      for (let i = 0; i <= btmRow - btmInterBeginRow; i += 1) {
        for (let j = 0; j < occupyColConfig; j += 1) {
          obInTheWay = obInTheWay ||
              ((!globalMap[row + i]) ? false : globalMap[row + i][col + j] === 1);
          if (obInTheWay) {
            return true;
          }
        }
      }
    } else {
      // do nothing
    }
  }
  // after for loop return the bool
  return obInTheWay;
};

export const calcTeeth = function (path, shiftLeft, endShift = 0, goingUp = false, wheel) {
  // 传进来的是一个 path，二维数组
  // [[row, col], [row, col], [row, col], ... , [row, col]]

  // 目前的做法是加一个判断，是否需要补偿。除此之外，CellToTeeth就不用考虑补偿了。

  // 算总齿数是设目标的时候，就算好。但是和行进过程中没有关系。这个是基于齿数的，所以是不存在不停的重新规划的。
  // 所以是还得有一个 ignore 其他所有小车的寻路的方法。所以在 findPath 里添加了一个 ignore 的 flag。一般情况下是不会 ignore 的

  // 算出总齿数，以及什么时候伸 pin、缩 pin，外加方向变化。
  //console.info('shiftLeft', shiftLeft, 'endShift', endShift);
  const realCompensate = compensate + wheel / 4;

  // 正常顺时针方向打圈
  if (!goingUp) {
    // 没有变化，按照正常回拣货台
    let totalTeeth = 0 - shiftLeft;
    let actions = [];

    /* %%%%%%%%%%% 一个 for 循环遍历整个规划出来的 path %%%%%%%%%%% */
    // 去掉头一格
    for (let step = 1; step < path.length; step += 1) {
      let cell = path[step]; // 这个是 [row, col]
      let cellNext;
      if (step !== path.length - 1) {
        cellNext = path[step + 1];
      } else {
        cellNext = path[step];
      }

      let cellRow = cell[0];
      let cellCol = cell[1];
      let cellNextRow = cellNext[0];
      let cellNextCol = cellNext[1];

      totalTeeth += CellToTeeth(cellRow, cellCol); // 没有考虑补偿的。

      //判断如果是转弯了，就加补偿
      if (
          cellRow === 1 && cellCol === 0 &&
          cellNextRow === 0 && cellNextCol === 0
      ) {
        // 1. 上升列转为水平，这里不需要伸 pin
        actions.push({
          target_teeth: totalTeeth,
          specific_action: 'SA_TURNING_BEGIN_POINT'
        }); // 补偿前添加 开始转弯 flag
        totalTeeth += realCompensate; // 如果是有拐角就是添加补偿。
        actions.push({
          target_teeth: totalTeeth,
          specific_action: 'SA_ODOM_FORWARD_GROUND_AS_REFERENCE'
        }); // 方向由向上变为向右。向右是正方向，col变大
      } else if (
          (cellRow === rowNum - 1 && cellCol === 0) &&
          cellNextRow === rowNum - 2 && cellNextCol === 0
      ) {
        // 2. 水平转为上升列，这里需要在前两格伸pin
        actions.push({
          target_teeth: totalTeeth - h2vUpPinOutStretchCell * normalWidth, // 转弯前两小格伸pin
          specific_action: 'SA_PIN_OUTSTRETCH'
        }); // 伸pin动作
        actions.push({
          target_teeth: totalTeeth,
          specific_action: 'SA_TURNING_BEGIN_POINT'
        }); // 补偿前添加 开始转弯 flag
        totalTeeth += realCompensate;
        actions.push({
          target_teeth: totalTeeth,
          specific_action: 'SA_ODOM_UP_GROUND_AS_REFERENCE'
        }); // 方向由向右变为向上。
        actions.push({
          target_teeth: totalTeeth,
          specific_action: 'SA_PIN_RETRIEVE'
        }); // 缩pin动作

      } else if (
          (
              cellRow === rowNum - 2 && cellCol >= firstGoDownCol && cellCol <= lastGoDownCol && (cellCol - firstGoDownCol) % divideCell === 0
          ) &&
          cellNextRow === rowNum - 1 && cellNextCol === cellCol
      ) {
        // 3. 下降列转弯为水平。下来不需要伸 pin，缩 pin。
        totalTeeth -= CellToTeeth(cellNextRow, cellCol); // 多算了一个横向的格子，这个格子是不走的
        actions.push({
          target_teeth: totalTeeth > 0 ? totalTeeth : 0,
          specific_action: 'SA_TURNING_BEGIN_POINT'
        }); // 补偿前添加 开始转弯 flag
        totalTeeth += realCompensate;

        actions.push({
          target_teeth: totalTeeth,
          specific_action: 'SA_ODOM_BACKWARD_GROUND_AS_REFERENCE'
        }); // 方向由向下变为向左。向上升列的方向
      } else if (
          cellRow === rowNum - 2 && cellCol === lastGoDownPickCol &&
          cellNextRow === rowNum - 1 && cellNextCol === cellCol
      ) {
        // 4. 最后一列下降列转弯为水平。下来不需要伸 pin，缩 pin
        totalTeeth -= CellToTeeth(cellNextRow, cellCol); // 多算了一个横向的格子，这个格子是不走的
        actions.push({
          target_teeth: totalTeeth > 0 ? totalTeeth : 0,
          specific_action: 'SA_TURNING_BEGIN_POINT'
        }); // 补偿前添加 开始转弯 flag
        totalTeeth += realCompensate;
        actions.push({
          target_teeth: totalTeeth,
          specific_action: 'SA_ODOM_BACKWARD_GROUND_AS_REFERENCE'
        }); // 方向由向下变为向左。向上升列的方向
      } else if (
          cellRow === 0 && cellCol >= firstGoDownCol && cellCol <= lastGoDownCol && (cellCol - firstGoDownCol) % divideCell === 0 &&
          cellNextRow === 1 && cellNextCol === cellCol
      ) {
        // 5. 水平转为下降，顶部一行下降列，方向改变
        if (cellCol === firstGoDownCol) {
          // 特殊处理
          actions.push({
            target_teeth: totalTeeth - normalWidth - h2vDownSpecialPinOutStretchCell * specialTopPart, // 调整第一列下降时 伸pin 的位置。
            specific_action: 'SA_PIN_OUTSTRETCH'
          }); // 伸pin动作
          totalTeeth -= CellToTeeth(cellRow, cellCol); // 多算了一个横向的格子，这个格子是不走的
          actions.push({
            target_teeth: totalTeeth,
            specific_action: 'SA_TURNING_BEGIN_POINT'
          }); // 补偿前添加 开始转弯 flag
          totalTeeth += realCompensate;
          actions.push({
            target_teeth: totalTeeth,
            specific_action: 'SA_ODOM_DOWN_GROUND_AS_REFERENCE'
          }); // 方向由向前（右）变为向下。
          actions.push({
            target_teeth: totalTeeth,
            specific_action: 'SA_PIN_RETRIEVE'
          }); // 缩pin动作

        } else {
          actions.push({
            target_teeth: totalTeeth - normalWidth - h2vDownNormalPinOutStretchCell * normalWidth,
            specific_action: 'SA_PIN_OUTSTRETCH'
          }); // 伸pin动作
          totalTeeth -= CellToTeeth(cellRow, cellCol); // 多算了一个横向的格子，这个格子是不走的
          actions.push({
            target_teeth: totalTeeth,
            specific_action: 'SA_TURNING_BEGIN_POINT'
          }); // 补偿前添加 开始转弯 flag
          totalTeeth += realCompensate;
          actions.push({
            target_teeth: totalTeeth,
            specific_action: 'SA_ODOM_DOWN_GROUND_AS_REFERENCE'
          }); // 方向由向前（右）变为向下。
          actions.push({
            target_teeth: totalTeeth,
            specific_action: 'SA_PIN_RETRIEVE'
          }); // 缩pin动作

        }
      } else if (
          cellRow === 0 && cellCol === lastGoDownPickCol
      ) {
        // 6. 水平转为下降，最后一列下降，方向改变
        actions.push({
          target_teeth: totalTeeth - normalWidth - h2vDownNormalPinOutStretchCell * normalWidth, // 最后一列下降同样是在特殊宽度的位置 伸PIN。没有特殊宽度！
          specific_action: 'SA_PIN_OUTSTRETCH'
        }); // 伸pin动作
        totalTeeth -= CellToTeeth(cellRow, cellCol); // 多算了一个横向的格子，这个格子是不走的
        actions.push({
          target_teeth: totalTeeth,
          specific_action: 'SA_TURNING_BEGIN_POINT'
        }); // 补偿前添加 开始转弯 flag
        totalTeeth += realCompensate;
        actions.push({
          target_teeth: totalTeeth,
          specific_action: 'SA_ODOM_DOWN_GROUND_AS_REFERENCE'
        }); // 方向由向前（右）变为向下。
        actions.push({
          target_teeth: totalTeeth,
          specific_action: 'SA_PIN_RETRIEVE'
        }); // 缩pin动作

      }
      //console.debug('total teeth: ', totalTeeth);
      //console.debug('cellRow cellCol: ', cellRow, cellCol);
    } // end for loop 根据一条路径算总齿数、伸pin、缩pin点，算完。

    // 返回最终结果
    totalTeeth += endShift;
    return {
      total_teeth: totalTeeth,
      Actions: actions,
    };
    // 向上运动捡完箱子的小车回拣货台 不用符号改为负数。
    // 正常取完箱子回拣货台
  } else {
    // 如果是往上走的，即是反方向的
    let totalTeeth = 0 - shiftLeft;
    // let totalTeeth = 0 - shiftLeft;
    let actions = [];

    // 去掉头一格， goingUp 不能去掉头一格，应该去掉末尾一格。
    for (let step = 0; step < path.length - 1; step += 1) {
      let cell = path[step]; // 这个是 [row, col]
      let cellNext;
      if (step !== path.length - 1) {
        cellNext = path[step + 1];
      } else {
        cellNext = path[step];
      }

      let cellRow = cell[0];
      let cellCol = cell[1];
      let cellNextRow = cellNext[0];
      let cellNextCol = cellNext[1];

      totalTeeth -= CellToTeeth(cellRow, cellCol); // 没有考虑补偿的。距离方向是负方向
      // totalTeeth += CellToTeeth(cellRow, cellCol); // 没有考虑补偿的。

    } // end for loop 根据一条路径算总齿数、伸pin、缩pin点，算完。

    // 返回最终结果
    totalTeeth += endShift;
    return {
      total_teeth: totalTeeth,
      Actions: actions,
    };
  } // 两个特殊的 flag 情况，判断结束
};

export const CellToTeeth = function (cellRow, cellCol) {
  // 根据行列，对应出齿数。没有考虑补偿。
  // 特殊的先来，从上到下
  if (
      cellRow === 0 &&
      (cellCol >= specialTopStartCellCol && cellCol < firstGoDownCol)
  ) {
    // 顶部特殊长度 52/4, 这里是 4、5、6、7 四格
    return specialTopPart;
  } else if (
      cellRow === 0
  ) {
    // 除此之外，上面的都是 normal
    return normalWidth;
  } else if (
      cellRow >= topBoxNormalHeightStartRow && cellRow <= topBoxNormalHeightEndRow
  ) {
    // 剩下的最上面一行的货位里的格子
    return topBoxNormalHeight;
  } else if (
      cellRow >= SDownPartStartRow && cellRow <= SDownPartEndRow &&
      (cellCol === 0 || cellCol === lastGoDownPickCol)
  ) {
    // S形弯道下部分
    return SDownPart;
  } else if (
      cellRow >= SUPPartStartRow && cellRow <= SUPPartEndRow &&
      (cellCol === 0 || cellCol === lastGoDownPickCol)
  ) {
    // S形弯道上部分
    return SUPPart;
  } else if (
      cellRow > topBoxNormalHeightEndRow && cellRow < specialHeightStartRow
  ) {
    // 中间正常部分
    return normalHeight;
  } else if (
      cellRow === specialHeightStartRow
  ) {
    // 倒数第二行 特殊高度部分，其他的都不需要补偿
    return specialHeight;
  } else if (
      cellRow === rowNum - 1 &&
      (cellCol >= specialTopStartCellCol && cellCol < firstGoDownCol)
  ) {
    // 倒数第一行 特殊宽度部分
    return specialBottomPart;
  } else if (
      cellRow === rowNum - 1 &&
      (cellCol >= specialBtmStartCellCol && cellCol < lastGoDownPickCol)
  ) {
    // 倒数第一行 特殊宽度部分
    return doubleBottomPart;
  } else if (cellRow === rowNum - 1) {
    return normalWidth;
  } else {
    // console.debug('some situation senario not considered!!');
  }

};

// 根据 path 规划出来的路径，电机的加速度，当前的速度，算出此时应该发多少的速度。
export const sendVelocity = async function (path, shuttle, shift, endNodeArr, odom, teethAndAction, optIndex, goingUp) {

  if (!teethAndAction.total_teeth) {
    return; // 如果传过来的是空数组，就return。这种就是小车没有路径。
  }

  if (path === 0) {
    // 直接根据区间控制 判断是前方有障碍的。
    if (showDispatchLog) console.warn('sendVelocity, 区间控制判断需要避障，发送速度 0', 0);
    shuttle.sendSpeedToShuttle(0, 'SPEED_PRIORITY_AUTO_CONTROLLER');
  }

  let currentSpeed = shuttle.curSpeed; // 小车当前速度
  // let curSpeedRPM = shuttle.curSpeedRPM; // 小车当前速度 // 这个不准
  let PASS_PIN_Velocity = shuttle.shuttleConfig.gate_speed; // 过活门速度
  let maxSpeed = shuttle.shuttleConfig.max_speed; // 最大速度
  let ACCELERATION = shuttle.shuttleConfig.deceleration; // 这里我只考虑减速。

  const total_teeth_from_origin = odom.total_teeth_from_origin;
  const total_teeth = teethAndAction.total_teeth;

  let distToGoal = 0;
  if (odom.theoretical_moving_direction) { // 如果是有odom
    distToGoal = Math.abs(total_teeth - total_teeth_from_origin); // 还剩多少到终点（齿数）加上绝对值，可能为负数

  } else {
    return; // odom都没有，不发速度。
  }

  /* 整理一下思路，分两种情况：
   * 1. 路径中需要停，除了终点之外，即是避障
   *
   * 2. 没有障碍，相当于是一个车在跑。根据算出来的 teethAndAction 来判断速度。
   *    2-1. 伸pin 前需要减速，或者开始转弯前
   *    2-2. 缩pin 后需要加速，或者开始转弯后，方向改变后
   *    2-3. 到终点需要停止，交给电机，不再发送速度。（不做处理）
   *
   * */
  let ToZeroIndex = path.findIndex(function (ele, index, arr) {
    if (index < arr.length - 1) {
      return ele[0] === arr[index + 1][0] && ele[1] === arr[index + 1][1];
    } else {
      return false;
    }
  }); // 找到 path 中需要停止的点，如果没有找到，ToZeroIndex === -1.

  // 路径中找到需要停止的点，并且不是终点，即是因为避障原因，需要停。
  let haltHalfway = ToZeroIndex !== -1 &&
      (path[ToZeroIndex][0] !== endNodeArr[0] || path[ToZeroIndex][1] !== endNodeArr[1]);

  // 首先是要分别算出两个需要减速的距离
  let delayDist = (validSpeedDuration / 1000) * maxSpeed; // 算上可能的延时（齿）


  let PSDist = PSBrakingDist(currentSpeed, PASS_PIN_Velocity, ACCELERATION) + delayDist + avoidDist; // 根据最大速度算出的 减速到过活门速度的刹车距离。
  let ToZeroDist = BrakingDist(currentSpeed, ACCELERATION) + delayDist + avoidDist; // 根据最大速度算出的 减速到 0 的刹车距离。
  // if (showDispatchLog) console.info('maxSpeed', maxSpeed, 'PASS_PIN_Velocity', PASS_PIN_Velocity, 'ACCELERATION',ACCELERATION, 'PSDist',PSDist, 'ToZeroDist',ToZeroDist);

  let distToStop, distToPS; // 根据路径规划算出的当前还剩多少距离需要停止、过活门
  const Actions = teethAndAction.Actions; // 一个数组，每一个元素都是obj。

  let distToStop_obj = calcTeeth(path.slice(0, ToZeroIndex), shift, 0, goingUp, shuttle.shuttleConfig.wheel); // 改为0，因为 calcTeeth里已经去头了。shift标识当前位置的偏移。
  distToStop = distToStop_obj.total_teeth - shift; // 这个 shift 是当前位置的偏移量。这个是正的。
  if (distToStop < 0) {
    if (showDispatchLog) console.warn('需要停止的距离是负数', distToStop, '设为零');
    distToStop = 0;
  }
  // 以上，算出需要停止的距离，和 刹车所需要的距离 比较。此时不用考虑伸pin、缩pin


  if (haltHalfway && distToStop <= ToZeroDist) {
    if (currentSpeed === 0) {
      // 这里本来是想写 === 0.但是速度不是绝对是0的。
      let obUid = await findIdleUidOb(optIndex, path); // 当前小车、被挡住的小车的optIndex，
      // 因为避障停止，且找到了前方的、空闲的小车 uid。
      // 找一列当前车最少的列的顶部。
      if (obUid !== null) {
        let obIndex = findIndexByUid(obUid);
        let parkingGoal = findParkingGoal(obIndex);// 找到当前车最少的一列，设置目标为该列，没有车的地方

        if (showDispatchLog) console.warn('找到空闲且挡路的小车，设置终点', obUid, parkingGoal);
        // await shuttles[obUid].stopConsume(); // 找到小车之后，给小车取消接收任务，直到小车到达目的地恢复任务。

        const pathinfo = setGoal(obUid, parkingGoal[0], parkingGoal[1]);
        // shuttles[obUid].status = 12; // 空闲小车被挤走之后，status变为12.
        shuttles[obUid].sendTargetActionToShuttle(pathinfo);
      } else {
        // 没有找到，找空闲挡路的小车方法出现了 问题。
        if (showDispatchLog) console.warn('没有找到空闲且挡路的小车。');
      }
    }

    // 1. 避障原因需要中途停。而不是终点
    if (showDispatchLog) console.warn('需要避障，发送减速', 0, 'sendSpeedToShuttle', 0);
    shuttle.sendSpeedToShuttle(0, 'SPEED_PRIORITY_AUTO_CONTROLLER');

  } else {
    // 2. 没有障碍。判断下一个动作。
    let action, actionInx, lastActionInx, lastAction;

    // 下一个动作的index，有可能是 -1.
    actionInx = Actions.findIndex(function (action) {
      return action.target_teeth > total_teeth_from_origin;
    });

    if (actionInx !== -1) {
      action = Actions[actionInx]; // action 此时是找到的下一个动作的 obj。

      lastActionInx = actionInx - 1;
      //找上一个action，
      if (lastActionInx >= 0) {
        lastAction = Actions[lastActionInx];
      }
    } else {
      // actionInx === -1 没有找到下一个action
      lastActionInx = Actions.length - 1;
      lastAction = Actions[lastActionInx];
    }

    // if (showDispatchLog) LOGGER.info('下一个动作：', action, '上一个动作', lastAction);

    /* %%%%%%%%%%%% 没有障碍，等同单车，下面根据情况发送速度 %%%%%%%%%%%%*/
    if (
        (path[0][0] <= pickSitesSmallRow + 1 &&
        path[0][0] >= pickSitesSmallRow - pickSitesRowGap + 2 &&
        path[0][1] === 0) ||
        (path[0][0] <= pickSitesSmallRow + 1 &&
        path[0][0] >= pickSitesSmallRow - pickSitesRowGap - 2 &&
        path[0][1] === colNum - 4)
    ) {
      // TODO: S形弯道减速，改配置。
      // 如果不需要避障，在S形弯道的时候，减速是优先级最高。下降列S形弯道提前 2 小格
      if (showDispatchLog) console.warn('S形弯道，sendSpeedToShuttle,发送过活门速度', PASS_PIN_Velocity);
      shuttle.sendSpeedToShuttle(PASS_PIN_Velocity, 'SPEED_PRIORITY_AUTO_CONTROLLER');
    } else if (lastAction && lastAction.specific_action === 'SA_PIN_OUTSTRETCH') {
      // 以下，是按照优先级，伸pin前需要减速。或者开始转弯
      // fix: pin 伸完了之后会有一个发送高速的动作
      if (showDispatchLog) console.info('上一个动作是伸pin，发送活门速度');
      if (showDispatchLog) console.warn('sendSpeedToShuttle,发送过活门速度', PASS_PIN_Velocity);
      shuttle.sendSpeedToShuttle(PASS_PIN_Velocity, 'SPEED_PRIORITY_AUTO_CONTROLLER');
    } else if (action && (
            action.specific_action === 'SA_PIN_OUTSTRETCH' ||
            action.specific_action === 'SA_TURNING_BEGIN_POINT'
        )) {
      // 2-1. 下一个动作是伸pin，或者是开始转弯
      distToPS = Math.abs(action.target_teeth - total_teeth_from_origin); // 还剩多少距离需要伸pin 或转弯。确保是正数
      if (showDispatchLog) console.info('伸pin前或者开始转弯前需要减速，target_teeth:', action.target_teeth, '还剩多少距离，distToPS：', distToPS, '减速到过活门速度的刹车距离,PSDist:', PSDist);
      if (distToPS <= PSDist) {
        if (showDispatchLog) console.warn('sendSpeedToShuttle,发送过活门速度', PASS_PIN_Velocity);
        shuttle.sendSpeedToShuttle(PASS_PIN_Velocity, 'SPEED_PRIORITY_AUTO_CONTROLLER');
      } else {
        // 如果没有小余刹车距离就不发什么速度。
        // 这里不能什么都不发，这里应该是发最大速度
        if (showDispatchLog) console.warn('sendSpeedToShuttle,下一个转弯点超过刹车距离，发送最大速度', maxSpeed);
        shuttle.sendSpeedToShuttle(maxSpeed, 'SPEED_PRIORITY_AUTO_CONTROLLER');
      }
    } else if (
        lastAction && (
            lastAction.specific_action === 'SA_PIN_RETRIEVE' ||
            lastAction.specific_action === 'SA_ODOM_FORWARD_GROUND_AS_REFERENCE' ||
            lastAction.specific_action === 'SA_ODOM_BACKWARD_GROUND_AS_REFERENCE' ||
            lastAction.specific_action === 'SA_ODOM_UP_GROUND_AS_REFERENCE' ||
            lastAction.specific_action === 'SA_ODOM_DOWN_GROUND_AS_REFERENCE'
        )
    ) {
      // 有这个action就是有方向改变，转弯结束
      if (distToGoal <= ToZeroDist || total_teeth_from_origin - lastAction.target_teeth < slowPassGate) {
        // 还要加上一个值，让小车完全慢速的过完活门。
        if (!!showDispatchLog) console.info('转弯结束，且距离终点小于刹车距离，不发速度，交给电机，改为一直发速度');
        shuttle.sendSpeedToShuttle(PASS_PIN_Velocity, 'SPEED_PRIORITY_AUTO_CONTROLLER');
      } else {
        if (showDispatchLog) console.warn('sendSpeedToShuttle,转弯结束，且距离终点大于刹车距离，发送最大速度', maxSpeed);
        shuttle.sendSpeedToShuttle(maxSpeed, 'SPEED_PRIORITY_AUTO_CONTROLLER');
      }
    } else if (Actions.length === 0 && total_teeth !== 0) {
      // 同一列中的取货箱，Actions里为空，只有总齿数
      if (distToGoal <= ToZeroDist) {
        if (Math.abs(total_teeth_from_origin) < 3) {
          // 刚开始的时候，给一个速度，之后就不管了
          if (showDispatchLog) console.warn('sendSpeedToShuttle,同一列中的取货箱，刚开始3个齿数内发一个过活门速度', PASS_PIN_Velocity);
          shuttle.sendSpeedToShuttle(PASS_PIN_Velocity, 'SPEED_PRIORITY_AUTO_CONTROLLER');
        } else {
          if (showDispatchLog) console.info('转弯结束，且距离终点小于刹车距离，不发速度，交给电机，改为一直发速度');
          shuttle.sendSpeedToShuttle(PASS_PIN_Velocity, 'SPEED_PRIORITY_AUTO_CONTROLLER');
          if (currentSpeed === 0 && distToGoal > 0) {
            // 如果速度是0，且没到终点，给一个活门速度
            if (showDispatchLog) console.warn('sendSpeedToShuttle,当前速度为0，发送一个活门速度', PASS_PIN_Velocity);
            shuttle.sendSpeedToShuttle(PASS_PIN_Velocity, 'SPEED_PRIORITY_AUTO_CONTROLLER');
          }
        }
      } else {
        if (showDispatchLog) console.warn('sendSpeedToShuttle, 同一列中的取货箱，且距离终点大于刹车距离，发送最大速度', maxSpeed);
        shuttle.sendSpeedToShuttle(maxSpeed, 'SPEED_PRIORITY_AUTO_CONTROLLER');
      }
    } else {
      // 2-3. action是undefined，最后一个动作了。到终点。还有什么情况漏掉的？

      if (showDispatchLog) console.warn('sendSpeedToShuttle,没有考虑到的情况,发送过活门速度', PASS_PIN_Velocity);
      shuttle.sendSpeedToShuttle(PASS_PIN_Velocity, 'SPEED_PRIORITY_AUTO_CONTROLLER');

    }
    /* %%%%%%%%%%%% 没有障碍，等同单车，情况分类结束 %%%%%%%%%%%%*/
  }
  if (showDispatchLog) {
    console.info('已走过的齿数：', total_teeth_from_origin, '当前速度（齿每秒）：', currentSpeed, '当前速度（currentSpeed）：', currentSpeed);
    console.info('actions', teethAndAction);
    console.warn('(避障)还剩多少需要停止：', distToStop, '还剩多少需要伸pin：', distToPS, '刹车距离：', ToZeroDist, '刹到活门速度距离', PSDist);
  }

};

// 根据当前速度、电机加速度，提前算好伸 PIN 前的刹车距离
const PSBrakingDist = function (currentVelocity, PASS_PIN_Velocity, ACCELERATION) {
  if (currentVelocity > PASS_PIN_Velocity) {
    // 如果是需要减速
    let t = (currentVelocity - PASS_PIN_Velocity) / ACCELERATION;
    return t * (currentVelocity + PASS_PIN_Velocity) / 2;
  } else {
    // 如果是速度不够也行，直接就发伸 PIN 的时候的速度
    return 0; // 0 标识不需要刹车距离
  }
};
// 减为0的距离
const BrakingDist = function (currentVelocity, ACCELERATION) {
  if (currentVelocity > 0) {
    // 如果是需要减速
    let t = currentVelocity / ACCELERATION;
    return t * currentVelocity / 2;
  } else {
    return 0; // 0 标识不需要刹车距离
  }
};

export default {};
