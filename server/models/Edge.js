'use strict';

module.exports = function(Edge) {
  Edge.remoteMethod('deployModel', {
    description: 'Requests an edge to fetch specific model',
    accepts: [{
      arg: 'ctx',
      type: 'object',
      http: { source: 'context' },
    }, {
      arg: 'id',
      type: 'any',
      required: true,
      description: 'edge id',
    }, {
      arg: 'modelId',
      type: 'any',
      required: true,
      description: 'Id of the trained session to be deployed.',
    }],
    returns: {
      arg: 'deployModelResult', type: 'object', root: true,
    },
    http: {
      verb: 'post',
      path: '/:id/deploy-model/:modelId',
    },
  });
};
