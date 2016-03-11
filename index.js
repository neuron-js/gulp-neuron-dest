'use strict'

module.exports = task

var node_path = require('path')
var node_url = require('url')
var cryto = require('crypto')

var through = require('through2')
var absolutize = require('absolutize-css-resources')
var nconfig = require('neuron-project-config')
var hash_fs = require('hashed-fs')
var PluginError = require('gulp-util').PluginError
var fs = require('fs')

Error.stackTraceLimit = Infinity

var config
function get_project_config (filepath, callback) {
  // suppose that during one buiding section,
  // the package root will be the same
  if (config) {
    return callback(null, config)
  }

  nconfig.read(filepath, function (err, c) {
    if (err) {
      return callback(err)
    }

    config = c
    callback(null, c)
  })
}


var hash_fs_map = {}
function create_hash_fs (root) {
  if (root in hash_fs_map) {
    return hash_fs_map[root]
  }

  var cache_file = node_path.join(root, '.modified-cache')
  var hfs = hash_fs({
    cache_file: cache_file
  })

  var md5_file = node_path.join(root, '.md5-cache')
  var cache = {}
  var map = {}

  try {
    cache = JSON.parse(fs.readFileSync(md5_file).toString())
  } catch(e) {
    console.log('no md5 cache file found')
  }

  var file
  for (file in cache){
    map[node_path.join(config.dist, file)] = cache[file]
  }

  var obj = hash_fs_map[root] = {
    fs: hfs,
    map: map
  }
  return obj
}


process.on('exit', function () {
  Object.keys(hash_fs_map).forEach(function (root) {
    var obj = hash_fs_map[root]
    var hfs = obj.fs
    var map = obj.map
    hfs.cache.saveSync()

    var md5_file = node_path.join(root, '.md5-cache')
    var file
    var relative
    var relative_map = {}

    for (file in map) {
      relative = node_path.relative(config.dist, file)
      relative_map[relative] = map[file]
    }

    fs.writeFileSync(md5_file, JSON.stringify(relative_map, null, 2))
  })
})


var REGEX_PARSE_QUERY = /(.*?)(\?.*)?$/
function parse_path (path) {
  var match = path.match(REGEX_PARSE_QUERY)
  return {
    path: match[1],
    search: match[2] || ''
  }
}


// @param {Object} options
// - output_dir `path`
// - compiler
function task (options) {
  options = options || {}

  function copy (file, transform, callback) {
    function cb (err, hash) {
      if (err) {
        hfs.cache.remove(file.path)
        return callback(err)
      }

      if (hash && map) {
        map[filename] = hash
      }

      callback(null)
    }

    var hfs
    var cdn_domain = process.env.NEURON_CDN_DOMAIN
    if (!cdn_domain) {
      return callback(new PluginError('gulp-neuron-dest', 'env.NEURON_CDN_DOMAIN must be defined.'))
    }

    if(file.isStream()){
      return callback(new PluginError('gulp-neuron-dest', 'streaming not supported'))
    }

    var filename = file.path
    var map
    get_project_config(filename, function (err, config) {
      if (err) {
        return callback(err)
      }

      var cache_root = options.cache_root
      var obj = create_hash_fs(cache_root)
      hfs = obj.fs
      map = obj.map

      var extname = node_path.extname(filename)
      var relative = node_path.relative(config.dist, filename)
      var dest = node_path.join(config.release, relative)

      // Handle css files, absolutize css images
      if (extname !== '.css') {
        return hfs.stat(filename, function (err, stat, hash, cached) {
          if (err) {
            return cb(err)
          }

          // if cached, skip writeFile.
          if (cached
            // make sure the filename is not missing
            && (filename in map)
          ) {
            console.log('skipped: ' + filename)
            return cb(null)
          }

          hfs.writeFile(dest, file.contents, cb)
        })
      }

      // Css files are special.
      // If a css file doesn't change, but its css images changed,
      // the path of each image should be changed.
      // To make it simple, we always build css files
      absolutize(file.contents, {
        filename: filename,
        filebase: config.dist,
        resolve: function(path){
          var done = this.async()
          var parsed = parse_path(path)
          var search_query = parsed.search
          path = parsed.path

          var image_source = node_path.resolve(config.dist, path)
          var image_resolved = node_url.resolve(cdn_domain, path)

          function d (err, resolved) {
            if (err) {
              hfs.cache.remove(image_source)
              return done(err)
            }

            done(null, resolved)
          }

          // Copy images into dest dir, including copies with encrypted filename
          hfs.stat(image_source, function (err, stat, hash) {
            if (err) {
              return d(err)
            }
            hfs.decorate(image_resolved + search_query, hash, d)
          })
        }
      }, function (err, content) {
        if (err) {
          return cb(err)
        }

        hfs.writeFile(dest, content, cb)
      })
    })
  }

  return through.obj(copy)
}
