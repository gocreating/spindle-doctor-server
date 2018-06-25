'use strict';

// https://stackoverflow.com/questions/28885282/how-to-store-files-with-meta-data-in-loopback
var CONTAINERS_URL = '/api/containers/';

module.exports = function defineUploadDataset(app) {
  var Project = app.models.Project;
  var Dataset = app.models.Dataset;
  var Container = app.models.Container;

  Project.upload = function(ctx, options, id, fk, cb) {
    if (!options) options = {};
    ctx.req.params.container = fk;
    Container.upload(ctx.req, ctx.result, options, function(err, fileObj) {
      if (err) {
        cb(err);
      } else {
        var fileInfo = fileObj.files.file[0];

        Dataset.create({
          name: fileInfo.name,
          type: fileInfo.type,
          originalFilename: fileInfo.originalFilename,
          size: fileInfo.size,
          container: fileInfo.container,
          url: CONTAINERS_URL + fileInfo.container + '/download/' + fileInfo.name
        }, function(err, obj) {
          if (err !== null) {
            cb(err);
          } else {
            cb(null, obj);
          }
        });
      }
    });
  };
};
