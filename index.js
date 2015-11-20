'use strict';

module.exports = task;

var node_path = require('path');
var node_url = require('url');
var cryto = require('crypto');

var through = require('through2');
var absolutize = require('absolutize-css-resources');
var package_root = require('neuron-package-root');
var hash_fs = require('hashed-fs');
var PluginError = require('gulp-util').PluginError;

Error.stackTraceLimit = Infinity;

var root;
function get_package_root (filepath, callback) {
  // suppose that during one buiding section,
  // the package root will be the same
  if (root) {
    return callback(root);
  }

  package_root(filepath, callback);
}


// @param {Object} options
// - output_dir `path`
// - compiler
function task (options) {
  function copy (file, transform, callback) {
    var hfs = hash_fs();

    function cb (err) {
      if (err) {
        var error = typeof err === 'string'
          ? new PluginError('gulp-neuron-dest', err)
          : err;
        hfs.cache.remove(file.path);
        return callback(err);
      }

      callback(null);
    }

    var cdn_domain = process.env.NEURON_CDN_DOMAIN;
    if (!cdn_domain) {
      return cb('env.NEURON_CDN_DOMAIN must be defined.');
    }

    if(file.isStream()){
      return cb('streaming not supported');
    }

    var filename = file.path;
    package_root(filename, function (root) {
      if (!root) {
        return cb('no neuron.config.js found.');
      }

      var neuron_config_js = node_path.join(root, 'neuron.config.js');
      var config = require(neuron_config_js);

      // TODO: use neuron-config-js to deal with absolute paths
      config.dist = node_path.resolve(root, config.dist);
      config.release = node_path.resolve(root, config.release);
      
      var extname = node_path.extname(filename);
      var relative = node_path.relative(config.dist, filename);
      var dest = node_path.join(config.release, relative);

      // Handle css files, absolutize css images
      if (extname !== '.css') {
        return hfs.copy(filename, dest, cb);
      }

      absolutize(file.contents, {
        filename: filename,
        filebase: config.dist,
        resolve: function(path){
          var done = this.async();
          var image_source = node_path.resolve(config.dist, path);
          var image_dest = node_path.resolve(config.release, path);
          var image_resolved = node_url.resolve(cdn_domain, path);

          function d (err) {
            if (err) {
              hfs.cache.remove(image_source);
              return done(err);
            }

            done(null);
          }

          // Copy images into dest dir, including copies with encrypted filename
          hfs.copy(image_source, image_dest, function (err, hash) {
            if (err) {
              return d(err);
            }
            hfs.decorate(image_resolved, hash, d);
          });
        }
      }, function (err, content) {
        if (err) {
          return cb(err);
        }

        hfs.writeFile(dest, content, cb);
      });
    });
  }

  return through.obj(copy);
}
