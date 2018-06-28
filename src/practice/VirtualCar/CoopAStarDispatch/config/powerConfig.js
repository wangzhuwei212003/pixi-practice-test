const exports = {
  powerManagementOn: true,
  singleStorage: 600, // 单个电容容量
  capacitorAmount: 22,
  shuttleWeight: 53.5, // KG
  cargoBoxWight: 4.7, // KG
  maxLoadWeight: 30, // KG
  safeFactor: 1.8, // 安全系数
  transferEfficiency: 0.55, // 能量转换效率
  safeVoltage: 44.2,
  get cap() {
    return this.singleStorage / this.capacitorAmount;
  },
};

export default exports;
