/**
 * Created by zhuweiwang on 02/04/2018.
 */
import dispatchConfig from '../config/dispatchConfig';
const {
  rowNum,
  colNum,
  pickStationRow,
  startROW,
  startCOL,
  preGoUpPoint,
  GoDownPoint
} = dispatchConfig;

export default {
  /**
   * Huicang distance.
   *
   * @param {number} startRow - unit 当前点的 row.
   * @param {number} startCol - unit 当前点的 col. START 是指的当前作为判断的点，其实就是所有的点都要能够算到。
   *
   * @param {number} endRow - unit 目标终点的 row. END 的点只可能是中间的货位，以及拣货台。
   * @param {number} endCol - unit 目标终点的 col.
   *
   * @return {number} 具有期望效果的 heuristic。这里其实是相当于手动算了 real heuristic。
   *
   * 运动方向暂定为
   * 1. 顶部的向右
   * 2. 底部的向左、
   * 3. 竖直方向同列能够上下。 // 暂定为只有下。
   *
   */
  huicang: function (startRow, startCol, endRow, endCol) {

    const pickRow = pickStationRow; // 这个是根据UI测试的图里定的。dispatchConfig文件。拣货台的行数。22

    /* 排错. 目标点只能是
     *
     * 1. 两边拣货台
     * 2. 中间货位
     * 3. 起点（原点）
     * 4. 顶部停靠点
     * 5. 原点前停靠点
     *
     * */

    if ((endRow === pickRow) && (endCol === 0 || endCol === colNum - 4)) {
      // console.debug('目标为拣货台');
    } else if (
        endRow >= 1 && endRow <= rowNum - 2 &&
        endCol >= 8 && endCol <= colNum - 12
    ) {
      //console.debug('目标为中间货位'); // 目标是中间货位，这个是 HCPriority 一致的计算方法。
    } else if (endRow === startROW && endCol === startCOL) {
      // console.debug('目标是起点');
    } else if (endRow === preGoUpPoint[0] && endCol === preGoUpPoint[1]) {
      // console.debug('目标是顶部停靠点');
    } else if (endRow === GoDownPoint[0] && endCol === GoDownPoint[1]) {
      // console.debug('目标是对原点前的停靠点');
    } else {
      console.debug('目标设置错误。');
      return 0; // 除了拣货台和中间的货位，其他位置的目标都是不允许的。其实 return 0 在程序中还是发现能够规划出路径。并不是停在原点。和pathFinder里的openList里的点是否有当前点有关。
    }

    /*
     分两部分，
     1. 可以上下的部分（中间部分，且当前列数和目标列数相同）；

     2. 只有唯一路径的部分
     2-1. 上升列到最顶端
     2-2. 顶部一行，一直到最右侧
     2-3. 下降列到最底端
     2-4. 底部一行
     2-5. 中间部分，列数和目标列数不同
     */
    if (
        startRow >= 1 && startRow <= rowNum - 2 &&
        startCol >= 8 && startCol <= colNum - 12 &&
        startCol === endCol
    ) {
      // 1. 可以上下的部分。（中间货位部分，并且，目标终点位置是相同列）
      return Math.abs(startRow - endRow); // 直接是返回的 行数的步数之差。
    } else if (startCol === 0) {
      // 2-1. 上升列到最顶端
      if (endRow === pickRow && (endCol === 0 )) {
        // 目标点是左边拣货台，上升列拣货台
        if (startRow >= pickRow) {
          // 当前位置在拣货台下方
          return startRow - endRow
        } else {
          //在上升列拣货台上方，那就只能绕圈了，到左上方的点的Manhattan + 左上方点到右下点的Manhattan + 终点（左边拣货台）的Manhattan
          return (startRow) +
              (colNum - 4) + (rowNum - 1) +
              (rowNum - 1 - pickRow) + (colNum - 4);
        }
      } else if (
          (endRow === startROW && endCol === startCOL) ||
          (endRow === GoDownPoint[0] && endCol === GoDownPoint[1])
      ) {
        // 目标位置是起点，或者是起点前的一小格
        return (startRow) +
            (colNum - 4) + (rowNum - 1) +
            colNum - 4 - endCol;
      } else {
        // 除此之外，目标是右边拣货台、中间的拣货位，顶部停靠点
        // 到左上方的点的Manhattan + 左上方点和终点的 Manhattan 距离
        return (startRow) +
            (endCol) + (endRow);
      }
    } else if (startRow === 0) {
      // 2-2. 顶部一行，一直到最右侧
      if (
          (endRow === startROW && endCol === startCOL) ||
          (endRow === GoDownPoint[0] && endCol === GoDownPoint[1])
      ) {
        // 目标是 1.起点、2.对原点前的位置。
        return (colNum - 4 - startCol) + (rowNum - 1 - startRow) +
            (colNum - 4 - endCol);
      }

      if (endCol < startCol) {
        // 目标点是后面 那就只有绕圈。
        if (endRow === pickRow && (endCol === 0 )) {
          // 目标点是上升列拣货台。// 当前到右下点的Manhattan + 终点（左边拣货台）的Manhattan
          return (colNum - 4 - startCol) + (rowNum - 1 - startRow) +
              (rowNum - 1 - pickRow) + (colNum - 4);

        } else {
          // 目标点是中间的货位了。需要绕圈。上面的基础上 左边拣货台到左上方的Manhattan + 左上方到目标的Manhattan
          return (colNum - 4 - startCol) + (rowNum - 1 - startRow) +
              (rowNum - 1 - pickRow) + (colNum - 4) +
              pickRow +
              (endCol) + (endRow);
        }
      } else {
        // 目标是正下方或者是右方、中间的拣货位，直接就是当前点和终点的 Manhattan 距离
        return (endCol - startCol) + (endRow - startRow);
      }
    } else if (startCol === colNum - 4) {
      // 2-3 下降列到最底下水平列。
      // 目标是起点
      if (
          (endRow === startROW && endCol === startCOL) ||
          (endRow === GoDownPoint[0] && endCol === GoDownPoint[1])
      ) {
        return (colNum - 4 - startCol) + (rowNum - 1 - startRow) +
            (colNum - 4 - endCol);
      }

      if (endRow === pickRow && (endCol === colNum - 4 )) {
        // 目标点是右边拣货台（下降列拣货台）
        if (startRow <= pickRow) {
          // 起点在拣货台上方。
          return (endRow - startRow)
        } else {
          //在右边拣货台下方，那就只能绕圈了，到右下点的Manhattan + 左上方的点的Manhattan + 左上方点到右拣货台的Manhattan
          return (rowNum - 1 - startRow) +
              (rowNum - 1) + (colNum - 4) +
              (pickRow) + (colNum - 4);
        }
      } else if (endRow === pickRow && (endCol === 0 )) {
        // 目标点是左边拣货台
        return (rowNum - 1 - startRow) +
            (rowNum - 1 - pickRow) + (colNum - 4);

      } else {
        // 目标是中间的货位，顶部的停靠点也适用。
        return (rowNum - 1 - startRow) +
            (rowNum - 1) + (colNum - 4) +
            (endRow) + (endCol);
      }

    } else if (startRow === rowNum - 1) {
      // 2-4 当前点在最底部一行
      // 目标是起点、对原点前的点。
      if (
          (endRow === startROW && endCol === startCOL) ||
          (endRow === GoDownPoint[0] && endCol === GoDownPoint[1])
      ) {
        return startCol - endCol; // 这么写是没有考虑过了起点之后还下任务的。
      }

      if (endRow === pickRow && (endCol === 0 )) {
        // 目标点是左边拣货台
        return (startRow - endRow ) + (startCol - endCol );
      } else if (endRow === pickRow && (endCol === colNum - 4 )) {
        // 目标点是右边拣货台 到左边拣货台Manhattan + 到左上角的Manhattan + 左上角到右边拣货台Manhattan
        return (startRow - pickRow ) + (startCol) +
            (pickRow) +
            (endCol) + (endRow);
      } else {
        // 目标是中间的货位，顶部停靠点适用
        return (startRow - pickRow ) + (startCol) +
            (pickRow) +
            (endCol) + (endRow);
      }

    } else if (
        startRow >= 1 && startRow <= rowNum - 2 &&
        startCol >= 8 && startCol <= colNum - 12 &&
        startCol !== endCol
    ) {
      // 2-5 中间部分，需要绕
      // 目标是起点
      if (
          (endRow === startROW && endCol === startCOL) ||
          (endRow === GoDownPoint[0] && endCol === GoDownPoint[1])
      ) {
        return (rowNum - 1 - startRow) +
            (startCol - endCol);
      }

      if (endRow === pickRow && (endCol === 0 )) {
        // 目标是左边拣货台
        // 当前列数和目标列数不同，到当前列底部 + 左边拣货台Manhattan
        return (rowNum - 1 - startRow) +
            (startCol ) + (rowNum - 1 - pickRow);
      } else {
        // 目标是中间货位，或者右边拣货台，或者顶部停靠点
        // 当前列数和目标列数不同，到当前列底部 + 左边拣货台Manhattan + 左上角Manhattan + 目标位置Manhattan
        return (rowNum - 1 - startRow) +
            (startCol ) + (rowNum - 1 - pickRow) +
            (pickRow) +
            (endCol ) + (endRow);
      }
    } else {
      console.debug('some senario not expected!');
      console.debug('startRow, startCol, endRow, endCol', startRow, startCol, endRow, endCol)
      console.debug(startCol === endCol);
    }
  }// end of huicang distance function
};
