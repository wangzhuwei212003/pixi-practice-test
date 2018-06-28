/**
 * Created by zhuweiwang on 02/04/2018.
 *
 * 天时科技园 8行13列
 */
import PPconfig from  "./PPconfig";

const exports = {
  // 寻路算法相关
  timeGap: 1000,
  validSpeedDuration: 110, // 每次发速度的有效执行时间。
  avoidDist: 50, // 单位：齿
  extraNumInDeadLock: 4, // 一圈里能够放下多少辆车。理论值减去一个调整的值。

  searchDeepth: 20,
  // 时间
  delayGap: 4, // 考虑 3.5 * timeGap 毫秒的最高速前进，实际测试3还是太小了。7 这个距离只在直线上有效。

  divideCell: 4, // 一大格分4个格子
  rowNum: 27, // 整个地图转换成寻路的地图，27行36列。注意的一点是，上升列是左边第 0 列。
  lookUpRowNum: 6, // 上升列往上检查有没有小车的方法。
  usedRowNum: 8, // 原来的大格子行列数，不含0
  usedColNum: 13,
  smallRowNum: 27,

  get colNum() {
    return 13 * this.divideCell; // 52,
  },
  get smallColNum() {
    return 13 * this.divideCell; // 小格子的总行列数
  },
  // 特殊行列数。CalcPriority 用到
  get firstGoDownCol() {
    return 2 * this.divideCell;  // 开始下降的第一列列数
  },
  get lastGoDownCol() {
    return this.colNum - 3 * this.divideCell; //开始下降的有货位的最后一列列数
  },
  get lastGoDownPickCol() {
    return this.colNum - this.divideCell; // 下降列拣货台的列数
  },

  // calcTeeth 用到
  h2vUpPinOutStretchCell: 2, // 水平转为上升列，这里需要在前两格伸pin
  h2vDownSpecialPinOutStretchCell: 3, // 调整第一列下降时 伸pin 的位置 3小格
  h2vDownNormalPinOutStretchCell: 2, // 水平转为上升列，这里需要在前两格伸pin
  // cellToTooth 用到
  specialTopStartCellCol: 4, // 从第 4 列开始是顶部特殊长度，包含第 4 列。
  topBoxNormalHeightStartRow: 1,
  topBoxNormalHeightEndRow: 4, // 最上面一行货位的高度是 60.23, 起始行、结束行

  // checkGoUp 用到
  upRowFromGoalRow: 14, // 向上取货的时候，向货位向上检测多少行。
  upColFromGoalCol: 8, // 如果目标是顶部两行的货箱，还要考虑顶部一行左侧一部分的小车，8小格

  get specialBtmStartCellCol() {
    return this.colNum - 2 * this.divideCell; //colNum - 8, // 底部特殊长度，包含第 colNum - 8 列。
  },
  get SDownPartStartRow() {
    return this.rowNum - 6; // S形弯道下部分
  },
  get SDownPartEndRow() {
    return this.rowNum - 3; // S形弯道下部分
  },
  get SUPPartStartRow() {
    return this.rowNum - 10; //rowNum - 14, S形弯道上部分
  },
  get SUPPartEndRow() {
    return this.rowNum - 7; //rowNum - 11, S形弯道上部分
  },
  get specialHeightStartRow() {
    return this.rowNum - 2; //rowNum - 2, 底部特殊高度一行
  },
  get specialHeightEndRow() {
    return this.rowNum - 2; //rowNum - 2, 底部特殊高度一行
  },

  // heuristic 相关，以及 HCCoopFinder 相关。
  // 中间部分箱子行数、列数
  get boxRowNum() {
    return this.usedRowNum - 2; //rowNum - 2, 底部特殊高度一行
  },
  get boxColNum() {
    return this.usedColNum - 4; //rowNum - 2, 底部特殊高度一行
  },

  //相对于左下角的轮子为基准，小车占位行列数。
  occupyRowConfig: 6, // 6 不能再小了。
  occupyColConfig: 7, // 实际每列划分为4格，避免相邻列，使用5列。至少是5列，考虑相邻列，最多可为8
  occupyRowConfigUnload: 4, // 没有箱子的占位，暂定是小格子3行

  get crossRoadoccupyRowConfig() {
    return this.occupyRowConfig + this.occupyRowConfigUnload;
  },

  // 计算齿数
  toothMilliMeter: 6.2832, // 一个齿的宽度，单位毫米
  safeGap: 20, // 顶部箱子和顶部横向运动小车的底部距离，单位毫米

  normalWidth: 23, //水平方向一格的宽度 92/4
  normalHeight: 16.5, // 一般货位高度是 66/4
  normalHeightBIG: 66, // 一般货位高度是 66
  topBoxNormalHeight: 52.432516 / 4, // 最上面一行货位的高度是 52.432516/4
  specialHeight: 13.567484, // 底部特殊高度，13.567484
  compensate: 25, // 方向改变的时候，齿数补偿，25 + 90度 同一个库里所有车同一个齿数

  specialBottomPart: 144 / 4, // 底部的特殊部分
  doubleBottomPart: 2 * 92 / 4, // 下降列底部的特殊部分是两个正常的宽度。
  specialTopPart: 52 / 4, // 顶部的特殊部分

  SUPPart: 76.567484 / 4, // S形弯道上部分齿数
  SDownPart: 112.432516 / 4, // S形弯道下部分齿数
  // 拣货台所占的大格子行数
  SUPPartBigRow: 2, // S形弯道上部分占的行数，这里是大格子的行数
  SDownPartBigRow: 1, // S形弯道下部分占的行数，这里是大格子的行数

  slowPassGate: 30, // 上一个动作是缩pin，或者是方向发生改变，再过一段才完全过活门。这个值，让小车完全慢速的过完活门。

  // 起点行列数
  startROW: 26, // 只能是最底下一行，heuristic里面默认
  startCOL: 4,
  startOdom: {
    totoal_count_from_origin: 0,
    total_teeth_from_origin: 0,
    horizontal_offset_from_nearest_coordinate: 0,
    vertical_offset_from_nearest_coordinate: 0,
    theoretical_moving_direction: 3,
    current_row: 0,
    current_column: 1,
    turning: false
  },

  // 测试用 中间10号货位 odom
  midROW: 16, // 只能是最底下一行，heuristic里面默认
  midCOL: 8,
  midOdom: {
    totoal_count_from_origin: 0,
    total_teeth_from_origin: 0,
    horizontal_offset_from_nearest_coordinate: 0,
    vertical_offset_from_nearest_coordinate: 21,
    theoretical_moving_direction: 5, // moving down
    current_row: 3,
    current_column: 2,
    turning: false
  },


  pickSitesPosition: {
    [PPconfig.pickSites.pickSiteA]: [24, 0], // 第一个值关联pickSitesSmallRow的值
    [PPconfig.pickSites.pickSiteB]: [24, 52 - 4],
  },
  pickSitesPositionShift: {
    [PPconfig.pickSites.pickSiteA]: 8, // 第一个值关联pickSitesSmallRow的值
    [PPconfig.pickSites.pickSiteB]: - 8 - 112.432516 / 4,
  },
  pickStationRow: 24, // 拣货台所在行的index，这个是根据测试调好的。

  pickSitesSmallRow: 24, //回拣货台，上升列开始进入S行弯道的行数
  get pickSitesRowGap() {
    return 2 * this.divideCell; // S形弯道 占有的小格子行数
  },

  // 开机、关机相关
  get preGoUpPoint() {
    return [0, this.colNum - 10]; //顶部停靠的列数，顶部差两格需要开始伸pin 应巨刚要求，往前一小格。
  },
  get GoDownPoint() {
    return [this.rowNum - 1, this.divideCell + 6]; // 原点前6小格，即是1.5大格。
  },

  priorityArray:[[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75],[23,24,25,26,27,28,29,30,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,66,67,68,69,70,71,72,73,74,75,76],[22,23,24,25,26,27,28,29,137,136,135,134,133,132,131,130,129,128,127,126,125,124,123,122,121,120,119,118,117,116,115,114,113,112,111,110,109,108,107,106,105,67,68,69,70,71,72,73,74,75,76,77],[21,22,23,24,25,26,27,28,177,176,175,174,173,172,171,170,169,168,167,166,165,164,163,162,161,160,159,158,157,156,155,154,153,152,151,150,149,148,147,146,145,68,69,70,71,72,73,74,75,76,77,78],[20,21,22,23,24,25,26,27,217,216,215,214,213,212,211,210,209,208,207,206,205,204,203,202,201,200,199,198,197,196,195,194,193,192,191,190,189,188,187,186,185,69,70,71,72,73,74,75,76,77,78,79],[19,20,21,22,23,24,25,26,257,256,255,254,253,252,251,250,249,248,247,246,245,244,243,242,241,240,239,238,237,236,235,234,233,232,231,230,229,228,227,226,225,70,71,72,73,74,75,76,77,78,79,80],[18,19,20,21,22,23,24,25,297,296,295,294,293,292,291,290,289,288,287,286,285,284,283,282,281,280,279,278,277,276,275,274,273,272,271,270,269,268,267,266,265,71,72,73,74,75,76,77,78,79,80,81],[17,18,19,20,21,22,23,24,337,336,335,334,333,332,331,330,329,328,327,326,325,324,323,322,321,320,319,318,317,316,315,314,313,312,311,310,309,308,307,306,305,72,73,74,75,76,77,78,79,80,81,82],[16,17,18,19,20,21,22,23,377,376,375,374,373,372,371,370,369,368,367,366,365,364,363,362,361,360,359,358,357,356,355,354,353,352,351,350,349,348,347,346,345,73,74,75,76,77,78,79,80,81,82,83],[15,16,17,18,19,20,21,22,417,416,415,414,413,412,411,410,409,408,407,406,405,404,403,402,401,400,399,398,397,396,395,394,393,392,391,390,389,388,387,386,385,74,75,76,77,78,79,80,81,82,83,84],[14,15,16,17,18,19,20,21,457,456,455,454,453,452,451,450,449,448,447,446,445,444,443,442,441,440,439,438,437,436,435,434,433,432,431,430,429,428,427,426,425,75,76,77,78,79,80,81,82,83,84,85],[13,14,15,16,17,18,19,20,497,496,495,494,493,492,491,490,489,488,487,486,485,484,483,482,481,480,479,478,477,476,475,474,473,472,471,470,469,468,467,466,465,76,77,78,79,80,81,82,83,84,85,86],[12,13,14,15,16,17,18,19,537,536,535,534,533,532,531,530,529,528,527,526,525,524,523,522,521,520,519,518,517,516,515,514,513,512,511,510,509,508,507,506,505,77,78,79,80,81,82,83,84,85,86,87],[11,12,13,14,15,16,17,18,577,576,575,574,573,572,571,570,569,568,567,566,565,564,563,562,561,560,559,558,557,556,555,554,553,552,551,550,549,548,547,546,545,78,79,80,81,82,83,84,85,86,87,88],[10,11,12,13,14,15,16,17,617,616,615,614,613,612,611,610,609,608,607,606,605,604,603,602,601,600,599,598,597,596,595,594,593,592,591,590,589,588,587,586,585,79,80,81,82,83,84,85,86,87,88,89],[9,10,11,12,13,14,15,16,657,656,655,654,653,652,651,650,649,648,647,646,645,644,643,642,641,640,639,638,637,636,635,634,633,632,631,630,629,628,627,626,625,80,81,82,83,84,85,86,87,88,89,90],[8,9,10,11,12,13,14,15,805,0,0,0,801,0,0,0,797,0,0,0,793,0,0,0,789,0,0,0,785,0,0,0,781,0,0,0,777,0,0,0,773,0,0,0,769,0,0,0,761,0,0,0],[7,8,9,10,11,12,13,14,805,0,0,0,801,0,0,0,797,0,0,0,793,0,0,0,789,0,0,0,785,0,0,0,781,0,0,0,777,0,0,0,773,0,0,0,769,0,0,0,762,0,0,0],[6,7,8,9,10,11,12,13,805,0,0,0,801,0,0,0,797,0,0,0,793,0,0,0,789,0,0,0,785,0,0,0,781,0,0,0,777,0,0,0,773,0,0,0,769,0,0,0,763,0,0,0],[5,6,7,8,9,10,11,12,805,0,0,0,801,0,0,0,797,0,0,0,793,0,0,0,789,0,0,0,785,0,0,0,781,0,0,0,777,0,0,0,773,0,0,0,769,0,0,0,764,0,0,0],[4,5,6,7,8,9,10,11,805,0,0,0,801,0,0,0,797,0,0,0,793,0,0,0,789,0,0,0,785,0,0,0,781,0,0,0,777,0,0,0,773,0,0,0,769,0,0,0,765,0,0,0],[3,4,5,6,7,8,9,10,811,0,0,0,807,0,0,0,803,0,0,0,799,0,0,0,795,0,0,0,791,0,0,0,787,0,0,0,783,0,0,0,779,0,0,0,775,0,0,0,766,0,0,0],[2,3,4,5,6,7,8,9,811,0,0,0,807,0,0,0,803,0,0,0,799,0,0,0,795,0,0,0,791,0,0,0,787,0,0,0,783,0,0,0,779,0,0,0,775,0,0,0,767,0,0,0],[1,2,3,4,5,6,7,8,811,0,0,0,807,0,0,0,803,0,0,0,799,0,0,0,795,0,0,0,791,0,0,0,787,0,0,0,783,0,0,0,779,0,0,0,775,0,0,0,768,0,0,0],[821,820,819,818,817,816,815,814,811,0,0,0,807,0,0,0,803,0,0,0,799,0,0,0,795,0,0,0,791,0,0,0,787,0,0,0,783,0,0,0,779,0,0,0,775,0,0,0,769,0,0,0],[820,819,818,817,816,815,814,813,811,0,0,0,807,0,0,0,803,0,0,0,799,0,0,0,795,0,0,0,791,0,0,0,787,0,0,0,783,0,0,0,779,0,0,0,775,0,0,0,770,0,0,0],[819,818,817,816,815,814,813,812,811,810,809,808,807,806,805,804,803,802,801,800,799,798,797,796,795,794,793,792,791,790,789,788,787,786,785,784,783,782,781,780,779,778,777,776,775,774,773,772,771,770,769,768]],

  // 大格子行数是从底部开始。从0开始。 非-1元素的值是行数。元素的index就是列数。
  parkingGoalTable: [
    [-1, -1, 6, -1, 6, -1, 6, -1, 6, -1, 6, -1, -1],
    [-1, -1, 4, -1, 4, -1, 4, -1, 4, -1, 4, -1, -1],
  ],
  // 有空闲小车需要分配新的空闲位置的时候：
  // 1. 找拥有目标位置最少的当前列。
  // 2. 找parkingGoalTable里不为-1，且其他小车没有被占用的空位，优先选择靠下的位置。
  //
};

export default exports;