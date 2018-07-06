'use strict';

module.exports = function(Project) {
  // Project.observe('before save', function(ctx, next) {
  //   var accessToken = ctx.options && ctx.options.accessToken;
  //   var userId = accessToken && accessToken.userId;
  //
  //   if (ctx.instance) {
  //     ctx.instance.ownerId = userId;
  //   } else {
  //     ctx.data.ownerId = userId;
  //   }
  //   return next();
  // });

  Project.remoteMethod('upload', {
    description: 'Uploads a raw data file with .csv format',
    accepts: [{
      arg: 'ctx',
      type: 'object',
      http: { source: 'context' },
    }, {
      arg: 'options',
      type: 'object',
      http: { source: 'query' },
    }, {
      arg: 'id',
      type: 'any',
      required: true,
    }, {
      arg: 'fk',
      type: 'any',
      required: true,
      description: 'container name, currently supports `raw-data`',
    }],
    returns: {
      arg: 'fileObject', type: 'object', root: true,
    },
    http: {
      verb: 'post',
      path: '/:id/datasets/:fk/upload',
    },
  });

  Project.remoteMethod('sessionStart', {
    description: 'Starts a training session to feed data into a graph',
    accepts: [{
      arg: 'ctx',
      type: 'object',
      http: { source: 'context' },
    }, {
      arg: 'id',
      type: 'any',
      required: true,
    }, {
      arg: 'fk',
      type: 'any',
      required: true,
      description: 'session id',
    }],
    returns: {
      arg: 'startResult', type: 'object', root: true,
    },
    http: {
      verb: 'post',
      path: '/:id/sessions/:fk/start',
    },
  });

  Project.remoteMethod('sessionStop', {
    description: 'Stops a running session',
    accepts: [{
      arg: 'ctx',
      type: 'object',
      http: { source: 'context' },
    }, {
      arg: 'id',
      type: 'any',
      required: true,
    }, {
      arg: 'fk',
      type: 'any',
      required: true,
      description: 'session id',
    }],
    returns: {
      arg: 'stopResult', type: 'object', root: true,
    },
    http: {
      verb: 'post',
      path: '/:id/sessions/:fk/stop',
    },
  });
};
