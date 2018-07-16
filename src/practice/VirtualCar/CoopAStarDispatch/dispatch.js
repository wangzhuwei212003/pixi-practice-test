/**
 * Created by zhuweiwang on 02/04/2018.
 */
import Heap from 'heap';
import HCCoopFinder from './finder/HCCoopFinder';
// import {dispatchConfig, config, PPconfig} from '@root/config';
import dispatchConfig from './config/dispatchConfig';
import config from './config/config';
import PPconfig from './config/PPconfig';
import _ from 'lodash';
import * as Util from './core/Util';
import {shuttles} from '../core/shuttleInstances.js';
// import {haveTask} from '@backend/lib/shuttleUtilities.js';
import {hasEnoughPowerGoUpTraget} from '../lib/powerManagement.js';

const {mainShelfMap} = PPconfig;
const {
  rowNum,
  colNum,
  timeGap,
  searchDeepth,
  pickStationRow,

  firstGoDownCol,
  lastGoDownCol,
  lastGoDownPickCol,
  specialHeightStartRow,
  specialHeightEndRow,
  divideCell,
  upRowFromGoalRow,
  upColFromGoalCol,

  startROW,
  startCOL,
  startOdom,
  midCOL,
  midOdom,
  midROW,
  usedRowNum,
  usedColNum,
  smallRowNum,
  smallColNum,
  boxRowNum,
  boxColNum,
  topBoxNormalHeight,
  normalWidth,
  specialTopPart,
  normalHeight,
  normalHeightBIG,
  SUPPart,
  SDownPart,
  SDownPartBigRow,
  SUPPartBigRow,
  specialBottomPart,
  doubleBottomPart,
  specialHeight,
  pickSitesPosition,
  pickSitesPositionShift,
  occupyRowConfig, // 考虑最底一行，
  occupyColConfig,
  occupyRowConfigUnload,
  crossRoadoccupyRowConfig,
  preGoUpPoint,
  GoDownPoint,

  delayGap,
  avoidDist,
  extraNumInDeadLock,
  parkingGoalTable
} = dispatchConfig;

const {showDispatchLog} = config;

const SpecificActionsEnum =
    {
      SA_PIN_OUTSTRETCH: 0,
      SA_PIN_RETRIEVE: 1,
      SA_ODOM_FORWARD_GROUND_AS_REFERENCE: 2,
      SA_ODOM_BACKWARD_GROUND_AS_REFERENCE: 3,
      SA_ODOM_UP_GROUND_AS_REFERENCE: 4,
      SA_ODOM_DOWN_GROUND_AS_REFERENCE: 5,
      SA_TURNING_BEGIN_POINT: 6
    };

// 需要实时更新的数据
let uidArr = []; // 1维数组，用来得到uid和对应的index
let pathTable = []; // 3维数组，包含若干个经过的格子
let goalTable = []; // 3维数组，包含起点（当前位置、终点）

let shiftingArr = []; // 1维数组，位置报告中的 偏移量。index 和 uid 的 index 一致。
let wheelToChainArr = []; // 1维数组，每个小车的 wheelToChain 的配置

let odomArr = []; // 1维数组，包含的是 obj。记录位置报告。index 和 uid 的 index 一致。大格子的
let teethAndActionArr = []; // 1维数组，直接把算出来的总齿数和相应的动作存下来，是一个 obj，{}。index 和 uid 的 index 一致。
let goingUpTable = []; // 1维数组，true or false。记录小车是否是向上行走，用于实时的路径规划的 search_deepth，如果是向上运动取箱子，一定是要有足够长的步数。。

let trackById = []; // 保留各个小车的 uid 以及对应的占位情况 track

let matrixZero = []; // 0-1矩阵，用来记录除其他小车之外的障碍。这个基本不变。
let initialInterval; // 避障算法的 setInterval

let reachGoal = []; // 1维数组，小车是否已经到终点 true、false
let avoidDeadLock = []; // 1维数组，小车是否已经发送新的路径 true、false

let colCapacityArr = []; // 1维数组，用来存每一行能够容许多少辆小车。这个是一有小车注册上来就算好，之后只去查。

let firstIdleCanGoFlag = false;

// 避障算法初始化接口
export const initialDispatch = function () {
  // 初始化 matrix
  if (matrixZero.length === 0) {
    matrixZero = Util.generateMatrix();
  }
  // 初始化 colCapacityArr，即使删除小车这个数组也是存在的。
  if (colCapacityArr.length === 0) {
    initColCapacityArr();
    console.info('colCapacityArr: ', colCapacityArr);
  }

  initialInterval = setInterval(() => {
    try {
      // console.debug('根据当前位置重新规划一定步长');
      // 这个方法里是自己根据 goalTable，可以说是仅仅需要 goalTable。
      const startTime = Date.now();
      initialNextTimeStep();
      const endTime = Date.now();
      if (showDispatchLog && endTime - startTime > timeGap) {
        console.info('一步计算用时：', endTime - startTime);
      }

      // console.log(shuttles);

    } catch (e) {
      console.error("error in dispatch interval", e);
    }
  }, timeGap);
};

// 清空规划路径的循环
export const clearDispatchInterval = function () {
  clearInterval(initialInterval);
};

// 注册小车，有新的小车注册，更新所有变化的数据
export const registerShuttle = function (uid) {
  // 在注册的时候，就初始化 matrix
  if (matrixZero.length === 0) {
    matrixZero = Util.generateMatrix();
  }

  // 排错，重复注册
  let checkIndex = uidArr.findIndex((ele) => {
    return ele === uid;
  });
  if (checkIndex !== -1) {
    console.warn('重复注册！');
    return;
  }

  // 更新数据
  uidArr.push(uid); // 小车 uid
  pathTable.push(Array(searchDeepth).fill([startROW, startCOL])); // 路径
  goalTable.push([[startROW, startCOL], [startROW, startCOL]]); // 注册小车，默认起点终点都是config里的起点。起点（当前点、目标点）

  shiftingArr.push(0); // 位置报告得到的偏移量，即是小格子的偏移量
  wheelToChainArr.push(shuttles[uid].shuttleConfig.wheel_to_chain); // 存每个小车的 wheelToChain
  odomArr.push(startOdom); // 默认的起点
  teethAndActionArr.push({total_teeth: 0, Actions: []}); // 总齿数和动作
  goingUpTable.push(false); // 默认是小车都没有向上运动取货。是否向上运动

  trackById.push(Util.generateZeroMatrix()); // 小车占位区间

  reachGoal.push(false); // 注册小车，默认没有到达终点
  avoidDeadLock.push(false); //

};

// 删除小车
export const deleteShuttle = function (uid) {
  // 有小车注销，更新 uidArr / pathTable / goalTable
  let checkIndex = uidArr.findIndex((ele) => {
    return ele === uid;
  });
  if (checkIndex === -1) {
    console.warn('没有找到需要注销的uid！');
    return;
  }

  // 删除相应的数据（找到了对应的uid）。splice会改变原始数组。
  uidArr.splice(checkIndex, 1);
  pathTable.splice(checkIndex, 1);
  goalTable.splice(checkIndex, 1);

  shiftingArr.splice(checkIndex, 1);
  wheelToChainArr.splice(checkIndex, 1);
  odomArr.splice(checkIndex, 1);
  teethAndActionArr.splice(checkIndex, 1);
  goingUpTable.splice(checkIndex, 1);

  trackById.splice(checkIndex, 1);

  reachGoal.splice(checkIndex, 1);
  avoidDeadLock.splice(checkIndex, 1);
};

// 根据 index 更新 reachGoal
export const setReachGoalByIndex = function (index, reached) {
  reachGoal[index] = reached;
};
export const setReachGoalByUid = function (uid) {
  let index = uidArr.findIndex((ele) => {
    return ele === uid;
  });
  reachGoal[index] = true;
};

export const setGoal = function (uid, rowInput, colInput, matrixMap = matrixZero) {
  const targetPosition = [rowInput, colInput]; // 电源管理用到。

  // 更新目标接口，设置终点。更新 goalTable，算出总齿数以及Action发给小车。

  // 1. 找对应 uid 的index
  let checkIndex = uidArr.findIndex((ele) => {
    return ele === uid;
  });
  if (checkIndex === -1) {
    if (showDispatchLog) console.warn('没有找到需要设置终点的uid！');
    return false;
  }

  // 2. 传进来的 row、col 需要转换成我这里的坐标系
  if (!shuttles[uid].shuttleConfig.wheel_to_chain) {
    if (showDispatchLog) console.warn('没有找到 shuttleConfig.wheel_to_chain ！');
    return false;
  }

  let goalOdom = {
    horizontal_offset_from_nearest_coordinate: 0,
    vertical_offset_from_nearest_coordinate: shuttles[uid].shuttleConfig.wheel_to_chain, // 判断是否为空
    theoretical_moving_direction: SpecificActionsEnum['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString(), // 这里是改成字符串了。moving down :SpecificActionsEnum['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString()
    current_row: rowInput,
    current_column: colInput,
    turning: false
  }; // 生成一个终点的 odom。
  let positionObj = rowColTransfForStartNode(goalOdom);

  let endNode = [positionObj.rowSmall, positionObj.colSmall];
  let endRow = endNode[0];
  let endCol = endNode[1];
  let endShift = positionObj.shiftLeft; // 设置货位目标的时候，下沉距离

  // 3. 排错，判断目标是否合法
  if (endRow === pickStationRow && (endCol === 0 || endCol === lastGoDownPickCol)) {
    //console.log('目标为拣货台');
  } else if (
      endRow >= 1 && endRow <= specialHeightStartRow &&
      endCol >= firstGoDownCol && endCol <= lastGoDownCol
  ) {
    //console.log('目标为中间货位'); // 目标是中间货位，这个是 HCPriority 一致的计算方法。
  } else {
    if (showDispatchLog) console.warn('目标设置错误。');
    return false; // 除了拣货台和中间的货位，其他位置的目标都是不允许的。
  }

  // 4. 判断是否有起点了，起点是在goalTable里的。一般是规定好的起点（齿数为0
  if (goalTable[checkIndex][0].length === 0) {
    if (showDispatchLog) console.warn('没有位置报告，起点为空！');
    return false;
  }

  // 判断是否应该计算路径，是否是空闲 && 当前任务已经走完 && 速度为零
  const optUid = uidArr[checkIndex];
  const total_teeth_from_origin = odomArr[checkIndex].total_teeth_from_origin;
  const total_teeth = teethAndActionArr[checkIndex].total_teeth;
  const arrive = reachGoal[checkIndex];
  const distToGoal = Math.abs(total_teeth - total_teeth_from_origin);
  const curSpeed = shuttles[optUid].curSpeed; // 小车当前速度

  if (
      !arrive
  ) {
    // 这里不用判断小车的速度？只是看arrive这个标识收到 80命令的值？，我觉得还是一起判断比较好。判断条件仅仅是 arrive 是否到达。时间// !arrive || curSpeed !== 0
    // setGoal 之后status是1了。setGoal 这里不用判断 status，本来找空闲小车的方法里就有了 status === 0 的判断。
    // 这里虽然是已经分配了终点，但是，真正的终点不能改变，暂时放在 goalAssignArr 里
    if (showDispatchLog) console.info('速度不为0，或到终点距离不为0，调用 setGoal 方法，当前状态', shuttles[optUid].status, ' 当前任务没走完 ', distToGoal, ' 速度不为零', curSpeed);
    // goalAssignArr[checkIndex] = endNode; // 其他都是和 goalTable 一起改的。这是唯一一个地方 goalAssignArr 改了，goalTable 没改。注意传的是小格子行列数
    return false;
  }

  // boolean
  let goingUp = checkGoUp(checkIndex, endRow, endCol, goalTable, shuttles[optUid], targetPosition); // 传入的直接就是小格子的行列数，这里用的是小车当前的位置
  // 如果是往上运动，起点特殊处理一下。起点不需要特殊处理，还是原来的、向下偏移的起点。

  let startNode = goalTable[checkIndex][0];
  let startShift = shiftingArr[checkIndex]; // 当前的偏移量

  // 5. 根据goalTable里的起点，接收输入的终点，更新goalTable里的终点，算出总齿数以及action
  let result = calTeethAndPinAction(checkIndex, startNode, endNode, startShift, endShift, goingUp, matrixMap); // goalTable的更新放在这里，goingUpTable也放在这里好了。

  // 6. 结果发给小车。 返回{totalLenghth，actions}
  if (showDispatchLog) console.info('startNode:', startNode, 'endNode:', endNode, '设置目标后规划出的总齿数和动作：', result);
  return result;
};

export const calcGoingupTeeth = function (uid, rowInput, colInput, matrixMap = matrixZero) {
  // 和实际的 setGoal 类似，只不过这个是只是用来计算齿数的。返回总齿数
  const LOGGER = shuttles[uid].splitLogger;
  if (showDispatchLog) {
    LOGGER.info('rowInput', rowInput);
    LOGGER.info('colInput', colInput);
  }
  const wheel = shuttles[uid].shuttleConfig.wheel;

  // 更新目标接口，设置终点。更新 goalTable，算出总齿数以及Action发给小车。

  // 1. 找对应 uid 的index
  let checkIndex = uidArr.findIndex((ele) => {
    return ele === uid;
  });
  if (checkIndex === -1) {
    if (showDispatchLog) LOGGER.warn('没有找到需要设置终点的uid！');
    return false;
  }

  // 2. 传进来的 row、col 需要转换成我这里的坐标系
  if (!shuttles[uid].shuttleConfig.wheel_to_chain) {
    if (showDispatchLog) LOGGER.warn('没有找到 shuttleConfig.wheel_to_chain ！');
    return false;
  }

  let goalOdom = {
    horizontal_offset_from_nearest_coordinate: 0,
    vertical_offset_from_nearest_coordinate: shuttles[uid].shuttleConfig.wheel_to_chain, // 判断是否为空
    theoretical_moving_direction: SpecificActionsEnum['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString(), // 这里是改成字符串了。moving down :SpecificActionsEnum['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString()
    current_row: rowInput,
    current_column: colInput,
    turning: false
  }; // 生成一个终点的 odom。
  let positionObj = rowColTransfForStartNode(goalOdom);

  let endNode = [positionObj.rowSmall, positionObj.colSmall];
  let endShift = positionObj.shiftLeft; // 设置货位目标的时候，下沉距离

  let startNode = goalTable[checkIndex][0];
  let startShift = shiftingArr[checkIndex]; // 当前的偏移量

  // 算路径
  let _pathTable = Array(uidArr.length).fill([]); // 这里应该是根据当前已注册的小车数量
  let _goalTable = JSON.parse(JSON.stringify(goalTable));
  _goalTable[checkIndex][1] = endNode;
  const finder = new HCCoopFinder();
  const path = finder.findPath(checkIndex, _goalTable, rowNum * 6 + colNum * 6, _pathTable, matrixMap, rowNum, colNum, true, true, true, shiftingArr, wheelToChainArr); // 因为算齿数不考虑其他小车，这里ignore为true。loadBox没有什么影响，这里就暂定true
  let calcPath = path.reduce(function (accu, currentV, currentInx, arr) {
    if (accu.length === 0) {
      accu.push(currentV);
      return accu;
    } else if (accu[accu.length - 1][0] !== currentV[0] || accu[accu.length - 1][1] !== currentV[1]) {
      accu.push(currentV);
      return accu;
    } else {
      return accu;
    }
  }, []);
  if (showDispatchLog) {
    LOGGER.info('path', path);
    LOGGER.info('calcPath', calcPath);
  }
  let teethAndPinAction = Util.calcTeeth(calcPath, startShift, endShift, true, wheel); // 根据 path 算齿数。

  if (showDispatchLog) LOGGER.info('startNode:', startNode, 'endNode:', endNode, '同一列向上取货规划出的总齿数：', teethAndPinAction);
  return Math.abs(teethAndPinAction.total_teeth);
};

// 返回拣货台
export const goToPickUpSite = function (uid, pickSite) {
  // 参数可以是 'SiteA' 'SiteB'
  // 1. 找对应 uid 的index
  let checkIndex = uidArr.findIndex((ele) => {
    return ele === uid;
  });
  if (checkIndex === -1) {
    if (showDispatchLog) console.warn('没有找到需要设置终点的uid！');
    return;
  }

  // 2. 计算总齿数、动作需要的参数：index、起点、终点、是否向上运动。
  const currentRow = goalTable[checkIndex][0][0];
  const currentCol = goalTable[checkIndex][0][1]; // 选中的小车的当前小格子行列数
  const startNode = [currentRow, currentCol];
  const startShift = shiftingArr[checkIndex]; // 尽管位置报告会有向上运动方向、向上偏移量，已经全部转换成向下的偏移量。
  const goingUp = false; // 已经转换成向下的位置报告。
  const endNode = pickSitesPosition[pickSite]; // 返回拣货站位置
  const endShift = pickSitesPositionShift[pickSite]; // 拣货台的终点的偏移量设为 0, 正标识向上多几个齿。

  // 3. 得出结果。
  const result = calTeethAndPinAction(checkIndex, startNode, endNode, startShift, endShift, goingUp, matrixZero);
  if (showDispatchLog) console.info('uid', uid, '目标为拣货台，规划出的总齿数和动作：', result);
  return result;
};

// 小车原点对齐之后去最顶部一行等待
export const preGoUp = async function (uid) {

  // 1. 找对应 uid 的index
  let checkIndex = uidArr.findIndex((ele) => {
    return ele === uid;
  });
  if (checkIndex === -1) {
    if (showDispatchLog) console.warn('没有找到需要设置终点的uid！', uid);
    return;
  }
  // await shuttles[uid].stopConsume(); // 开始上去的时候，不能接收任务

  // 2. 计算总齿数、动作需要的参数：index、起点、终点、是否向上运动。
  const currentRow = goalTable[checkIndex][0][0];
  const currentCol = goalTable[checkIndex][0][1]; // 选中的小车的当前小格子行列数
  const startNode = [currentRow, currentCol];
  const startShift = shiftingArr[checkIndex]; // 小车偏移量，对齐之后应该是0。
  const goingUp = false;
  const endNode = preGoUpPoint; // 最上面一行的停靠点
  const endShift = 0;

  // 3. 得出结果。
  if (currentRow === 0) { //开机之后，关机。
    const pathinfo = {
      total_teeth: 0,
      Actions: [],
    };
    if (showDispatchLog) console.info('uid', uid, '目标为顶部停靠点，且小车当前位置在顶部一行，规划出的总齿数和动作：', pathinfo);
    shuttles[uid].sendTargetActionToShuttle(pathinfo); // 为了配合关机流程，得到完成第一阶段的标志
  } else {
    const pathinfo = calTeethAndPinAction(checkIndex, startNode, endNode, startShift, endShift, goingUp, matrixZero);
    if (showDispatchLog) console.info('uid', uid, '目标为顶部停靠点，规划出的总齿数和动作：', pathinfo);
    shuttles[uid].sendTargetActionToShuttle(pathinfo);
  }
};

// 更新 Odom 接口，接收位置报告。（接收到的是小格）
export const setStartNode = function (uid, odom) {
  // console.log('setStartNode occur');
  // 排错
  let checkIndex = uidArr.findIndex((ele) => {
    return ele === uid;
  });
  if (checkIndex === -1) {
    if (showDispatchLog) console.warn('没有找到需要设置起点的uid！');
    return;
  }

  // 转换成我这边的 row，col。如果收到的是小格来算的

  // 设置起点
  let positionObj = rowColTransfForStartNode(odom);
  goalTable[checkIndex][0] = [positionObj.rowSmall, positionObj.colSmall]; // 更新起点
  shiftingArr[checkIndex] = positionObj.shiftLeft;
  odomArr[checkIndex] = odom;
  //if (showDispatchLog) LOGGER.debug('位置报告更新 goalTable 里的起点：', goalTable[checkIndex][0]);

  // 更新trackById，但是判断是否有障碍要放在发送速度的那个方法那里。
  trackById[checkIndex] = Util.calSectionLockMapForGeneral(positionObj.rowSmall, positionObj.colSmall);

};

const calTeethAndPinAction = function (optIndex, startNode, endNode, startShift = 0, endShift = 0, goingUp = false, matrixMap) {
  const uid = uidArr[optIndex];
  const wheel = shuttles[uid].shuttleConfig.wheel;

  // goingUp 默认是 false
  // if (showDispatchLog) LOGGER.info('向上行走goingUp：', goingUp);

  // 排错，这里不需要排错了，setGoal 方法里已经有了。

  // 根据起点、终点算路径。调用这个方法的时候，其实是设置 goalTable 的一个过程。
  // let _pathTable = Array(shuttleAmount).fill([]);
  let _pathTable = Array(uidArr.length).fill([]); // 这里应该是根据当前已注册的小车数量
  goalTable[optIndex][1] = endNode; // 更改 goalTable 里面的路径。全文就这里是更改小车当前真正的目标位置。

  setReachGoalByIndex(optIndex, false); // 改变 reach goal 状态

  goingUpTable[optIndex] = goingUp; // 更新向上取货的小车的标志。

  //if (showDispatchLog) LOGGER.info('%%%%%%%%%%%%%%%%%%%更改目标点', endNode);

  // 注意这里是应该要确保 matrixZero 是有的
  if (matrixZero.length === 0) {
    if (showDispatchLog) console.error('matrixZero 矩阵未设置！');
    return 0;
  }

  const finder = new HCCoopFinder();
  const path = finder.findPath(optIndex, goalTable, rowNum * 6 + colNum * 6, _pathTable, matrixMap, rowNum, colNum, true, goingUp, true, shiftingArr, wheelToChainArr); // 因为算齿数不考虑其他小车，这里ignore为true。loadBox没有什么影响，这里就暂定true
  // 保险起见，这里 4 改为 6，确保能够找到最终的终点。
  //console.log(path);

  let calcPath = path.reduce(function (accu, currentV, currentInx, arr) {
    if (accu.length === 0) {
      accu.push(currentV);
      return accu;
    } else if (accu[accu.length - 1][0] !== currentV[0] || accu[accu.length - 1][1] !== currentV[1]) {
      accu.push(currentV);
      return accu;
    } else {
      return accu;
    }
  }, []);

  // if (showDispatchLog) {
  //   console.info('path', path);
  //   console.info('calcPath', calcPath);
  // }

  // let teethAndPinAction = Util.calcTeeth(path, shiftingArr[optIndex]); // 根据 path 算齿数。
  let teethAndPinAction = Util.calcTeeth(calcPath, startShift, endShift, goingUp, wheel); // 根据 path 算齿数。

  //console.log(teethAndPinAction);
  //if (showDispatchLog) LOGGER.warn('teethAndPinAction', teethAndPinAction);

  teethAndActionArr[optIndex] = teethAndPinAction;
  return teethAndPinAction;
};

const initializePathTable = function () {

  const _unitsNum = uidArr.length;
  let _searchDeepth = searchDeepth + 1;
  const _matrixZero = matrixZero; // matrixZero 是不会变的。
  let startRow, startCol; // 这个是为了寻找当前点的 priority，是 this.goalTable 里的第一个元素
  let _pathTable = Array(_unitsNum).fill([]); // 重置 pathtable，初始化当前的 pathTable。

  const priorityHeap = new Heap(function (nodeA, nodeB) {
    return -(nodeA.p - nodeB.p); // priority 大的先pop出来
  });

  // 两个for循环，
  // 1. 把所有 goalTable 里的起点放进 heap，
  // 2. 按照 priority 排序，并依次进行寻路。
  for (let i = 0; i < goalTable.length; i += 1) {
    //console.info('车序号：', i, 'goalTable:', _goalTable[i]);
    startRow = goalTable[i][0][0]; // 起点的行数，当前点的行数
    startCol = goalTable[i][0][1]; // 起点的列数，当前点的列数

    priorityHeap.push({
      index: i,
      p: Util.CalcPriority(startRow, startCol),
      startRow: startRow,
      startCol: startCol
    });
  }

  /* 根据优先级算路径，并在for循环之后更新路径。下面的for循环是为了给小车发送速度。
   *
   * 分情况：
   * 1. 区间控制判断有障碍，（弥补优先级的缺陷） // 在找路径之前应该先判断一下前面有没有车。有没有障碍，有障碍直接就待在原地。路径避障在优先级明确的地方有用。但是在拣货台那里有缺陷。）
   *    判断有障碍了就直接设 0 速
   *
   * 2. 到达终点 && 就是分配的终点
   *    直接规划当前的点，毋须调用 pathFinder
   *
   * 3. 在路上，根据路径发速度
   *
   * */
  for (let i = 0; i < _unitsNum; i += 1) {
    const obj = priorityHeap.pop();
    const optIndex = obj['index'];
    const optRow = obj['startRow']; //当前点的行数，小格子
    const optCol = obj['startCol']; //当前点的列数，小格子
    const optUid = uidArr[optIndex];
    const optShuttle = shuttles[optUid];
    const endNodeArr = goalTable[optIndex][1]; // goalTable 里的终点，即是小车当前路径的终点
    // const curGoalRow = endNodeArr[0];
    // const curGoalCol = endNodeArr[1];
    const arrive = reachGoal[optIndex];

    if (goingUpTable[optIndex]) {
      // 如果是向上取货，要保证未来的路径是能够占到的
      _searchDeepth = rowNum;
    }

    const obInTheWay = Util.checkObstacle(optIndex, optRow, optCol, trackById); // 判断上升列有没有小车占位，有的话就是直接待在原地，不规划路径。
    if (obInTheWay) {
      // 1. 区间控制判断有障碍
      _pathTable[optIndex] = Array(_searchDeepth).fill([optRow, optCol]); // 当 i = 0 的时候，就是整个 path

      if (optShuttle.registered && !arrive) {
        if (showDispatchLog && obInTheWay) console.warn('uid', optUid, '有障碍，就直接发速度 0.'); // 这个是实时规划的，用于避障的path
        Util.sendVelocity(0, optShuttle, 0, 0, 0, 0, optIndex, goingUpTable[optIndex]);
      }
    } else if (arrive) {
      // 2. 到达终点 && 就是分配的终点. 通过 80 判断到达终点
      if (showDispatchLog) console.warn('uid', optUid, '到达终点 && 就是分配的终点'); // 这个是实时规划的，用于避障的path

      let path = Array(_searchDeepth).fill([optRow, optCol]);
      _pathTable[optIndex] = path;
      if (showDispatchLog) console.warn('uid', optUid, '已经到达终点，没有寻路，直接实时规划的路径：', path); // 这个是实时规划的，用于避障的path
      if (showDispatchLog) console.warn('uid', optUid, 'optShuttle.registered：', optShuttle.registered);

      if (optShuttle.registered && !arrive) {
        Util.sendVelocity(path, optShuttle, shiftingArr[optIndex], endNodeArr, odomArr[optIndex], teethAndActionArr[optIndex], optIndex, goingUpTable[optIndex]);
      }
    } else {
      // 4. 在路上，根据路径发速度  // 剩下的条件交给规划路径的方法。

      // if (showDispatchLog) console.warn('_searchDeepth', _searchDeepth); // 这个是实时规划的，用于避障的path

      const loadBox = optShuttle.loadBox ||
          (
              (optShuttle.status === 1 || optShuttle.status === 2) && (optRow < specialHeightStartRow && optCol >= firstGoDownCol && optCol <= lastGoDownCol)
          ) ||
          (
              (optRow >= rowNum - 1 - crossRoadoccupyRowConfig && optCol >= firstGoDownCol && optCol <= lastGoDownCol)
          ); // 真的在拉箱子，或者，正在中间去拉箱子的路上，或者，在中间路口
      const finder = new HCCoopFinder();
      let path = finder.findPath(optIndex, goalTable, _searchDeepth, _pathTable, _matrixZero, rowNum, colNum, false, goingUpTable[optIndex], loadBox, shiftingArr, wheelToChainArr);

      // if (showDispatchLog) console.warn('uid', optUid, '根据路径发速度. 实时规划的路径：', path); // 这个是实时规划的，用于避障的path

      if (path.length === 0) {
        // 如果是没有找到路径，是返回的[]，当前的位置也是不合法的，当前的位置被优先级更高的小车占用了。
        if (showDispatchLog) console.warn('uid', optUid, 'fail to find a path，没有找到路径，强行返回一个待在原地的路径'); // 这个是实时规划的，用于避障的path
        path = Array(_searchDeepth).fill([optRow, optCol]);
      }

      let curSpeed = optShuttle.curSpeed; // 获得小车的当前速度，
      let MAX_SPEED = optShuttle.shuttleConfig.max_speed; //

      let occupySteps = _searchDeepth; // 这次规划出来的路径，前面多少个时间片内，路径保持当前位置
      if (curSpeed > 0) {
        occupySteps = Math.round(MAX_SPEED / (curSpeed)); // 生成占位的路径的时候，考虑速度的比例。
      }
      if (occupySteps >= _searchDeepth) occupySteps = _searchDeepth - 1; // 保证至少有一格，让 firstStep 不为 undefined
      let occupyPath = path.slice(0, path.length - occupySteps); // slice 会返回一个新数组，path的searchdeepth
      let firstStep = occupyPath[0];
      for (let i = 0; i < occupySteps; i++) {
        occupyPath.splice(1, 0, firstStep);
      }

      _pathTable[optIndex] = occupyPath; // 速度低的时候根据occupySteps的值来算原地占格子的数量
      if (optShuttle.registered && !arrive) {
        // 实际发速度还是按照规划好的path计算速度
        Util.sendVelocity(path, optShuttle, shiftingArr[optIndex], endNodeArr, odomArr[optIndex], teethAndActionArr[optIndex], optIndex, goingUpTable[optIndex]);
      }
    }
  } // end for loop 所以 searchDeepth 必须要比 unit 的个数多。

  // pathTable = _pathTable; // 更新当前保存的数据里的 pathtable。
  // 这里pathtable是没有在其他地方用到的。每一次用都是在这个方法内部，作用域都是在这个方法内部。
};

// 计算每一列能够容纳多少辆小车，保证不死锁。
export const readColCapacity = function (colInput) {
  return colCapacityArr[colInput] - extraNumInDeadLock;
};

const initColCapacityArr = function () {
  // 总长度 / 单个小车加刹车距离

  // 每一列的高度的齿数：
  const colHeight = normalHeight * divideCell * (usedRowNum - 3) + topBoxNormalHeight * divideCell + specialHeight;
  const colHeightNum = colHeight / (occupyRowConfig * normalHeight + avoidDist);

  //找到mainshelf里有货箱的一行，两边的索引
  let leftInx = 0, rightInx = 0;
  for (let i = 0; i < mainShelfMap.length; i += 1) {
    for (let eleInx = 1; eleInx < mainShelfMap[i].length - 1; eleInx += 1) {
      if (mainShelfMap[i][0] !== -1) {
        leftInx = 0;
      }
      if (mainShelfMap[i][mainShelfMap[i].length - 1] !== -1) {
        rightInx = mainShelfMap[i].length - 1;
      }
      if (mainShelfMap[i][eleInx - 1] === -1 && mainShelfMap[i][eleInx] !== -1 && eleInx < leftInx) {
        leftInx = eleInx;
      }
      if (mainShelfMap[i][eleInx] !== -1 && mainShelfMap[i][eleInx + 1] === -1 && eleInx > rightInx) {
        rightInx = eleInx;
      }
    }
  }

  for (let i = 0; i < mainShelfMap[0].length; i += 1) {
    if (i < leftInx || i > rightInx) {
      colCapacityArr.push(0);
      continue;
    }
    const smallCol = i * divideCell;
    const horizEdge = specialTopPart * divideCell + normalWidth * (smallCol - divideCell);
    const horizEdgeNum = horizEdge / (occupyColConfig * normalWidth + avoidDist);
    colCapacityArr.push(Math.round((colHeightNum + horizEdgeNum) * 2));
  }
};

const initialNextTimeStep = function () {
  /*
   * 初始化路径之后，这个是连续地隔一段时间重新规划一次的方法。
   *
   * 根据 pathTable 前端显示的方法这里是肯定不需要的。
   * 1. 这里更新 goalTable 的起点，（在前端模拟的时候是需要模拟更新 goalTable 里的起点，在后端这里是不需要的，goalTable 里的起点是根据位置报告来更新的。）
   * 2. 重新规划
   * 3. 更新 pathtable
   */

  if (!checkGoalTable(goalTable) && !_.isEmpty(shuttles)) {
    // 如果是没有通过测试，那么就是应该是报错了！
    // console.warn('goalTable illegal');
    return;
  }

  // 这里不需要更新 goalTable，并且之前规划过的 pathTable 都是不会再用到的。
  // 按照优先级算路径
  initializePathTable();
};

const checkGoalTable = function (goalTable) {
  // 应该是一个三维数组，格式参考上面。
  //
  // true means GOOD to run the nextStep. 为了确定goalTable不为空，且符合上面的格式。
  let shuttleAmount = uidArr.length;
  if (shuttleAmount === 0) {
    // console.warn('没有小车注册');
    return;
  }
  return goalTable.length === shuttleAmount &&
      goalTable[0].length === 2 && goalTable[0][1].length === 2 &&
      goalTable[shuttleAmount - 1].length === 2 && goalTable[shuttleAmount - 1][1].length === 2;

};

const rowColTransfForStartNode = function (odom) {
  /*
   * odom 里面的位置报告，行列数需要特殊处理的。
   * 1. 顶部一行
   * 2. 底部两行
   *
   * 比较一般的
   * 3. 中间剩余部分
   *
   * */
  // console.info('odom', odom);

  let rowSmall;
  let colSmall = odom.current_column * divideCell; // 稍后返回的小格子行列数，小格子采用的是左上角是（0，0）向右向下增加。大格子是左下角是（0，0）
  let shiftNum; // 算成小格子后还多出的距离 齿数
  let shiftLeft = 0;

  if (odom.current_row === usedRowNum - 1) {
    // 1. 特殊处理的部分，顶部一行. usedRowNum - 1 === 7
    rowSmall = 0;

    // 顶部一行的运动方向，决定了和底部一行的水平移动换算方式不一样。
    if (odom.current_column === 0) {
      colSmall = 0;
    } else {
      colSmall = 3 + (odom.current_column - 1) * divideCell;
    }

    if (
        odom.theoretical_moving_direction.toString() === SpecificActionsEnum['SA_ODOM_FORWARD_GROUND_AS_REFERENCE'].toString() &&
        !odom.turning
    ) {
      // 考虑顶部特殊宽度，特殊宽度是对称的。Fatal: 特殊宽度不是对称，只有上升列是有特殊长度。
      if (odom.current_column === 1) {
        shiftNum = Math.floor(odom.horizontal_offset_from_nearest_coordinate / specialTopPart);
        colSmall += shiftNum;
        shiftLeft = odom.horizontal_offset_from_nearest_coordinate - shiftNum * specialTopPart;
      } else {
        shiftNum = Math.floor(odom.horizontal_offset_from_nearest_coordinate / normalWidth);
        colSmall += shiftNum;
        shiftLeft = odom.horizontal_offset_from_nearest_coordinate - shiftNum * normalWidth;
      }
    } else if (
        odom.theoretical_moving_direction.toString() === SpecificActionsEnum['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString() &&
        !odom.turning
    ) {
      shiftNum = Math.floor(odom.vertical_offset_from_nearest_coordinate / topBoxNormalHeight);
      rowSmall += shiftNum;
      colSmall += 1; // 如果是 rowSmall 加1，colSmall应该加1.
      shiftLeft = odom.vertical_offset_from_nearest_coordinate - shiftNum * topBoxNormalHeight;
    } else if (odom.turning) {
      shiftLeft = odom.horizontal_offset_from_nearest_coordinate;
    } else {
      // console.warn('some senario not considered!!');
      // console.warn('--------------------------', odom);
    }
    // 顶部一行的判断结束。
  }
  /*else if (
   odom.current_row === 1 && odom.current_column === 0
   ) {
   // 2-1. 倒数第二行，就是特殊列的一行。第一列 -- 上升列
   rowSmall = smallRowNum - 2;

   shiftNum = Math.floor(odom.vertical_offset_from_nearest_coordinate / normalHeight);
   rowSmall -= shiftNum;
   shiftLeft = odom.vertical_offset_from_nearest_coordinate - shiftNum * normalHeight;
   }
   新版库没有这个情况*/
  else if (
      odom.current_row === 1 && odom.theoretical_moving_direction.toString() === SpecificActionsEnum['SA_ODOM_DOWN_GROUND_AS_REFERENCE'].toString()
  ) {
    // 2-1. 倒数第二行，特殊高度。// 下降列
    rowSmall = smallRowNum - 3;

    shiftNum = Math.floor(odom.vertical_offset_from_nearest_coordinate / specialHeight);
    shiftLeft = odom.vertical_offset_from_nearest_coordinate - shiftNum * specialHeight;

  } else if (
      odom.current_row === 0
  ) {
    // 2-2. 大格子里的倒数第一行。
    rowSmall = smallRowNum - 1;

    // 除了第一列 -- 上升列 都没有问题。
    if (odom.current_column === 0) {
      shiftNum = 0;
      if (
          odom.theoretical_moving_direction.toString() === SpecificActionsEnum['SA_ODOM_UP_GROUND_AS_REFERENCE'].toString() &&
          !odom.turning
      ) {
        shiftLeft = odom.vertical_offset_from_nearest_coordinate;
      } else {
        shiftLeft = odom.horizontal_offset_from_nearest_coordinate;
      }
    } else {
      // console.info('****************位置报告应该是row = 0');
      // console.info('action', SpecificActionsEnum);
      // console.info('turning', odom.turning);
      // console.info('&&&&&&&&&&&&&&&&&&&&&&判断方向', odom.theoretical_moving_direction.toString() === SpecificActionsEnum['SA_ODOM_BACKWARD_GROUND_AS_REFERENCE'].toString());
      if (
          odom.theoretical_moving_direction.toString() === SpecificActionsEnum['SA_ODOM_BACKWARD_GROUND_AS_REFERENCE'].toString() &&
          !odom.turning
      ) {
        // 考虑底部特殊宽度， 底部没有对称的特殊长度
        if (odom.current_column === 2) {
          shiftNum = Math.floor(odom.horizontal_offset_from_nearest_coordinate / specialBottomPart);
          colSmall -= shiftNum;
          shiftLeft = odom.horizontal_offset_from_nearest_coordinate - shiftNum * specialBottomPart;
        } else if (odom.current_column === usedColNum - 1) {
          // 如果是下降列，特殊宽度
          shiftNum = Math.floor(odom.horizontal_offset_from_nearest_coordinate / doubleBottomPart);
          colSmall -= shiftNum;
          shiftLeft = odom.horizontal_offset_from_nearest_coordinate - shiftNum * doubleBottomPart;
        } else {

          shiftNum = Math.floor(odom.horizontal_offset_from_nearest_coordinate / normalWidth);
          colSmall -= shiftNum;
          shiftLeft = odom.horizontal_offset_from_nearest_coordinate - shiftNum * normalWidth;
          // console.info('****************位置报告应该是0，1');
          // console.info(shiftNum, colSmall, shiftLeft);
        }
      } else {
        // 这种情况就是正在转弯的。
        //console.info('正在转弯');
        shiftLeft = odom.vertical_offset_from_nearest_coordinate;
      }
    }
  } else {
    // 3. 中间部分，odom.current_row 范围是 2 - 6，中间货位部分。
    rowSmall = specialHeightStartRow - 1 - (odom.current_row - 1) * divideCell;

    // 上升列、下降列，包含S形弯道部分。
    if (
        (odom.current_column === 0) &&
        (odom.current_row === SDownPartBigRow )
    ) {
      shiftNum = Math.floor(odom.vertical_offset_from_nearest_coordinate / SDownPart);
      rowSmall -= shiftNum - 1;
      shiftLeft = odom.vertical_offset_from_nearest_coordinate - (shiftNum) * SDownPart;
    } else if (
        (odom.current_column === 0) &&
        (odom.current_row === SUPPartBigRow)
    ) {
      shiftNum = Math.floor(odom.vertical_offset_from_nearest_coordinate / SUPPart);
      rowSmall -= shiftNum - 1;
      shiftLeft = odom.vertical_offset_from_nearest_coordinate - shiftNum * SUPPart;
    } else if (
        (odom.current_column === usedColNum - 1) &&
        (odom.current_row === SUPPartBigRow + 1)
    ) {
      shiftNum = Math.floor(odom.vertical_offset_from_nearest_coordinate / SUPPart);
      rowSmall += shiftNum;
      shiftLeft = odom.vertical_offset_from_nearest_coordinate - shiftNum * SUPPart;
    } else if (
        (odom.current_column === usedColNum - 1) &&
        (odom.current_row === SDownPartBigRow + 1)
    ) {
      shiftNum = Math.floor(odom.vertical_offset_from_nearest_coordinate / SDownPart);
      rowSmall += shiftNum;
      shiftLeft = odom.vertical_offset_from_nearest_coordinate - shiftNum * SDownPart;

      /****************************以上是 S形弯道特殊考虑的部分。*/

    } else if (odom.current_column === 0) {
      // 第一列剩下的
      shiftNum = Math.floor(odom.vertical_offset_from_nearest_coordinate / normalHeight);
      rowSmall -= shiftNum;
      shiftLeft = odom.vertical_offset_from_nearest_coordinate - shiftNum * normalHeight;
    } else if (odom.current_column === usedColNum - 1) {
      // 最后一列剩下的
      shiftNum = Math.floor(odom.vertical_offset_from_nearest_coordinate / normalHeight);
      rowSmall += shiftNum;
      shiftLeft = odom.vertical_offset_from_nearest_coordinate - shiftNum * normalHeight;
    } else {
      // 剩下的就是 66.83 的
      shiftNum = Math.floor(odom.vertical_offset_from_nearest_coordinate / normalHeight);

      if (odom.theoretical_moving_direction.toString() === SpecificActionsEnum['SA_ODOM_UP_GROUND_AS_REFERENCE'].toString()) {
        // 考虑的就是向上运动的位置报告的转换。如果是中间货位，但是位置报告运动方向是向上的。
        rowSmall -= shiftNum + 1;
        shiftLeft = (shiftNum + 1) * normalHeight - odom.vertical_offset_from_nearest_coordinate; // 这种行为是由于向上运动的位置报告有区别。
      } else {
        rowSmall += shiftNum;
        shiftLeft = odom.vertical_offset_from_nearest_coordinate - shiftNum * normalHeight;
      }
    }
  } // 中间部分结束。

  return {
    rowSmall: rowSmall,
    colSmall: colSmall,
    shiftLeft: shiftLeft,
  };
  //console.log('rowSmall: ', rowSmall, 'colSmall: ', colSmall, 'shiftLeft: ', shiftLeft)
};

// 判断是否能够向上行走
const checkGoUp = function (optIndex, goalRow, goalCol, goalTable, shuttle, targetPosition) {
  // 目标不是中间货位，不需要上升拣货
  if (goalCol < firstGoDownCol || goalCol > lastGoDownCol) {
    return false;
  }

  const currentRow = goalTable[optIndex][0][0];
  const currentCol = goalTable[optIndex][0][1]; // 选中的小车的小格子行列数

  // 2. goaltable里的第一个值是小车起点。判断
  //    2-1. 小车当前的位置 和 目标的位置是同一列，
  //    2-2. 且中间没有其他小车，这个时候是认为能够向上走了

  if (currentCol === goalCol && currentRow > goalRow) {
    // 2-1. 小车当前的位置 和 目标的位置是同一列，&& 当前小车的位置在目标位置的下方。
    // 首先判断一下电量

    if (!hasEnoughPowerGoUpTraget(shuttle, targetPosition)) {
      // false means cannot to goingup. 返回的是false就是电源管理没开，或者现有的电量不能满足消耗。
      return false;
    }

    for (let i = 0; i < goalTable.length; i += 1) {
      if (i === optIndex) {
        continue; // 如果是当前的小车，继续
      }
      let obRow = goalTable[i][0][0]; // 循环中的小车的小格子行数
      let obCol = goalTable[i][0][1]; // 循环中的小车的小格子列数
      if (
          obCol >= currentCol - divideCell && obCol <= currentCol + divideCell &&
          obRow <= currentRow && obRow >= goalRow - upRowFromGoalRow
      ) {
        // 如果是和当前的小车相邻(相邻两行col相差4小格一大格) && 在小车和目标行之间。那就不能够向上走。保护的行数是4行。goalRow还要往上7小行。这个容忍的行数还是低了，设为 14行。
        return false;
      }

      // 如果目标是顶部两行的货箱，还要考虑顶部一行左侧一部分的小车，8小格
      if (
          goalRow <= 2 * divideCell &&
          obCol >= goalCol - upColFromGoalCol && obCol <= goalCol &&
          obRow <= goalRow
      ) {
        return false;
      }
    } // end of for loop
    return true; // 如果for循环下来没有 false，就判断能够向上走。
  } else {
    // 小车当前的位置 和 目标的位置不是同一列，直接就 return false
    return false;
  }
};

export const findIdleUidOb = async function (optIndex, path) {
  // optIndex 是被挡住的小车 index
  // path 是一个二维数组，一串点组成的 path

  // 如果还有任务，就不存在有挡路的空闲小车
  const _haveTask = false; // 现在直接是 false
  // const _haveTask = await haveTask();


  if (!goalTable[optIndex]) {
    if (showDispatchLog) console.warn('goalTable[optIndex] undefined，没有找到空闲挡路小车');
    return null;
  }// 删车的时候会 goalTable[optIndex] undefined

  const lastIndex = path.length - 1;
  const lastPoint = path[lastIndex]; // [row, col]
  const lastPointRow = lastPoint[0];
  const lastPointCol = lastPoint[1];

  // 根据当前因为避障需要停的小车的位置，找到前方挡路的小车uid
  // let curRow = goalTable[optIndex][0][0]; // 小车当前位置。
  // let curCol = goalTable[optIndex][0][1];
  let curRow = lastPointRow;
  let curCol = lastPointCol;
  let targetIndex;

  //分情况： 1. 堵在了上升列。2. 堵在了中间货位。3. 堵在了最底下一行，或者是接近最底下一行
  if (curCol < firstGoDownCol && curRow >= 0) {
    // 1. 堵在了上升列，那么前面的小车就是在第一个拣货位的
    if (showDispatchLog) console.warn('1. 堵在了上升列，那么前面的小车就是在第一个拣货位的');
    targetIndex = trackById.findIndex((ele, index) => {
      if (index === optIndex) {
        return false;
      } else {
        let bool = false;
        for (let iRow = 0; iRow <= 1 + 2 * occupyRowConfig; iRow += 1) {
          for (let i = curCol + occupyColConfig; i <= curCol + 2 * occupyColConfig; i += 1) {
            // 往前看 occupyColConfig 步数。
            bool = bool || ele[iRow][i] === 1;
            if (bool) {
              return true;
            }
          }
        }
        return bool;
      }
    });

    // targetIndex 可能是负数
    if (targetIndex === -1) {
      if (showDispatchLog) console.warn('target index is -1');
      return null;
    } else {
      let optUid = uidArr[targetIndex];
      const arrive = reachGoal[targetIndex];
      const curSpeedRPM = shuttles[optUid].curSpeedRPM; // 小车当前速度

      if (!shuttles[optUid].consumeJobPause && _haveTask) {
        if (showDispatchLog) console.warn('挡路小车还有任务，且没有取消接收任务，uid', optUid);
        return null;
      }

      if (shuttles[optUid].status === 0 && arrive) {
        // 如果这个小车是空闲的
        if (showDispatchLog) console.warn('到前方挡路的小车,空闲，status：', shuttles[optUid].status, 'arrive:', arrive, 'curSpeedRPM:', curSpeedRPM);
        return optUid; // 返回一个 uid
      } else {
        if (showDispatchLog) console.warn('到前方挡路的小车，但不是空闲，status：', shuttles[optUid].status, 'arrive:', arrive, 'curSpeedRPM:', curSpeedRPM);
        let topFirst = findFirstShuttleTopRowParking(console);
        if (topFirst) {
          return topFirst;
        }
        return null; // 不是空闲，返回 null
      }
    }
  } else if (
      curCol >= firstGoDownCol && curCol <= lastGoDownPickCol && curRow <= rowNum - 2 - occupyRowConfig
  ) {
    // 2. 堵在了中间货位。这里是开始往下找挡路的且空闲的小车
    if (showDispatchLog) console.warn('2. 堵在了中间货位。这里是开始往下找挡路的且空闲的小车');
    targetIndex = trackById.findIndex((ele, index) => {
      if (index === optIndex) {
        return false;
      } else {
        let bool = false;
        for (let iRow = curRow; iRow <= curRow + 1 + 2 * occupyRowConfig; iRow += 1) {
          for (let iCol = curCol; iCol <= curCol + occupyColConfig - 1; iCol += 1) {
            if (!ele[iRow]) {
              continue; // 如果是 undefined，就 continue。
            }
            bool = bool || ele[iRow][iCol] === 1;
            if (bool) {
              return true;
            }
          }
        }
        return bool;
      }
    });

    // targetIndex 可能是负数
    if (targetIndex === -1) {
      if (showDispatchLog) console.warn('target index is -1');
      return null;
    } else {
      let optUid = uidArr[targetIndex];

      if (goalTable[targetIndex][0][0] === 0 && !checkFirstIdleGo()) {
        if (showDispatchLog) console.warn('如果前面的小车在顶部一行，并且中间没有拣货的小车就不被挤走，checkFirstIdleGo：', checkFirstIdleGo());
        return null; // 如果前面的小车在顶部一行，并且中间没有拣货的小车就不被挤走，null。 加了 checkShutdownStartGoDown 是因为有可能上面有小车是需要让路。
      }

      const total_teeth_from_origin = odomArr[targetIndex].total_teeth_from_origin;
      const total_teeth = teethAndActionArr[targetIndex].total_teeth;
      const arrive = reachGoal[targetIndex];
      const curSpeedRPM = shuttles[optUid].curSpeedRPM; // 小车当前速度

      if (!shuttles[optUid].consumeJobPause && _haveTask) {
        if (showDispatchLog) console.warn('挡路小车还有任务，且没有取消接收任务，uid', optUid);
        return null;
      }

      if (shuttles[optUid].status === 0 && arrive) {
        // 如果这个小车是空闲的
        if (showDispatchLog) console.warn('到前方挡路的小车,空闲，status：', shuttles[optUid].status, 'arrive:', arrive, 'curSpeedRPM:', curSpeedRPM);
        return optUid; // 返回一个 uid
      } else {
        if (showDispatchLog) console.warn('到前方挡路的小车，但不是空闲，status：', shuttles[optUid].status, 'arrive:', arrive, 'curSpeedRPM:', curSpeedRPM);
        if (curRow === 0) {
          // 如果是堵在顶部一行。
          let topFirst = findFirstShuttleTopRowParking(console);
          if (topFirst) {
            return topFirst;
          }
        }
        return null; // 不是空闲，返回 null
      }
    }

  } else if (
      curRow >= rowNum - 3 - occupyRowConfig &&
      curCol >= 8
  ) {
    // 3. 堵在了最底下一行，或者是接近最底下一行。
    if (showDispatchLog) console.warn('2. 堵在了最底下一行，或者是接近最底下一行。');
    targetIndex = trackById.findIndex((ele, index) => {
      if (index === optIndex) {
        return false;
      } else {
        let bool = false;

        // 往前看 occupyColConfig 步数。
        for (let iRow = rowNum - 3; iRow >= rowNum - 3 - occupyRowConfig; iRow -= 1) {
          for (let iCol = curCol - 1; iCol >= curCol - 1 - 2 * occupyColConfig; iCol -= 1) {
            bool = bool || ele[iRow][iCol] === 1;
            if (bool) {
              return true;
            }
          }
        }
        return bool;
      }
    });

    // targetIndex 可能是负数
    if (targetIndex === -1) {
      if (showDispatchLog) console.warn('target index is -1');
      return null;
    } else {
      let optUid = uidArr[targetIndex];

      if (goalTable[targetIndex][0][0] === rowNum - 1 && !checkFirstIdleGo()) {
        if (showDispatchLog) console.warn('如果前面的小车在底部一行，并且中间没有拣货的小车就不被挤走，checkFirstIdleGo：', checkFirstIdleGo());
        return null; // 如果前面的小车在最底一行，并且中间没有拣货的小车就不被挤走，null。 加了 checkShutdownStartGoDown 是因为有可能上面有小车是需要拣货下来。
      }

      const total_teeth_from_origin = odomArr[targetIndex].total_teeth_from_origin;
      const total_teeth = teethAndActionArr[targetIndex].total_teeth;
      const arrive = reachGoal[targetIndex];
      const curSpeedRPM = shuttles[optUid].curSpeedRPM; // 小车当前速度

      if (!shuttles[optUid].consumeJobPause && _haveTask) {
        if (showDispatchLog) console.warn('挡路小车还有任务，且没有取消接收任务，uid', optUid);
        return null;
      }

      if (shuttles[optUid].status === 0 && arrive) {
        // 如果这个小车是空闲的
        if (showDispatchLog) console.warn('到前方挡路的小车,空闲，status：', shuttles[optUid].status, 'arrive:', arrive, 'curSpeedRPM:', curSpeedRPM);
        return optUid; // 返回一个 uid
      } else {
        if (showDispatchLog) console.warn('到前方挡路的小车，但不是空闲，status：', shuttles[optUid].status, 'arrive:', arrive, 'curSpeedRPM:', curSpeedRPM);
        return null; // 不是空闲，返回 null
      }
    }

  } else {
    if (showDispatchLog) console.warn('没有考虑到的情况，小车当前位置：', 'curRow', curRow, 'curCol', curCol);
    return null;
  }

};

// 找到顶部的停靠的小车，空闲的
const findFirstShuttleTopRowParking = function (LOGGER) {
  let targetIndex;
  targetIndex = goalTable.findIndex((ele, index) => {
    let bool = false;
    let goalRow = ele[1][0];
    let goalCol = ele[1][1];
    let arrive = reachGoal[index]; // true or false

    bool = goalRow === preGoUpPoint[0] && goalCol === preGoUpPoint[1] && arrive; // 目标点是顶部的停靠点，并且是走到了。
    return bool;
  });

  if (targetIndex === -1) {
    if (showDispatchLog) LOGGER.warn('顶部停靠的小车 target index is -1');
    return null;
  } else {
    let optUid = uidArr[targetIndex];
    if (!checkFirstIdleGo()) {
      if (showDispatchLog) LOGGER.warn('没有有别的小车有拣货任务', checkFirstIdleGo());
      return null; // 没有有别的小车有拣货任务，小车不动
    }
    if (showDispatchLog) LOGGER.warn('到前方挡路的小车,空闲，status：', shuttles[optUid].status);
    return optUid; // 返回一个 uid
  }
};

// 判断底部空闲的小车能不能被挤走，true就是能够走，false就是不能走。其实是判断小车的目标在中间的货位，如果是true意味着能够走了。
export const checkFirstIdleGo = function () {
  if (firstIdleCanGoFlag) {
    return true;
  }

  for (let i = 0; i <= uidArr.length - 1; i += 1) {
    let curRow = goalTable[i][1][0]; // 终点的行数，当前点的行数
    let curCol = goalTable[i][1][1]; // 终点的列数，当前点的列数

    if (curRow !== rowNum - 1 && curRow !== 0) {
      return true; // 如果有小车目标点是除了顶部的停靠点、底部停靠点，是其他地方（中间货位、左右两边的拣货台），就能让路
    }
  }
  // console.info('@@@@@@@@@@@@@@@@@@@@判断可以开始关机第二阶段');
  return false;
};

export const firstIdleCanGo = function () {
  firstIdleCanGoFlag = true;
};

export const findIndexByUid = function (uid) {
  let targetIndex = uidArr.findIndex((ele) => {
    return ele === uid;
  });
  return targetIndex;
};

export const findParkingGoal = function (optIndex) {

  let goalRow, goalCol;
  let _parkingGoalTable = JSON.parse(JSON.stringify(parkingGoalTable));

  // 1. 根据goalTable得到 goalShuttleNumArr （每一列包含有多少小车的终点）
  let goalShuttleNumArr = Array(boxColNum).fill(0); // 每一列包含有多少小车的终点
  for (let i = 0; i < goalTable.length; i += 1) {
    if (i === optIndex) {
      // continue; // 如果是当前的小车，跳过，继续循环. 这里可以考虑不跳过当前的小车。
    }

    let curGoalRow = goalTable[i][1][0]; // 终点的行数
    let curGoalCol = goalTable[i][1][1]; // 终点的列数

    // 如果终点不是在中间货位，那就没有必要更新。
    if (
        curGoalCol < firstGoDownCol || curGoalCol > lastGoDownCol
    ) {
      continue;
    }

    // 对应大格子里的列数、索引
    let bigCellCol = (curGoalCol - firstGoDownCol) / divideCell; // 第一列就是对应0，这个也是没错
    let goalShuttleNum = goalShuttleNumArr[bigCellCol];
    goalShuttleNumArr[bigCellCol] = goalShuttleNum + 1; // 在原来的基础上加 1。每一列有多少辆车。


    // 对应大格子里的行数、索引
    let bigCellRow = Math.ceil(curGoalRow / divideCell); // 第一列就是对应0，这个也是没错
    for (let iParking = 0; iParking < _parkingGoalTable.length; iParking += 1) {
      let singleRow = _parkingGoalTable[iParking];
      if (bigCellRow === singleRow[bigCellCol]) {
        // 就是说，列数和停车位的行列数相等。就改为 -1
        _parkingGoalTable[iParking][bigCellCol] = -1;
      }
    }
  }
  // goalShuttleNumArr 准备好了。中间行每一列有多少小车是目标，目标分布知道了。
  // 直接现在就是能够 得出goalCol了，大格子行列数。

  let minCol = goalShuttleNumArr[0];
  let minColIndex = 0;
  // console.log(goalShuttleNumArr);
  for (let i = 0; i < goalShuttleNumArr.length; i += 2) {
    if (goalShuttleNumArr[i] <= minCol) {
      minCol = goalShuttleNumArr[i];
      minColIndex = i;
    }
  }
  // console.log(minCol, minColIndex);

  goalCol = goalCol = firstGoDownCol / divideCell + minColIndex;
  // if (goalCol % 2 !== 0) {
  //   goalCol += 1;
  // } // goalCol 已经确定了。


  // 2. 确定行数，如果是有最小数目的列数的小车，都把parkingGoalTable里的能够停的位置都占了，那么，车的总数量肯定是超过 10 台了，这是不可能的。
  // 行数不可能是都变成 -1 了，没有这么多车。
  for (let iParking = _parkingGoalTable.length - 1; iParking >= 0; iParking -= 1) {
    let singleRow = _parkingGoalTable[iParking];
    if (singleRow[goalCol] !== -1) {
      goalRow = singleRow[goalCol];
      return [goalRow, goalCol];
    }
  }

  console.warn('something wrong!!!!!!!! goalCol:', goalCol, '_parkingGoalTable:', _parkingGoalTable);
};
