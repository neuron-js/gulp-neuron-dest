'use strict';

module.exports = task;

var node_path = require('path');
var node_url = require('url');

var through = require('through2');
var absolutize = require('absolutize-css-resources');
var package_root = require('neuron-package-root');
var hash_fs = require('hashed-fs');
var cryto = require('crypto');

var root;
function get_package_root (filepath, callback) {
  // suppose that during one buiding section,
  // the package root will be the same
  if (root) {
    return callback(root);
  }

  package_root(filepath, callback);
}


function plugin_error (self, message, callback) {
  var error = typeof message === 'string'
    ? new PluginError('gulp-neuron-resources', message)
    : message;

  self.emit('error', error);
  callback && callback();
}


// @param {Object} options
// - output_dir `path`
// - compiler
function task (options) {
  return through.obj(function (file, transform, callback) {
    var cdn_domain = process.env.NEURON_CDN_DOMAIN;
    if (!cdn_domain) {
      plugin_error(this, 'env.NEURON_CDN_DOMAIN must be defined.');
    }

    if(file.isStream()){
      plugin_error(this, 'streaming not supported');
      return callback();
    }

    var self = this;
    var filename = file.path;
    package_root(filename, function (root) {
      if (!root) {
        plugin_error(self, 'no neuron.config.js found.');
        return callback();
      }

      var neuron_config_js = node_path.join(root, 'neuron.config.js');
      var config = require(neuron_config_js);
      
      var hfs = hash_fs();
      var extname = node_path.extname(filename);
      if (extname == '.css') {
        absolutize(file.contents, {
          filename: filename,
          filebase: config.root,
          resolve: function(path){
            var done = this.async();
            var image_source = node_url.resolve(config.root, path);
            var image_dest = node_url.resolve(config.dest, path);
            var image_resolved = node_url.resolve(cdn_domain, path);
            hfs.copy(image_source, image_dest, function (err, hash) {
              if (err) {
                return done(err);
              }
              hash_fs.decorate(image_resolved, hash, done);
            });
          }
        }, function (err, content) {
          if (err) {
            plugin_error(self, err);
            return callback();
          }

          var relative = node_path.relative(config.root, filename);
          var dest = node_path.join(config.dest, relative);
        });

        return callback();
      }

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
