'use strict';

var path = require('path');
var spawn = require('child_process').spawn;

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

        var workingDirectory = path.join(
          __dirname,
          '../../../spindle-doctor/src'
        );
        var child = spawn('python', [
          'test.py',
        ], {
          cwd: workingDirectory,
        });

        SessionProcess.create({
          pid: child.pid,
          sessionId: fk,
          stdout: '',
          stderr: '',
        }, function(err, sessionProcess) {
          child.stdout.on('data', function(data) {
            sessionProcess.updateAttributes({
              stdout: sessionProcess.stdout + data,
            });
          });

          child.stderr.on('data', function(data) {
            sessionProcess.updateAttributes({
              stderr: sessionProcess.stderr + data,
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
            });
          });

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
