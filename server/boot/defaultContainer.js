'use strict';

module.exports = function defaultContainer(app) {
  var storage = app.models.Container;

  storage.getContainer('raw-data', function(err, container) {
    if (!container) {
      storage.createContainer({
        name: 'raw-data'
      }, function(err, container) {
        if (err) throw err;
      });
    }
  });
};
