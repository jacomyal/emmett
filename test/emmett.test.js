var assert = require('assert'),
    emitter = require('../emmett.js');

describe('Emitter', function() {
  describe('basics', function() {
    var count = 0,
        e = new emitter(),
        callback = function(e) {
          count += e.data.count || 1;
        };

    it('dispatching an event with no trigger does nothing.', function() {
      e.emit('myEvent');
      assert.strictEqual(count, 0);
    });

    it('dispatching an event with a trigger executes the callback.', function() {
      e.on('myEvent', callback);
      e.emit('myEvent');
      assert.strictEqual(count, 1);
    });

    it('dispatching an event with a trigger executes the callback.', function() {
      e.emit('myEvent', { count: 2 });
      assert.strictEqual(count, 3);
    });

    it('dispatching an event with a trigger than has been unbound does nothing.', function() {
      e.off('myEvent', callback);
      e.emit('myEvent');
      assert.strictEqual(count, 3);
    });
  });

  describe('api', function() {
    it('unbind polymorphisms should work.', function() {
      var count = 0,
          e = new emitter(),
          callback = function() { count++; };

      e.on('myEvent', callback);
      e.off('myEvent', callback);
      e.emit('myEvent');
      assert.strictEqual(count, 0);

      e.on('myEvent', callback);
      e.off(['myEvent', 'anotherEvent'], callback);
      e.emit('myEvent');
      assert.strictEqual(count, 0);

      e.on('myEvent', callback);
      e.off('myEvent');
      e.emit('myEvent');
      assert.strictEqual(count, 0);

      e.on('myEvent', callback);
      e.off();
      e.emit('myEvent');
      assert.strictEqual(count, 0);
    });

    it('bind polymorphisms should work.', function() {
      var count1 = 0,
          count2 = 0,
          e = new emitter(),
          callback1 = function() { count1++; },
          callback2 = function() { count2++; };

      e.on('myEvent1', callback1);
      e.emit('myEvent1');
      assert.strictEqual(count1, 1);
      e.off();
      count1 = 0;

      e.on(['myEvent1', 'myEvent2'], callback1);
      e.emit('myEvent1');
      e.emit('myEvent2');
      assert.strictEqual(count1, 2);
      e.off();
      count1 = 0;

      e.on(callback1);
      e.emit('myEvent1');
      e.emit('myEvent2');
      assert.deepEqual([count1, count2], [2, 0]);
      e.off();
      count1 = 0;
      count2 = 0;

      e.on({ myEvent1: callback1, myEvent2: callback2 });
      e.emit('myEvent1');
      e.emit('myEvent2');
      assert.deepEqual([count1, count2], [1, 1]);
      e.off();
      count1 = 0;
      count2 = 0;
    });
  });
});

describe('Binder', function() {
  describe('basics', function() {
    var count1,
        count2,
        e = new emitter(),
        callback1 = function() { count1++; },
        callback2 = function() { count2++; },
        binder = e.binder({ myEvent1: callback1 });

    it('creating a binding binds the related functions.', function() {
      count1 = 0;
      e.emit('myEvent1');
      assert.strictEqual(count1, 1);
    });

    it('binder.on binds functions to the related e.', function() {
      count2 = 0;
      binder.on('myEvent2', callback2);
      e.emit('myEvent2');
      assert.strictEqual(count2, 1);
    });

    it('binder.off unbinds functions from the related e.', function() {
      count2 = 0;
      binder.off('myEvent2', callback2);
      e.emit('myEvent2');
      assert.strictEqual(count2, 0);
    });

    it('binder.disable unbinds all functions from the related e.', function() {
      count1 = 0;
      binder.disable();
      e.emit('myEvent1');
      assert.strictEqual(count1, 0);
    });

    it('binder.enable rebinds all functions to the related e.', function() {
      count1 = 0;
      binder.enable();
      e.emit('myEvent1');
      assert.strictEqual(count1, 1);
    });
  });

  describe('api', function() {
    it('unbind polymorphisms should work.', function() {
      var count = 0,
          e = new emitter(),
          callback = function() { count++; },
          binder = e.binder();

      binder.on('myEvent', callback);
      binder.off('myEvent', callback);
      e.emit('myEvent');
      assert.strictEqual(count, 0);

      binder.on('myEvent', callback);
      binder.off(['myEvent', 'anotherEvent'], callback);
      e.emit('myEvent');
      assert.strictEqual(count, 0);

      binder.on('myEvent', callback);
      binder.off('myEvent');
      e.emit('myEvent');
      assert.strictEqual(count, 0);

      binder.on('myEvent', callback);
      binder.off();
      e.emit('myEvent');
      assert.strictEqual(count, 0);
    });

    it('bind polymorphisms should work.', function() {
      var count1 = 0,
          count2 = 0,
          e = new emitter(),
          callback1 = function() { count1++; },
          callback2 = function() { count2++; },
          binder = e.binder();

      binder.on('myEvent1', callback1);
      e.emit('myEvent1');
      assert.strictEqual(count1, 1);
      binder.off();
      count1 = 0;

      binder.on(['myEvent1', 'myEvent2'], callback1);
      e.emit('myEvent1');
      e.emit('myEvent2');
      assert.strictEqual(count1, 2);
      binder.off();
      count1 = 0;

      binder.on(callback1);
      e.emit('myEvent1');
      e.emit('myEvent2');
      assert.deepEqual([count1, count2], [2, 0]);
      binder.off();
      count1 = 0;
      count2 = 0;

      binder.on({ myEvent1: callback1, myEvent2: callback2 });
      e.emit('myEvent1');
      e.emit('myEvent2');
      assert.deepEqual([count1, count2], [1, 1]);
      binder.off();
      count1 = 0;
      count2 = 0;
    });
  });
});
