export enum LogLevel {
    Log = 0,
    Debug = 100,
    Info = 100,
    Warn = 200,
    Error = 300,
    Fatal = 400
}

interface LoggerConfig {
    storageKeyName?: string;
    logLevel?: LogLevel;
    prefix?: CallableFunction;
    suffix?: CallableFunction;
}

const defaultLoggerConfig: LoggerConfig = {
    storageKeyName: 'SearchLoggerConfig',
    logLevel: defaultLogLevel(),
};

function defaultLogLevel() {
    const ll = process.env['loglevel'] || '';
    switch (ll.toLowerCase()) {

    default:
    case 'log':
      return LogLevel.Log;
    case 'debug':
      return LogLevel.Debug;
    case 'info':
      return LogLevel.Info;
    case 'warn':
    case 'warning':
      return LogLevel.Warn;
    case 'error':
      return LogLevel.Error;
    case 'fatal':
      return LogLevel.Fatal;
    }
}



function getCandidates(loggerName: string) {
    // if loggerName is 'lorem.ipsum.dolor.sit.amet' then
    // candidates = [
    //     'lorem.ipsum.dolor.sit.amet',
    //     'lorem.ipsum.dolor.sit',
    //     'lorem.ipsum.dolor',
    //     'lorem.ipsum',
    //     'lorem'
    // ]

    if (loggerName.indexOf('.') === -1)
      return loggerName;

    const parts = loggerName.split('.');

    const candidates = [
      loggerName
    ];

    for (let i = parts.length - 1; i >= 1; i--) {
      candidates.push(parts.slice(0, i).join('.'));
    }
    return candidates;
}

export default class Logger {

    public static globalLogLevel: LogLevel = defaultLogLevel();

    loggerName: string;
    config: LoggerConfig;

    constructor(loggerName: string, loggerConfig?: LoggerConfig) {
        this.loggerName = loggerName;
        this.config = {...defaultLoggerConfig, ...loggerConfig};
    }

    private isEnabled(logLevel: LogLevel) {
        if (logLevel >= Logger.globalLogLevel)
          return true;

        if (logLevel >= this.config.logLevel)
          return true;

        const keyName = this.config.storageKeyName;
        const configured = sessionStorage.getItem(keyName)
            || localStorage.getItem(keyName)
            || window[keyName]
        ;

        if (!configured)
          return false;

        try {
          const loggers: Object = JSON.parse(configured);
          const loggersKeys = Object.keys(loggers);

          //if there is exact match in loggers object, check the log level.
          if (loggersKeys.indexOf(this.loggerName) !== -1) {
            return logLevel >= loggers[this.loggerName];
          }


          const candidates = getCandidates(this.loggerName);
          for (const candidate of candidates) {
            if (loggersKeys.indexOf(candidate) !== -1 && logLevel >= loggers[candidate]) {
              return true;
            }
          }

        } catch (e) {
          console.log('Error reading LoggerConfig, enabling as fallback', e);
          return true;
        }

        return false;
    }

    enhance(args: Array<unknown>): Array<unknown> {
        if (this.config.prefix) {
          args.unshift(this.config.prefix());
        }
        if (this.config.suffix) {
          args.push(this.config.suffix());
        }
        return args;
    }

    log(...args: Array<unknown>): void {
        if (this.isEnabled(LogLevel.Log))
          console.log(...this.enhance(args));
    }

    debug(...args: Array<unknown>): void {
        if (this.isEnabled(LogLevel.Debug))
          console.debug(...this.enhance(args));
    }

    info(...args: Array<unknown>): void {
        if (this.isEnabled(LogLevel.Info))
          console.info(...this.enhance(args));
    }

    warn(...args: Array<unknown>): void {
        if (this.isEnabled(LogLevel.Warn))
          console.warn(...this.enhance(args));
    }

    error(...args: Array<unknown>): void {
        if (this.isEnabled(LogLevel.Error))
          console.error(...this.enhance(args));
    }

    fatal(...args: Array<unknown>): void {
        if (this.isEnabled(LogLevel.Fatal)) {
          console.group('Fatal Error');
          console.error(...this.enhance(args));
          console.groupEnd();
        }
    }

    group = console.group;
    groupEnd = console.groupEnd;
    // groupCollapsed = console.groupCollapsed;
    trace = console.trace;
    assert = console.assert;
    count = console.count;
    table = console.table;
    dir = console.dir;
    dirxml = console.dirxml;
    profile = console.profile;
    profileEnd = console.profileEnd;
    time = console.time;
    timeEnd = console.timeEnd;
    timeLog = console.timeLog;
}
