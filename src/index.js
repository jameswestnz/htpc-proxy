const Hapi = require('hapi');
const Promise = require('promise');
const ngrok = require('ngrok');
const defaultsDeep = require('lodash').defaultsDeep;
const url = require('url');

module.exports = function(options){
  const server = new Hapi.Server();

  // setup connection
  server.connection({
    port: options.port || 8080
  });

  // required plugins
  // these must be registered first so that custom handlers work
  var requiredPlugins = [
    { register: require('h2o2') }
  ];

  // return promise
  return new Promise(function(fulfill, reject){
    server.register(requiredPlugins, {}, function(){
      // now add routes
      Object.keys(options.apps).map(function(key) {
        app = options.apps[key];

        app.name = app.name || key;

        server.route({
          method: '*',
          path: '/' + app.name + '/{p*}',
          config: {
            payload: {
              output: 'stream',
              parse: false
            }
          },
          handler: function(request, reply){
            return reply.proxy({
              passThrough: true,
              uri: url.format({
                hostname: app.host || '127.0.0.1',
                port: app.port,
                protocol: 'http:',
                pathname: request.path.replace('/' + app.name, '')
              })
            });
          }
        });
      });

      // tunnel, then start the server
      tunnel(server, options)
      .then(function(url){
        server.start()
        .then(function(){
          fulfill({
            server: server,
            url: url
          });
        })
        .catch(function(err){
          reject(err);
        });
      });
    });
  });
};

var tunnel = function(server, options){
  return new Promise(function(fulfill, reject){
    // ensure we close ngrok when the server closes
    server.listener.on('close', function() {
      ngrok.disconnect();
    });

    var ngrokOptions = defaultsDeep(options.ngrok, {
      proto: 'http',
      addr: server.info.port
    })

    // connect to ngrok
    ngrok.connect(ngrokOptions, function (err, url) {
      if(err) reject(err);

      fulfill(url)
    });
  });
}
