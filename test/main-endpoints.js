'use strict';

var assert = require('chai').assert;
var superagent = require('superagent');
var async = require('async');
var app = require('../server/server');
var tongtaiUsers = require('../server/initial-data/tongtai-users.json');
var graphs = require('../server/initial-data/graphs.json').graphs;
var ENDPOINT = 'http://localhost:3002/api';

describe('\n\nEnd-to-End Test', function() {
  var server;
  var admin = tongtaiUsers.admins[0];
  var member = tongtaiUsers.users[0];
  var adminUserId = '';
  var adminUserToken = '';
  var memberUserId = '';
  var memberUserToken = '';
  var projectId = '';
  var graphId = '';
  var datasetId = '';
  var sessionId = '';

  before(function(done) {
    server = app.listen(function waitForBoot() {
      setTimeout(done, 3000);
    });
  });

  after(function(done) {
    process.exit();
  });

  describe('#TongtaiUser', function() {
    it('Guest should signup', function(done) {
      superagent
        .post(ENDPOINT + '/tongtai-users')
        .send({
          name: member.name,
          email: member.email,
          password: member.password,
        })
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .end(function(err, res) {
          if (err) { return done(err); }

          assert.equal(res.status, 200);
          assert.ok(res.body);
          done();
        });
    });

    it('Registered user should log in', function(done) {
      async.forEachOf([member, admin], (user, idx, callback) => {
        superagent
          .post(ENDPOINT + '/tongtai-users/login')
          .send({
            email: admin.email,
            password: admin.password,
          })
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .end(function(err, res) {
            if (err) { return callback(err); }

            assert.equal(res.status, 200);
            assert.ok(res.body);

            if (idx == 0) {
              memberUserId = res.body.userId;
              memberUserToken = res.body.id;
            } else if (idx == 1) {
              adminUserId = res.body.userId;
              adminUserToken = res.body.id;
            }
            callback();
          });
      }, done);
    });
  });

  describe('#Project', function() {
    it('Authenticated user should create a project', function(done) {
      superagent
        .post(ENDPOINT + '/tongtai-users/' + memberUserId + '/projects')
        .query({ 'access_token': memberUserToken })
        .send({ name: 'CNC Drilling Machine' })
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .end(function(err, res) {
          if (err) { return done(err); }

          assert.equal(res.status, 200);
          assert.ok(res.body);
          assert.containsAllKeys(res.body, ['ownerId']);
          projectId = res.body.id;
          done();
        });
    });

    it('Unauthenticated user should not create a project', function(done) {
      superagent
        .post(ENDPOINT + '/tongtai-users/' + memberUserId + '/projects')
        .send({ name: 'CNC Drilling Machine' })
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .end(function(err, res) {
          assert.equal(err.status, 401);
          done();
        });
    });

    describe('#Graph', function() {
      it('Guest should list graphs', function(done) {
        superagent
          .get(ENDPOINT + '/graphs')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .end(function(err, res) {
            if (err) { return done(err); }

            assert.equal(res.status, 200);
            assert.ok(res.body);
            graphId = res.body[0].id;
            async.forEachOf(res.body, function(returnedGraph, idx, callback) {
              assert.equal(returnedGraph.name, graphs[idx].name);
              callback();
            }, done);
          });
      });
    });

    describe('#Dataset', function() {
      it(
        'Project owner should upload datasets with description',
        function(done) {
          var DESCRIPTION = 'test foo bar';

          superagent
            .post(
              ENDPOINT + '/projects/' + projectId + '/datasets/raw-data/upload'
            )
            .query({ 'access_token': memberUserToken })
            .set('Accept', 'application/json')
            .attach('file', './test/sample-data.csv')
            .field('description', DESCRIPTION)
            .type('form')
            .on('progress', event => {})
            .on('error', (err) => {})
            .end(function(err, res) {
              if (err) { return done(err); }

              assert.equal(res.status, 200);
              assert.ok(res.body);
              assert.equal(res.body.description, DESCRIPTION);
              datasetId = res.body.id;
              done();
            });
        }
      );
    });

    describe('#Session', function() {
      it('Project owner should create session', function(done) {
        superagent
          .post(ENDPOINT + '/projects/' + projectId + '/sessions')
          .query({ 'access_token': memberUserToken })
          .send({
            name: 'sample-session',
            description: 'test session in a sandbox',
            featureFields: ['feature1', 'feature2'],
            targetField: 'label',
            hyperParameters: {},
            graphId: graphId,
          })
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .end(function(err, res) {
            if (err) { return done(err); }

            assert.equal(res.status, 200);
            assert.ok(res.body);
            assert.containsAllKeys(res.body, ['projectId']);
            sessionId = res.body.id;
            done();
          });
      });

      it(
        'Guest should link specific session with a dataset',
        function(done) {
          superagent
            .post(ENDPOINT + '/sessions-datasets')
            .send({
              sessionId: sessionId,
              datasetId: datasetId,
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function(err, res) {
              if (err) { return done(err); }

              assert.equal(res.status, 200);
              assert.ok(res.body);
              done();
            });
        }
      );

      it('Project owner should get session with related data', function(done) {
        superagent
          .get(ENDPOINT + '/projects/' + projectId + '/sessions')
          .query({
            'access_token': memberUserToken,
            filter: {
              where: { id: sessionId },
              include: ['datasets', 'graph', 'project'],
            },
          })
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .end(function(err, res) {
            if (err) { return done(err); }

            var session = res.body[0];
            assert.equal(res.status, 200);
            assert.ok(res.body);
            assert.containsAllKeys(session, ['graph', 'project', 'datasets']);
            assert.isArray(session.datasets, 'datasets is not an array');
            done();
          });
      });
    });
  });
});
