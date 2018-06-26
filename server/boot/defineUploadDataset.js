'use strict';

// https://stackoverflow.com/questions/28885282/how-to-store-files-with-meta-data-in-loopback
module.exports = function defineUploadDataset(app) {
  var Project = app.models.Project;
  var Dataset = app.models.Dataset;
  var Container = app.models.Container;

  Project.upload = function(ctx, options, id, fk, cb) {
    if (!options) options = {};
    ctx.req.params.container = fk;
    Container.upload(
      ctx.req,
      ctx.result,
      options,
      function(err, { files, fields } = {}) {
        if (err) {
          return cb(err);
        }

        var fileInfo = files.file[0];
        var dataset = {
          name: fileInfo.name,
          type: fileInfo.type,
          originalFilename: fileInfo.originalFilename,
          size: fileInfo.size,
          container: fileInfo.container,
          url: (
            '/api/containers/' + fileInfo.container +
            '/download/' + fileInfo.name
          ),
        };

        fields = fields || {};
        if (fields.description) {
          dataset.description = fields.description[0];
        }
        Dataset.create(dataset, function(err, obj) {
          if (err !== null) {
            cb(err);
          } else {
            cb(null, obj);
          }
        });
      }
    );
  };
};
