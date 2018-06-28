import dispatchConfig from '../CoopAStarDispatch/config/dispatchConfig';
import powerConfig from '../CoopAStarDispatch/config/powerConfig';

import * as dispatch from '../CoopAStarDispatch/dispatch.js';

export function hasEnoughPowerGoUpTraget(shuttle, targetPosition) {
  // 电源管理功能是否打开
  if (!powerConfig.powerManagementOn) {
    return true; // 没开就是可以向上走。
  }

  if (!shuttle.neartestTargetInfo) {
    shuttle.splitLogger.error('shuttle neartestTargetInfo is null');
    return true;
  }

  // 目标不在同一列，不存在管理问题

  if (shuttle.curPosition[1] !== targetPosition[1]) {
    return true;
  }

  const curVoltageMainPower = shuttle.curVoltageMainPower; // 当前电压;
  const powerInStorage = 0.5 * powerConfig.cap * (curVoltageMainPower * curVoltageMainPower - powerConfig.safeVoltage * powerConfig.safeVoltage); // 超级电容中存储的能量  1/2*C*U*U
  const goUpHeightTooth = dispatch.calcGoingupTeeth(shuttle.uid, targetPosition[0], targetPosition[1]);
  const goUpHeight = goUpHeightTooth * dispatchConfig.toothMilliMeter / 1000;
  const powerConsumption = (powerConfig.shuttleWeight + powerConfig.cargoBoxWight + powerConfig.maxLoadWeight) * 9.8 * goUpHeight; // 理论要消耗的能量mgh

  console.debug('<----enough power: ', powerInStorage * powerConfig.transferEfficiency  > powerConsumption * powerConfig.safeFactor, ' ---->');
  console.debug('<----powerConsumption: ', powerConsumption, ' ---->');
  console.debug('<----powerInStorage: ', powerInStorage, ' ---->');
  console.debug('<----goUpHeightTooth: ', goUpHeightTooth, ' ---->');
  console.debug('<----goUpHeight: ', goUpHeight, ' ---->');
  return powerInStorage * powerConfig.transferEfficiency > powerConsumption * powerConfig.safeFactor;
}
