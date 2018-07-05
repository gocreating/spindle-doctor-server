'use strict';

var async = require('async');

module.exports = function defaultAdmins(app) {
  var Graph = app.models.Graph;
  var graphInfo = require('../initial-data/graphs.json');

  async.eachSeries(graphInfo.graphs, (graph, callback) => {
    Graph.findOrCreate(
      { where: { name: graph.name } },
      graph,
      function(err, graph) {
        if (err) throw err;
        console.log('>> Graph', graph.name, 'created');
        callback();
      }
    );
  }, (err) => {
    if (err) throw err;
  });
};
