[![Build Status](https://travis-ci.org/neuron-js/gulp-neuron-dest.svg?branch=master)](https://travis-ci.org/neuron-js/gulp-neuron-dest)
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/gulp-neuron-dest.svg)](http://badge.fury.io/js/gulp-neuron-dest)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/gulp-neuron-dest.svg)](https://www.npmjs.org/package/gulp-neuron-dest)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/neuron-js/gulp-neuron-dest.svg)](https://david-dm.org/neuron-js/gulp-neuron-dest)
-->

# gulp-neuron-dest

The `gulp.dest` replacement for neuron.js solutions.

It copies and encrypts static resources according to neuron.config.js of the project.

## Install

```sh
$ npm install gulp-neuron-dest --save
```

## Usage

```js
var dest = require('gulp-neuron-dest');
gulp.src('/path/to/style.css')
  .pipe(dest(options));
```

- **options** 
  - **cache_file**: `path` if specified, the file in the cache will skip building. And the cache_file will be saved when process.exit();

## License

MIT
