const log = require('npmlog');
const rc = require('rc');
const colors = require('colors');
const defaultsDeep = require('lodash').defaultsDeep;

var server = require('../src');

var options = rc('htpc-proxy', {
  port: 8080,
  host: '127.0.0.1',
  log: {
    level: 'info',
    style: {
      silly: {inverse: true, bold: true},
      verbose: {fg: 'brightBlue', bold: true},
      info: {fg: 'brightGreen', bold: true},
      http: {fg: 'brightGreen', bold: true},
      warn: {fg: 'brightYellow', bold: true},
      error: {fg: 'brightRed', bold: true},
      silent: undefined
    },
    prefixStyle: {
      fg: 'magenta'
    },
    headingStyle: {},
    disp: {
      silly: 'Sill',
      verbose: 'Verb',
      info: 'Info',
      http: 'HTTP',
      warn: 'Warn',
      error: 'Err!',
      silent: 'silent'
    },
    heading: 'htpc-proxy'
  },
  ngrok: {},
  apps: {}
});

log = defaultsDeep(log, options.log);

server(options)
.then(function(res){
  log.info(null, 'Started!');
  log.info('ngrok url', res.url);
})
.catch(function(err){
  // there was an issue starting the server...
  log.error(null, err);
})
;
