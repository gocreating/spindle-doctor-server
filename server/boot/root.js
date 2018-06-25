'use strict';

module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get('/status', server.loopback.status());
  router.get('/robots.txt', function(req, res, next) {
    res.send('User-agent: *\nDisallow:');
  });
  server.use(router);
};
