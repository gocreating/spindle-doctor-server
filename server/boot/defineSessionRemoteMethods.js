'use strict';

var path = require('path');
var spawn = require('child_process').spawn;
var ds = require('../datasources.json');

function launchSession(app, sess) {
  var cwd = path.join(
    __dirname,
    '../../../spindle-doctor/src'
  );
  var flattenDeep = (arr) => (
    arr.reduce((acc, val) => (
      Array.isArray(val) ?
      acc.concat(flattenDeep(val)) :
      acc.concat(val)
    ), [])
  );
  var hyperParameters = flattenDeep(
    Object.entries(sess.hyperParameters)
  );
  var datasets = sess.datasets().map(d => {
    return path.join(
      __dirname,
      '..',
      '..',
      ds.localFile.root,
      d.container,
      d.name
    );
  });
  var name = `${sess.id}-${sess.name}`;
  var args = [
    path.join(cwd, sess.graph().trainScriptPath),
    '--scope', 'api-server',
    '--name', name,
    ...hyperParameters,
    '--srcs', ...datasets,
    '--columns', ...sess.featureFields, sess.targetField,
    '--dest', path.join(cwd,
      '..',
      'build',
      'models',
      'api-server',
      name,
      'model'
    ),
  ];
  var child = spawn('python', args, { cwd: cwd });

  return child;
}

module.exports = function defineSessionRemoteMethods(app) {
  var Project = app.models.Project;
  var Session = app.models.Session;
  var SessionProcess = app.models.SessionProcess;

  Project.sessionStart = function(ctx, id, fk, cb) {
    SessionProcess.findOne({
      where: { sessionId: fk },
    }, function(err, sessionProcess) {
      if (err) return cb(err);
      if (sessionProcess) {
        var error = new Error('Session is already running');
        error.status = 400;
        return cb(error);
      }

      Session.findOne({
        where: { id: fk },
        include: ['datasets', 'graph'],
      }, function(err, session) {
        if (err) return cb(err);

        var child = launchSession(app, session);

        SessionProcess.create({
          pid: child.pid,
          sessionId: fk,
          stdout: '',
          stderr: '',
        }, function(err, sessionProcess) {
          child.stdout.on('data', function(data) {
            sessionProcess.updateAttributes({
              stdout: sessionProcess.stdout + data,
            }, function(err, sp) {
              session.updateAttributes({
                'lastLog.stdout': sp.stdout,
              });
            });
          });

          child.stderr.on('data', function(data) {
            sessionProcess.updateAttributes({
              stderr: sessionProcess.stderr + data,
            }, function(err, sp) {
              session.updateAttributes({
                'lastLog.stderr': sp.stderr,
              });
            });
          });

          child.on('error', (err) => {
            // Failed to start subprocess
            sessionProcess.destroy(function(err) {
              if (err) return cb(err);
            });
          });

          child.on('close', (code) => {
            // child process exited with code ${code}
            sessionProcess.destroy(function(err) {
              if (err) return cb(err);
              console.log(
                `>> Process ${sessionProcess.pid} closed`,
                `(code: ${code})`
              );
              if (code != 0) {
                Session.findOne({
                  where: { id: fk },
                }, function(err, session) {
                  if (err) return cb(err);
                  console.log('=== stderr ===');
                  console.log(session.lastLog.stderr);
                  console.log('\n=== stdout ===');
                  console.log(session.lastLog.stdout);
                });
              }
            });
          });

          console.log(`>> Process ${sessionProcess.pid} started`);
          cb(null, {
            sessionId: sessionProcess.sessionId,
            sessionProcessId: sessionProcess.id,
          });
        });
      });
    });
  };

  Project.sessionStop = function(ctx, id, fk, cb) {
    SessionProcess.findOne({
      where: { sessionId: fk },
    }, function(err, sessionProcess) {
      if (err) return cb(err);
      if (!sessionProcess) {
        var error = new Error('Session is not running');
        error.status = 400;
        return cb(error);
      }

      try {
        process.kill(sessionProcess.pid);
      } catch (err) {
        return cb(err);
      }
      sessionProcess.destroy(function(err) {
        if (err) return cb(err);

        cb(null, {
          sessionId: sessionProcess.sessionId,
          sessionProcessId: sessionProcess.id,
          stdout: sessionProcess.stdout,
          stderr: sessionProcess.stderr,
        });
      });
    });
  };
};
