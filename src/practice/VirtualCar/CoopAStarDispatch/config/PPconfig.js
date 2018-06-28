import config from './config.js';

const exports = {
  // -1表示该位置没有货框,其他数字表示货框在AB面示意图中的索引位置
  // -2表示图像不显示这个格子
  mainShelfMap: [
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, 35, 36, 37, 38, 39, 40, 41, -1, -1],
    [-1, -1, 28, 29, 30, 31, 32, 33, 34, -1, -1],
    [-1, -1, 21, 22, 23, 24, 25, 26, 27, -1, -1],
    [-1, -1, 14, 15, 16, 17, 18, 19, 20, -1, -1],
    [-1, -1, 7,  8,  9,  10, 11, 12, 13, -1, -1],
    [-1, -1, 0,  1,  2,  3,  4,  5,  6,  -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  ],
  // mainShelfMap: [
  //   [ -1, -1, -1, -1, -1, -1, -1, -1, -1 ],// 实际中的最上面一行
  //   [ -1, -1, 25, 26, 27, 28, 29, -1, -1 ],
  //   [ -1, -1, 20, 21, 22, 23, 24, -1, -1 ],
  //   [ -1, -1, 15, 16, 17, 18, 19, -1, -1 ],
  //   [ -1, -1, 10, 11, 12, 13, 14, -1, -1 ],
  //   [ -1, -1,  5,  6,  7,  8,  9, -1, -1 ],
  //   [ -1, -1,  0,  1,  2,  3,  4, -1, -1 ],
  //   [ -1, -1, -1, -1, -1, -1, -1, -1, -1 ], // 实际中的位置最下面一行(第0行)
  // ],

  get validCargoBoxesMap() {
    const temp = this.mainShelfMap.map((row) => {
      const resRow = row.filter((ele) => {
        return ele >= 0;
      });

      return resRow;
    });

    return temp.filter((row) => {
      return row.length > 0;
    });
  },
  get totalRow() {
    return this.mainShelfMap.length;
  },
  get totalColumn() {
    return this.mainShelfMap[0].length;
  },
  get row() {
    return this.validCargoBoxesMap.length;
  },
  get column() {
    return this.validCargoBoxesMap[0].length;
  },

  shuttleActionType: {
    fetch: 'FETCH',
    fill: 'FIll',
  },
  // cargo box side
  sideA: 'A', // sideA and sideB must have the same length
  sideB: 'B',
  // 两侧拣货站的标志
  // pickSites 数量改变, dispatchConfig 文件需要改变 pickSitesPosition, , this.pickSitesComdDirection需要改变
  pickSites: {
    pickSiteA: 'SiteA',
    // pickSiteB: 'SiteB',
  },
  systemId: config.systemId, // 前后端代码均可使用
  init: function () {
    this.productQueueName = 'product-queue-' + this.systemId;
    if (process.env.NODE_ENV === 'test') {
      this.productQueueName = 'test-' + this.productQueueName;
    }

    this.pickSitesComdDirection = {
      [this.sideA]: '00',
      [this.sideB]: '01',
      // [this.pickSites.pickSiteB]: '01',
    };

    this.pickSiteName = this.pickSites.pickSiteA; //仅限后端测试代码使用

    return this;
  }
}.init();

export default exports;
