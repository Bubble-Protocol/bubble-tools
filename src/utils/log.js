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
 *   By default, trace and debug are disabled and the timestamp is disabled.  All other levels are enabled.
 * 
 *   For browsers that don't set the console immediately on construction, it may be necessary to call
 *   constructLogger() manually before using the trace and debug functions.
 * 
 * Example:
 * 
 *   require('log.js');
 * 	 console.enable("trace");
 *   console.enable("debug");
 *   console.enable("timestamp");
 * 
 *   console.trace("Logger enabled");
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
    // Crude fix to filter secp error caused by eccrypto dependency - see https://github.com/Bubble-Protocol/bubble-tools/issues/2
    const filterSecpError = (...params) => { if (!(params && params[0] === "secp256k1 unavailable, reverting to browser version")) originalConsole.info(...params) };
    if (enabled.timestamp) return Function.prototype.bind.call(filterSecpError, nativeConsole, timestamp());
    else return filterSecpError;
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
