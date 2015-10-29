'use strict';

module.exports = task;

var fs = require('fs');

var through = require('through2');
var absolutize = require('absolutize-css-resources');
var package_root = require('neuron-package-root');


// @param {Object} options
// - output_dir `path`
function task (options) {
  return through.obj(function (file, transform, callback) {
    if(file.isStream()){
      this.emit('error', new PluginError('gulp-neuron-resources', 'Streaming not supported'));
      return callback();
    }

    var self = this;
    var filename = file.path;
    package_root(file.path, function (root) {
      self._render(file.path, String(file.contents), function (err, rendered) {
        if (err) {
          this.emit('error', err);
          return callback();
        }

        file.contents = new Buffer(rendered);
        this.push(file);
        callback();

      }.bind(this));
    });
  });
}
