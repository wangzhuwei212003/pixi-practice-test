import winston from 'winston';
import moment from 'moment-timezone';
// import fs from "fs";
import * as fs from 'fs-web';
import path from 'path';
process.env.TZ = 'Asia/Shanghai';

/*const fs = require('fs');
console.log(fs);
console.log(JSON.stringify(fs)); // 前端浏览器没有 nodeJS 里的 fs 包。这里的 fs 就是一个空的 object */

const logsDir = path.join(process.cwd(), './logs/');

console.log(logsDir);

console.log(fs);
console.log(JSON.stringify(fs));

console.log(fs.readdir(logsDir));
console.log(fs.readdir(logsDir));

fs.readdir(logsDir)
    .then(res => {
      if(res.length === 0){
        fs.mkdir(logsDir);
      }
      console.log(res)
    })
    .catch(err => console.log(err));

if(!fs.readdir(logsDir)){
  console.log('path not exist...')
}

/*if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}*/

const timestampFormat = function() {
  return moment.tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss:SSS');
};

const wConsole = new winston.transports.Console({
  level: "debug",
  humanReadableUnhandledException: true,
  handleExceptions: true,
  json: false,
  colorize: true,
  timestamp: timestampFormat,
});

const shuttleLogFile = (uid) => {
  return new winston.transports.File({
    level: 'debug',
    filename: `${logsDir}/${uid}.log`,
    json: false,
    maxsize: 52428800, //50MB
    maxFiles: 5,
    colorize: false,
    timestamp: timestampFormat,
  });
};

let logger = new winston.Logger({
  transports: [
    wConsole,
    new winston.transports.File({
      name: 'info-file',
      level: 'info',
      filename: `${logsDir}/all-logs.log`,
      json: false,
      maxsize: 52428800, //50MB
      maxFiles: 5,
      colorize: false,
      timestamp: timestampFormat,
    }),
    new winston.transports.File({
      name: 'error-file',
      level: 'error',
      filename: `${logsDir}/error-logs.log`,
      json: false,
      maxsize: 52428800, //50MB
      maxFiles: 5,
      colorize: false,
      timestamp: timestampFormat,
    }),
  ],
  exitOnError: false
});

export {
  logger,
  logsDir,
  wConsole,
  shuttleLogFile,
};
