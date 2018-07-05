'use strict';

module.exports = function(filePath) {
  return function reactRouter(req, res, next) {
    res.sendFile(filePath);
  };
};
