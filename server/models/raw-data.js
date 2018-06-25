// https://stackoverflow.com/questions/28885282/how-to-store-files-with-meta-data-in-loopback
var CONTAINERS_URL = '/api/containers/';

module.exports = function(RawData) {
  RawData.upload = function(ctx, options, cb) {
    if (!options) options = {};
    ctx.req.params.container = 'raw-data';
    RawData.app.models.Container.upload(ctx.req, ctx.result, options, function(err, fileObj) {
      if (err) {
        cb(err);
      } else {
        var fileInfo = fileObj.files.file[0];

        RawData.create({
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

  RawData.remoteMethod(
    'upload',
    {
      description: 'Uploads a raw data file with .csv format',
      accepts: [
        { arg: 'ctx', type: 'object', http: { source: 'context' } },
        { arg: 'options', type: 'object', http: { source: 'query'} },
      ],
      returns: {
        arg: 'fileObject', type: 'object', root: true,
      },
      http: { verb: 'post' }
    }
  );
};
