var lab = require('lab').script();
var assert = require('assert');
var forceArray = require('../');


lab.suite('force-array', function() {
  lab.test('empty', function(done) {
    assert.deepEqual(forceArray(), []);
    done();
  });

  lab.test('to array', function(done) {
    assert.deepEqual(forceArray(1), [1]);
    done();
  });

  lab.test('keep array', function(done) {
    assert.deepEqual(forceArray([1]), [1]);
    done();
  });

  lab.test('concat array', function(done) {
    assert.deepEqual(forceArray([1], [2, 3]), [1, 2, 3]);
    done();
  });

  lab.test('concat array and number', function(done) {
    assert.deepEqual(forceArray([1], 2), [1, 2]);
    done();
  });

  lab.test('concat numbers', function(done) {
    assert.deepEqual(forceArray(1, 2), [1, 2]);
    done();
  });
});

exports.lab = lab;