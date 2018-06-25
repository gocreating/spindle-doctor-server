'use strict';

var async = require("async");

module.exports = function defaultAdmins(app) {
  var TongtaiUser = app.models.TongtaiUser;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;
  var adminInfo = require('../admin.json');

  // create the admin role
  Role.findOrCreate({
    where: { name: 'admin' }
  }, {
    name: 'admin'
  }, function(err, role) {
    if (err) throw err;

    async.eachSeries(adminInfo.admins, (admin, callback) => {
      TongtaiUser.findOrCreate({
        where: { email: admin.email }
      }, admin, function(err, user) {
        if (err) throw err;

        // make created user an admin
        RoleMapping.findOrCreate({
          where: {
            principalType: RoleMapping.USER,
            principalId: user.id,
            roleId: role.id,
          },
        }, {
          principalType: RoleMapping.USER,
          principalId: user.id,
          roleId: role.id,
        }, function(err, principal) {
          if (err) throw err;

          console.log('Default admin', user.email, 'created');
          callback();
        });
      });
    }, (err) => {
      if (err) throw err;
    });
  });
};
