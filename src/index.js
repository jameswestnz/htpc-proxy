const Hapi = require('hapi');
const Promise = require('promise');
const ngrok = require('ngrok');

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
          path: '/' + app.name,
          handler: {
            proxy: {
              passThrough: true,
              host: app.host || '127.0.0.1',
              port: app.port,
              protocol: 'http'
            }
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

    // connect to ngrok
    ngrok.connect({
      proto: 'http',
      addr: server.info.port,
      auth: options.ngrok.auth || null,
      region: options.ngrok.region || null,
      subdomain: options.ngrok.subdomain || null,
      authtoken: options.ngrok.authtoken || null
    }, function (err, url) {
      if(err) reject(err);

      fulfill(url)
    });
  });
}
