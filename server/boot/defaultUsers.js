'use strict';

var async = require('async');

module.exports = function defaultUsers(app) {
  if (process.env.NODE_ENV == 'test') return;

  var TongtaiUser = app.models.TongtaiUser;
  var tongtaiUsers = require('../initial-data/tongtai-users.json');

  async.eachSeries(tongtaiUsers.users, (tongtaiUser, callback) => {
    TongtaiUser.findOrCreate({
      where: { email: tongtaiUser.email },
    }, tongtaiUser, function(err, user) {
      if (err) throw err;

      console.log('>> Default tongtai-user', user.email, 'created');
      callback();
    });
  }, (err) => {
    if (err) throw err;
  });
};
