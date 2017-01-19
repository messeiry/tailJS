# force-array

[![](https://img.shields.io/travis/ramitos/force-array.svg)](https://travis-ci.org/ramitos/force-array) [![](https://img.shields.io/codeclimate/coverage/github/ramitos/force-array.svg)](https://codeclimate.com/github/ramitos/force-array/coverage) [![](https://img.shields.io/npm/v/force-array.svg)](https://www.npmjs.com/package/force-array) [![](https://img.shields.io/david/ramitos/force-array.svg)](https://david-dm.org/ramitos/force-array) [![](https://img.shields.io/codeclimate/github/ramitos/force-array.svg)](https://codeclimate.com/github/ramitos/force-array) [![](https://img.shields.io/npm/l/force-array.svg)](https://www.npmjs.com/package/force-array)


```js
var assert = require('assert');
var forceArray = require('./');

assert.deepEqual(forceArray(), []);
assert.deepEqual(forceArray(1), [1]);
assert.deepEqual(forceArray([1]), [1]);
assert.deepEqual(forceArray.concat([1], [2, 3]), [1, 2, 3]);
assert.deepEqual(forceArray.concat([1], 2), [1, 2]);
assert.deepEqual(forceArray.concat(1, 2), [1, 2]);
```

## install 

```bash
npm install [--save/--save-dev] force-array
```

## license

MIT