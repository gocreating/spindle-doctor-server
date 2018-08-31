'use strict';

var superagent = require('superagent');

module.exports = function defineDeployModel(app) {
  var Edge = app.models.Edge;
  var Session = app.models.Session;

  Edge.deployModel = function(ctx, id, modelId, cb) {
    Edge.findById(id, function(err, edge) {
      if (err || !edge) return cb(err);

      Session.findById(modelId, function(err, session) {
        if (err || !session) return cb(err);

        var edgeEndpoint = `http://${edge.ip_address}:${edge.port}/api`;
        var modelName = `${session.id}-${session.name}`;

        superagent
          .post(`${edgeEndpoint}/edge-models/${modelName}/deploy`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .end(function(err, res) {
            if (err) { cb(err); }

            cb(null, {
              modelName: modelName,
            });
          });
      });
    });
  };
};
