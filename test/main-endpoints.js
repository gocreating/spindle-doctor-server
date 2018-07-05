'use strict';

var assert = require('chai').assert;
var superagent = require('superagent');
var async = require('async');
var app = require('../server/server');
var tongtaiUsers = require('../server/initial-data/tongtai-users.json');
var graphs = require('../server/initial-data/graphs.json').graphs;
var HOST = 'http://localhost:5000';

describe('End-to-End Test', function() {
  var server;
  var admin = tongtaiUsers.admins[0];
  var member = tongtaiUsers.users[0];
  var adminUserId = '';
  var adminUserToken = '';
  var memberUserId = '';
  var memberUserToken = '';
  var projectId = '';

  before(function(done) {
    server = app.listen(function waitForBoot() {
      setTimeout(done, 3000);
    });
  });

  after(function(done) {
    process.exit();
  });

  it('Guest should signup', function(done) {
    superagent
      .post(HOST + '/api/tongtai-users')
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
        .post(HOST + '/api/tongtai-users/login')
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

  it('Authenticated user should create project', function(done) {
    superagent
      .post(HOST + '/api/tongtai-users/' + memberUserId + '/projects')
      .query({ 'access_token': memberUserToken })
      .send({ name: 'CNC Drilling Machine' })
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .end(function(err, res) {
        if (err) { return done(err); }

        assert.equal(res.status, 200);
        assert.ok(res.body);
        projectId = res.body.id;
        done();
      });
  });

  it('Unauthenticated user should not create project', function(done) {
    superagent
      .post(HOST + '/api/tongtai-users/' + memberUserId + '/projects')
      .send({ name: 'CNC Drilling Machine' })
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .end(function(err, res) {
        assert.equal(err.status, 401);
        done();
      });
  });

  it('Authenticated user should list graphs', function(done) {
    superagent
      .get(HOST + '/api/graphs')
      .query({ 'access_token': memberUserToken })
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .end(function(err, res) {
        if (err) { return done(err); }

        assert.equal(res.status, 200);
        assert.ok(res.body);
        res.body.forEach(function(returnedGraph, idx) {
          assert.equal(returnedGraph.name, graphs[idx].name);
        });
        done();
      });
  });
});
