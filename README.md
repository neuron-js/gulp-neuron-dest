[![Build Status](https://travis-ci.org/neuron-js/gulp-neuron-resources.svg?branch=master)](https://travis-ci.org/neuron-js/gulp-neuron-resources)
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/gulp-neuron-resources.svg)](http://badge.fury.io/js/gulp-neuron-resources)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/gulp-neuron-resources.svg)](https://www.npmjs.org/package/gulp-neuron-resources)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/neuron-js/gulp-neuron-resources.svg)](https://david-dm.org/neuron-js/gulp-neuron-resources)
-->

# gulp-neuron-resources

Copy and encrypt static resources according to neuron.config.js of the project.

This module is design to replace the `gulp.dest`.

## Install

```sh
$ npm install gulp-neuron-resources --save
```

## Usage

```js
var nr = require('gulp-neuron-resources');
gulp.src('/path/to/style.css')
  .pipe(nr());
```

## License

MIT
