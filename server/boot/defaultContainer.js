'use strict';

module.exports = function defaultContainer(app) {
  var storage = app.models.Container;
  var RAW_DATA = 'raw-data';

  storage.getContainer(RAW_DATA, function(err, container) {
    if (!container) {
      storage.createContainer({
        name: RAW_DATA,
      }, function(err, container) {
        if (err) throw err;
        console.log('>> Default container', RAW_DATA, 'created');
      });
    }
  });
};
