'use strict';

var whiteList = [
  'create',
  'deleteById',
];

module.exports = function(SessionDataset) {
  SessionDataset.sharedClass.methods().forEach(function(method) {
    if (whiteList.indexOf(method.name) == -1) {
      SessionDataset.disableRemoteMethod(method.name, method.isStatic);
    }
    SessionDataset.disableRemoteMethod('__get__session', false);
    SessionDataset.disableRemoteMethod('__get__dataset', false);
  });
};
