/**
 * Created by zhuweiwang on 02/04/2018.
 */

import Heap from 'heap';
import * as Util from '../core/Util';
import Heuristic from '../core/Heuristic';
import Grid from '../core/Grid';
// import {dispatchConfig} from '@root/config';
import dispatchConfig from '../config/dispatchConfig';
const {
  occupyRowConfigUnload,
  occupyRowConfig,
  occupyColConfig,
  divideCell,
  toothMilliMeter,
  safeGap,
  normalHeight,

  firstGoDownCol,
  lastGoDownCol
} = dispatchConfig;
const CONFIG = dispatchConfig;

function HCCoopFinder(opt) {
  opt = opt || {};
  this.heuristic = opt.heuristic || Heuristic.huicang;
  this.weight = opt.weight || 1;

}

HCCoopFinder.prototype.findPath = function (index, goalTable, searchDeepth, pathTable, matrix, rowNum, colNum, ignoreOthers = false, goingUp = false, loadBox = true, shiftingArr, wheelToChainArr) {

  const startRow = goalTable[index][0][0];
  const startCol = goalTable[index][0][1];
  const endRow = goalTable[index][1][0];
  const endCol = goalTable[index][1][1];

  const reservationTable = new Array(searchDeepth + 1); // 这个值应该是 pathtable 最长的一个数组长度
  for (let index = 0; index < reservationTable.length; index += 1) {
    reservationTable[index] = new Grid(colNum, rowNum, matrix);
  }

  let pathNode, reservedNode;

  if (!ignoreOthers)  {
    for (let i = 0; i < pathTable.length; i += 1) { // i is the index of unit
      if (i === index) {
        continue;
      }
      for (let j = 0; j < pathTable[i].length; j += 1) {
        pathNode = pathTable[i][j]; // [row, col]
        // i 是小车的 index，j 是第i个小车的路径里的第 j 个点。

        // 是否载箱子的，不同情况不同占位
        let occupyRowReal = loadBox ? occupyRowConfig : occupyRowConfigUnload;

        if (
            pathNode[0] >= CONFIG.rowNum - 1 - CONFIG.crossRoadoccupyRowConfig &&
            pathNode[1] >= firstGoDownCol && pathNode[1] <= lastGoDownCol
        ) {
          // 只用是中间货位的交叉路口处。
          occupyRowReal += CONFIG.crossRoadoccupyRowConfig; //如果是将要进入交叉路口，occupyRowReal增加occupyRowConfigUnload
          // Grid 方法里 HCgetNeighborsOneDirection 变量 occupyRowReal 需一致。
        }

        // 考虑 footprint，按照现在的划格子方法，横向占位 occupyColConfig 格，竖向占位 occupyRowReal 格。pathnode是左下角的点。
        for (let occupyCol = 0; occupyCol < occupyColConfig; occupyCol += 1) {
          for (let occupyRow = 0; occupyRow < occupyRowReal; occupyRow += 1) {
            // 根据路径中的 row、col 得到相对应的点 {row: col: walkable:}
            // 如果是超过了就直接跳过。
            let nodeRow;
            const pullTopBoxRow = divideCell + Math.floor(wheelToChainArr[i] / normalHeight); // 5, 小车拉箱子的时候，位置报告小格子行数
            const pullTopBoxRowShift = wheelToChainArr[i] - normalHeight * Math.floor(wheelToChainArr[i] / normalHeight); // 拉箱子的时候的偏移量
            const safeGapTeeth = Math.floor(safeGap / toothMilliMeter); // 3, 上面空2厘米, 齿宽6.2832，即是3个齿。

            if (pathNode[0] === pullTopBoxRow && shiftingArr[i] > pullTopBoxRowShift - safeGapTeeth) {
              // pathNode 是循环中的当前点，pathNode[0]是当前点的小格子行数。
              // 小车拉箱子的时候，位置报告小格子行数是 pullTopBoxRow 行，偏移量是 wheelToChain - normalHeight，即是走满5行多 wheelToChain - normalHeight 个齿
              // pathNode[0] === pullTopBoxRow 且偏移量大于等于 wheelToChain - normalHeight - 3 个齿。
              // 上面空2厘米，即是3个齿。
              nodeRow = pathNode[0] - occupyRow + 1; // 如果是在顶上拉箱子，整体占位向下挪一小行
            } else if (
                pathNode[0] >= CONFIG.rowNum - 1 - CONFIG.crossRoadoccupyRowConfig &&
                pathNode[1] >= firstGoDownCol && pathNode[1] <= lastGoDownCol
            ) {
              // 上面这个条件和 occupyRowReal += 的条件要一致。
              nodeRow = pathNode[0] - occupyRow + CONFIG.crossRoadoccupyRowConfig; // 如果是在顶上拉箱子，整体占位向下挪一个occupyRowConfig的行数。和occupyRowReal +=的数字有关
            }
            else {
              nodeRow = pathNode[0] - occupyRow; // for循环里的row.
            }
            // +1是因为顶部一行的小车在拉箱子的时候位置报告是4行箱子加上1行的下沉距离再加上不满一格的偏移量，+1让横向过来的小车应该是能够过的。
            let nodeCol = pathNode[1] + occupyCol; // for循环里的col

            if (
                nodeRow < 0 || nodeRow > CONFIG.rowNum - 1 ||
                nodeCol < 0 || nodeCol > CONFIG.colNum - 1
            ) {
              continue;
            }

            reservedNode = reservationTable[j].getNodeAt(nodeRow, nodeCol);

            // reservedNode.walkable = false; 注意这里已经删除了 walkable,这里仅仅会影响到 getNeighbors 方法。
            reservedNode.unitWalkable = false; // 把横向的三个点都设为 unitWalkable 为 false
          }
        } // 每一个点有4行3列的占位。
      } // 对于每条路径中的每个点，都有一个4 * 3格的占位
    } // end for loop，所有pathtable里的点占位情况更新完毕。
  }
  // reservation table ready ！！！

  // 1. Heap 还是 heap，push、pop 都是要用到的。
  // 2. 有5种 action，上下左右以及停止. 所有的 action 每一步的cost都是 1，和一个timestep相对应。
  // 3. 一个动作合法，意味着符合一些规则，没有障碍，没有别的小车再占用，还有没有其他小车的互换位置。这些规则还要增加。
  const openList = new Heap(function (nodeA, nodeB) {
        return nodeA.f - nodeB.f;
      }), // openlist 里的 node 不是同一个 grid, heap 里的对象是所有的 node

      // startnode 是对应index的点的 timestep 为 0 的grid里的点。
      // 如果是要规划，肯定 startNode 对应的就是time step 是 0 的 grid map 里的点。
      startNode = reservationTable[0].getNodeAt(startRow, startCol),


      heuristic = this.heuristic,
      weight = this.weight, // 这个weight可以说是 g 和 h 的权重
      abs = Math.abs, SQRT2 = Math.SQRT2;

  let node, // openList 里 pop 出来的 f 最小的点。
      nodeNextStep, // 和 node 位置一样，但是是下一个 time step 的
      gridNextStep, // node 下一个 time step 的 grid
      neighbors, // node 下一个 time step 的 grid 里能够考虑的 neighbor 集合
      neighbor, // 所有能够考虑的下一步的点
      i, // for loop 里的临时变量
      l, // for loop 里的临时变量
      col, // 同上
      row, // 同上
      ng; // 同上

  // set the `g` and `f` value of the start node to be 0
  startNode.g = 0;
  startNode.h = weight * heuristic(startRow, startCol, endRow, endCol);
  startNode.f = startNode.h + startNode.g;
  startNode.t = 0; // t 代表时间，个人是觉得能够 f = g + h + t，把时间也考虑进去。

  openList.push(startNode);
  startNode.opened = true; // 这里的 startnode 只是一个引用。

  while (!openList.empty()) {
    //从openlist里找到（哪个值我不确定，如果是 backwards search 的话，应该是 g ）值最小的 node。pop是从heap里删除掉最小的 并返回这个最小的元素。
    node = openList.pop();
    node.closed = true;  // 这一步是必须的，没错，这里要标记一下。。 其实这个地方是 close 了，但是下一个 grid 还是有这个点。所以可以说是一个grid全部都没有了。

    if (node.t >= searchDeepth - 1) {
      //console.debug(`寻路暂停，beyond the deepth，${searchDeepth}`);
      //console.debug('规划出来的路径：', Util.backtraceNode(node));
      return Util.backtrace(node);
    }

    if (ignoreOthers) {
      if (node.row === endRow && node.col === endCol) {
        console.debug('已经到达终点, from pathFinder'); // 如果是仅仅为了计算总齿数，这个找到终点就能够直接返回。
        return Util.backtrace(node);
      }
    }


    // 根据当前的这个格子找下一个要搜索的点，这些点应该是下一个 timestep 里的，也就是下一个 grid。
    // 这里的点应该是包括自身node + 周围的node。分别对应的就是在原处停止 wait，和其他的 action。

    // find the node in which grid. 直接查node的index比较直接。还是直接在同一个 grid 里的所有node里添加一个 t 字段比较方便。
    gridNextStep = reservationTable[node.t + 1];
    if (!gridNextStep) {
      console.debug(node.t);
      console.debug(reservationTable);
      console.debug('超出reservation table范围');
    }

    nodeNextStep = gridNextStep.getNodeAt(node.row, node.col); // 得到下一个grid里的相同位置的node
    // 当前的点不一定能够 wait，因为可能别的小车要过来。这样的情况就要其他的小车让路了。

    /*
     * 如果是这么特殊的情况，周围的运动方向只有一个，只有中间能上下移动
     *
     */
    if (
        node.row >= 1 && node.row <= CONFIG.rowNum - 2 &&
        node.col >= 8 && node.col <= CONFIG.colNum - 12
    ) {
      // 在中间货位部分，能够上下移动
      if (goingUp) {
        // 如果是向上，那么做出相应的改变。
        neighbors = gridNextStep.HCgetNeighborsOneDirection(nodeNextStep, 'UP', loadBox);
      } else {
        neighbors = gridNextStep.HCgetNeighborsOneDirection(nodeNextStep, 'DOWN', loadBox);
      }
    } else if (
        (node.col === 0 && node.row >= 1)
    ) {
      // 上升列，能够往右上，不能下
      neighbors = gridNextStep.HCgetNeighborsOneDirection(nodeNextStep, 'UP', loadBox); // 上升列只能上
    } else if (
        node.row === 0 &&
        node.col >= 0 && node.col <= CONFIG.colNum - 5
    ) {
      // 最上面一行，除去最右上角的一点，分情况，看目标
      /*
       * 1. 只能往右，目标列不等于当前列
       * 2. 只能往下，目标列等于当前列
       */
      if (node.col === endCol) {
        neighbors = gridNextStep.HCgetNeighborsOneDirection(nodeNextStep, 'DOWN', loadBox);
        // console.debug(nodeNextStep);
        // console.debug(neighbors);
      } else {
        neighbors = gridNextStep.HCgetNeighborsOneDirection(nodeNextStep, 'RIGHT', loadBox);
      }
    } else if (node.col === CONFIG.colNum - 4 && node.row <= CONFIG.rowNum - 2) {
      // 下降列，只能下，不包括最右下角
      neighbors = gridNextStep.HCgetNeighborsOneDirection(nodeNextStep, 'DOWN', loadBox);
    } else if (
        node.row === CONFIG.rowNum - 1 &&
        (node.col >= 1 && node.col <= CONFIG.colNum - 4)
    ) {
      // 最底部一行，只能往左
      neighbors = gridNextStep.HCgetNeighborsOneDirection(nodeNextStep, 'LEFT', loadBox);
    }

    if (neighbors === undefined) {
      //经常报这个错
      console.warn('不合法的行列数？node.row', node.row, 'node.col', node.col);
    }

    // 然后 探索下一个 grid 里的这些选出来的点。
    // 这里所有的点都是根据上面 pop 出来的点得出的一系列的相关的点。
    if (nodeNextStep.walkable && nodeNextStep.unitWalkable && neighbors.length === 0) {
      // if(nodeNextStep.walkable ){
      neighbors.push(nodeNextStep); // 如果待在原地是合法的，且没有其他可走的点了.... HC 中，要你能够待在原地。
      nodeNextStep.t = node.t + 1;
    } else if (nodeNextStep.walkable && nodeNextStep.unitWalkable && endRow === node.row && endCol === node.col) {
      neighbors.push(nodeNextStep); // 如果已到达终点
      nodeNextStep.t = node.t + 1;
    }


    // 下面这句是罪恶之源，上面那么多行就是为了确保不随便加原地点。
    // 如果经过上面的判断都没加上，那就是不应该加。除非上面的判断考虑的不够。
    // if(testArray.length === 0){
    //   console.debug('没有符合要求的neighbor，添加当前点');
    //   testArray.push(nodeNextStep);
    //   nodeNextStep.t = node.t + 1;
    // }

    for (i = 0, l = neighbors.length; i < l; i += 1) {
      // 探索所有的合法的点。此时 neighbors 里的点都是下一步没有占用的点
      // 还有一点是要 剔除 掉对向互换位置的点

      neighbor = neighbors[i];

      // if(neighbor.closed){
      //   continue
      // }

      col = neighbor.col;
      row = neighbor.row;

      ng = node.g + 1;
      if (node.row === row && node.col === col) {
        ng = node.g; // 停留在原地没有新增 cost
      }

      if (!neighbor.opened || ng < neighbor.g) {
        neighbor.g = ng;
        neighbor.h = neighbor.h || weight * heuristic(row, col, endRow, endCol);
        // neighbor.h = neighbor.h || weight * heuristic(abs(col - endCol), abs(row - endRow));
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = node;

        if (!neighbor.opened) {
          openList.push(neighbor);
          neighbor.opened = true;
          neighbor.t = node.t + 1;

        } else { // 这里是需要更新 g 的 neighbor。

          openList.updateItem(neighbor);
        }
      }
    } // end for
  } // end while not open list empty
  // fail to find the path
  console.warn('fail to find the path');
  return [];
  // return [[startRow, startCol], ];
};

export default HCCoopFinder;
