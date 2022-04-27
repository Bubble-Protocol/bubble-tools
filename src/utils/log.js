/**
 * Bubble Logger
 * 
 * Extends the native console with trace and debug functions, and provides support for optional timestamp.
 * Original console.trace() is replaced with console.stackTrace().
 * 
 * Usage:
 * 
 *   require('log.js');
 *   console.enable(<level>);
 *   console.disable(<level>);
 * 
 *   where <level> is one of 'timestamp', 'trace', 'debug', 'log', 'info', 'warn', 'error'
 * 
 *   By default, trace and debug are disabled and the timestamp is disabled
 * 
 *   For browsers that don't set the console immediately on construction, it may be necessary to call
 *   initialise() manually before using the trace and debug functions.
 */


 const enabled = {
  log: true,
  info: true,
  trace: false,
  debug: false,
  warn: true,
  error: true,
  timestamp: false
}


// Handle browsers without a console
const nativeConsole = typeof window === 'undefined' ? console : window.console ||
  {
    log: function() {},
    info: function() {},
    warn: function() {},
    error: function() {},
    trace: function() {}
  };

// Save native console logging functions
const originalConsole = {
  log: nativeConsole.log,
  info: nativeConsole.info,
  warn: nativeConsole.warn,
  error: nativeConsole.error,
  trace: nativeConsole.trace
}

// extend the console with the enable and disable functions

nativeConsole.enable = function (level) {
  enabled[level] = true;
  constructLogger();
}

nativeConsole.disable = function (level) {
  enabled[level] = false;
  constructLogger();
}

constructLogger();



function constructLogger(){

  const timestamp = function() {
    const now = new Date();
    return now.toISOString();
  }

  const nullLog = function() {};

  const log = function() {
    if (enabled.timestamp) return Function.prototype.bind.call(originalConsole.log, nativeConsole, timestamp());
    else return originalConsole.log;
  }();

  const trace = function() {
    if (enabled.timestamp) return Function.prototype.bind.call(originalConsole.info, nativeConsole, timestamp(), "[trace]");
    else return Function.prototype.bind.call(originalConsole.info, nativeConsole, "[trace]");
  }();

  const debug = function() {
    if (enabled.timestamp) return Function.prototype.bind.call(originalConsole.info, nativeConsole, timestamp(), "[debug]");
    else return Function.prototype.bind.call(originalConsole.info, nativeConsole, "[debug]");
  }();

  const info = function() {
    if (enabled.timestamp) return Function.prototype.bind.call(originalConsole.info, nativeConsole, timestamp());
    else return originalConsole.info;
  }();

  const warn = function() {
    if (enabled.timestamp) return Function.prototype.bind.call(originalConsole.warn, nativeConsole, timestamp());
    else return originalConsole.warn;
  }();

  const error = function() {
    if (enabled.timestamp) return Function.prototype.bind.call(originalConsole.error, nativeConsole, timestamp());
    else return originalConsole.error;
  }();

  nativeConsole.log = enabled.log ? log : nullLog;
  nativeConsole.info = enabled.info ? info : nullLog;
  nativeConsole.trace = enabled.trace ? trace : nullLog;
  nativeConsole.debug = enabled.debug ? debug : nullLog;
  nativeConsole.warn = enabled.warn ? warn : nullLog;
  nativeConsole.error = enabled.error ? error : nullLog;

  nativeConsole.stackTrace = originalConsole.trace;

}
