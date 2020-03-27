//Important: Set the env to either development or production to use the appropriate config
/****************************************/
const env = "production"; // 'development' or 'production'
/*******************************************/

let appRoot = require("app-root-path");
const { format } = require("winston");
//const { combine, timestamp, printf } = format;
const timestampFormat = 'YYYY-MM-DD HH:mm:ss.SSS';

//All Configurations
const development = {
  simulationMode: 'off',
  traversal:'off',
  traversalFilename: `D:/AGC_Data/traversal/EblDiaWebhook/traversal`,
  server: {
    port: 9000,
    timeoutMs: 10000,
    usessl: 'on'
  },
  ebl: {
    uri: 'http://192.168.3.54/apicbot/' ,
    timeoutMs: 4000,
    otpTimeoutMs: 60000
  },
  mobileRecharge: {
    userId: 'CIBL' ,
    password: 'your password',
    handshakekey: 'your handshakekey'
  },
  logs: {
    file: {
      level: 'debug',
      filename: `D:/AGC_Data/Logs/EblDiaWebhook/%DATE%-trace.log`,
      datePattern: "YYYY-MM-DD",
      zippedArchive: false,
      maxSize: '10m',
      maxFiles: '30',
      format: format.combine(
          format.timestamp({format: timestampFormat}),
          format.printf(
              info => `${info.timestamp} [${info.logId}] ${info.level}: ${info.message}`
          )
      ),
    },
    console: {
      level: 'info',
      datePattern: "YYYY-MM-DD",
      format: format.combine(
        format.colorize(),
        format.timestamp({format: timestampFormat}),
        format.printf(
        info => `${info.timestamp} [${info.logId}] ${info.level}: ${info.message}`
        )
      ),
    },
    morgan: {
      format: ":method :url :status :res[content-length] - :response-time ms"
    }
  }
};

const production = {
  simulationMode: 'off',  
  traversal:'on',
  traversalFilename: `D:/AGC_Data/traversal/EblDiaWebhook/traversal`,
  server: {
    port: 9000,
    timeoutMs: 10000,
    usessl: 'on'
  },
    ebl: {
      uri: 'http://192.168.3.159/apicbot/' ,
      timeoutMs: 4000,
      otpTimeoutMs: 60000  
    },
    mobileRecharge: {
      userId: 'CIBL' ,
      password: 'your password',
      handshakekey: 'your handshakekey'
    },
    logs: {
      file: {
        level: 'debug',
        filename: `D:/AGC_Data/Logs/EblDiaWebhook/%DATE%-trace.log`,
        datePattern: "YYYY-MM-DD",
        zippedArchive: false,
        maxSize: '10m',
        maxFiles: '30',
        format: format.combine(
            format.timestamp({format: timestampFormat}),
            format.printf(
                info => `${info.timestamp} [${info.logId}] ${info.level}: ${info.message}`
            )
        ),
      },
      console: {
        level: 'info',
        datePattern: "YYYY-MM-DD",
        format: format.combine(
          format.colorize(),
          format.timestamp({format: timestampFormat}),
          format.printf(
          info => `${info.timestamp} [${info.logId}] ${info.level}: ${info.message}`
          )
        ),
      },
      morgan: {
        format: ":method :url :status :res[content-length] - :response-time ms"
      }
    }
  };

const config = {
  development,
  production
};

module.exports = config[env];
