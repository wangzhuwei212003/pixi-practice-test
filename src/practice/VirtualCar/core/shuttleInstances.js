import car from './car'

export const shuttles = { };


export const addOneMore = function (uid) {
  shuttles[uid] = new car(uid);
  console.log('在 shuttles 里 new 一个 car');

  /*
  * 1. 在 shuttles 里添加一个新 car
  * 2. 调用 dispatch 里的 register 方法，在 dispatch 里添加一个新 car
  *
  * */

  // 过几秒钟就直接注册成功， command ID 79
  setTimeout(() => {
    shuttles[uid].handleCmdMsg('79');
    console.log('注册成功，发出命令 79')
  }, 1000);

};
