var assert = require('assert'),
    emitter = require('../emmett.js');

describe('Emitter', function() {
  describe('events emission', function() {
    var count = 0,
        e = new emitter(),
        callback = function(e) {
          count += e.data.count || 1;
        };

    it('dispatching an event with no trigger does nothing', function() {
      e.emit('myEvent');
      assert.equal(count, 0);
      count = 0;
    });

    it('dispatching an event with a trigger executes the callback', function() {
      e.on('myEvent', callback);
      e.emit('myEvent');
      assert.equal(count, 1);
      count = 0;
    });

    it('data should effectively be given to the callback', function() {
      e.emit('myEvent', { count: 2 });
      assert.equal(count, 2);
      count = 0;
    });

    it('dispatching an event with a trigger than has been unbound does nothing', function() {
      e.off('myEvent', callback);
      e.emit('myEvent');
      assert.equal(count, 0);
      count = 0;
    });

    it('binding a function with "once" set to true should work only once', function() {
      e.once('myOnceEvent', callback);
      e.emit('myOnceEvent');
      assert.equal(count, 1);
      e.emit('myOnceEvent');
      assert.equal(count, 1);
      count = 0;
    });

    it('handlers should be fired using the emitter\'s scope', function() {
      e.on('initEvent', function() {
        this.emit('scopeEvent');
      });
      e.on('scopeEvent', callback);
      e.emit('initEvent');
      assert.strictEqual(count, 1);
    });

    it('handlers should be fired using custom scope if given', function() {
      e.on('customScopeEvent', function() {
        assert.deepEqual(this, { a: 1, b: 2 });
      }, { scope: { a: 1, b: 2 } });
      e.emit('customScopeEvent');
    });

    it('handlers should be fired using custom scope if given (with emmett#on(object))', function() {
      e.on(
        { customScopeEvent2: function() {
            assert.deepEqual(this, { a: 1, b: 2 });
          } },
        { scope: { a: 1, b: 2 } }
      );
      e.emit('customScopeEvent2');
    });

    it('should work with both "once" and "scope" used', function() {
      var scope = { a: 0 };
      e.on(
        'myOnceEvent',
        function() { this.a++ },
        { scope: scope, once: true }
      );
      e.emit('myOnceEvent');
      assert.equal(scope.a, 1);
      e.emit('myOnceEvent');
      assert.equal(scope.a, 1);
    });

    it('should work with a "scope" used with the #once method', function() {
      var scope = { a: 0 };
      e.once(
        'myOnceEvent',
        function() { this.a++ },
        { scope: scope }
      );
      e.emit('myOnceEvent');
      assert.equal(scope.a, 1);
      e.emit('myOnceEvent');
      assert.equal(scope.a, 1);
    });
  });

  describe('api', function() {
    it('unbind polymorphisms should work', function() {
      var count = 0,
          e = new emitter(),
          callback = function() { count++; };

      e.on('myEvent', callback);
      e.off('myEvent', callback);
      e.emit('myEvent');
      assert.equal(count, 0);

      e.on('myEvent', callback);
      e.off(['myEvent', 'anotherEvent'], callback);
      e.emit('myEvent');
      assert.equal(count, 0);

      e.on('myEvent', callback);
      e.unbindAll();
      e.emit('myEvent');
      assert.equal(count, 0);
    });

    it('bind polymorphisms should work', function() {
      var count1 = 0,
          count2 = 0,
          e = new emitter(),
          callback1 = function() { count1++; },
          callback2 = function() { count2++; };

      e.on('myEvent1', callback1);
      e.emit('myEvent1');
      assert.equal(count1, 1);
      e.unbindAll();
      count1 = 0;

      e.on(['myEvent1', 'myEvent2'], callback1);
      e.emit('myEvent1');
      e.emit('myEvent2');
      assert.equal(count1, 2);
      e.unbindAll();
      count1 = 0;

      e.on(callback1);
      e.emit('myEvent1');
      e.emit('myEvent2');
      assert.deepEqual([count1, count2], [2, 0]);
      e.unbindAll();
      count1 = 0;
      count2 = 0;

      e.on({ myEvent1: callback1, myEvent2: callback2 });
      e.emit('myEvent1');
      e.emit('myEvent2');
      assert.deepEqual([count1, count2], [1, 1]);
      e.unbindAll();
      count1 = 0;
      count2 = 0;
    });

    it('giving unrecognized parameters should throw an error', function() {
      var count = 0,
          callback = function() { count++; },
          e = new emitter();

      assert.throws(function() { e.on('myEvent', callback, { blabla: 42 }) });
    });

    it('killing an instance should work', function() {
      var count = 0,
          callback = function() { count++; },
          e = (new emitter()).on('myEvent', callback);

      e.emit('myEvent');
      assert.equal(count, 1);

      e.kill();
      e.emit('myEvent');
      assert.equal(count, 1);

      assert.throws(function() { e.child(); });
      assert.throws(function() { e.on('myEvent', callback) });
      assert.throws(function() { e.off('myEvent', callback) });
    });
  });

  describe('enabling / disabling', function() {
    var count = 0,
        callback = function() { count++; },
        e = (new emitter()).on('myEvent', callback);

    it('should stop emiting events when disabled', function() {
      e.disable();
      e.emit('myEvent');
      assert.equal(count, 0);
    });

    it('should start emiting events again when enabled back', function() {
      e.enable();
      e.emit('myEvent');
      assert.equal(count, 1);
    });
  });
});

describe('Children', function() {
  describe('events propagation', function() {
    var count1 = 0,
        count2 = 0,
        count3 = 0,
        callback1 = function() { count1++; },
        callback2 = function() { count2++; };
        callback3 = function() { count3++; };
        e1 = (new emitter()).on('myEvent', callback1),
        e2 = e1.child().on('myEvent', callback2),
        e3 = e2.child().on('myEvent', callback3);

    it('should propagate from parents to children', function() {
      e1.emit('myEvent');
      assert.equal(count1, 1);
      assert.equal(count2, 1);
      assert.equal(count3, 1);
      count1 = count2 = count3 = 0;

      e2.emit('myEvent');
      assert.equal(count1, 0);
      assert.equal(count2, 1);
      assert.equal(count3, 1);
      count1 = count2 = count3 = 0;
    });

    it('should stop propagation when a child is disabled', function() {
      e1.disable();
      e1.emit('myEvent');
      assert.equal(count1, 0);
      assert.equal(count2, 0);
      assert.equal(count3, 0);
      count1 = count2 = count3 = 0;

      e1.enable();
      e2.disable();
      e1.emit('myEvent');
      assert.equal(count1, 1);
      assert.equal(count2, 0);
      assert.equal(count3, 0);
      count1 = count2 = count3 = 0;

      e2.enable();
      e3.disable();
      e1.emit('myEvent');
      assert.equal(count1, 1);
      assert.equal(count2, 1);
      assert.equal(count3, 0);
      count1 = count2 = count3 = 0;
    });
  });

  describe('killing instances', function() {
    it('should tell the parent when a child is killed', function() {
      var order = '',
          count1 = 0,
          count2 = 0,
          callback1 = function() { count1++; },
          callback2 = function() { count2++; };
          e1 = (new emitter()).on('myEvent', callback1),
          e2 = e1.child().on('myEvent', callback2);

      e1.on('emmett:kill', function() { order += '1'; });
      e2.on('emmett:kill', function() { order += '2'; });

      e2.kill();
      assert.equal(e1._children.length, 0);
      assert.equal(order, '2');

      e1.emit('myEvent');
      assert.equal(count1, 1);
      assert.equal(count2, 0);
    });

    it('should kill the children when the parent is killed', function() {
      var order = '',
          e1 = (new emitter()).on('emmett:kill', function() { order += '1'; }),
          e2 = e1.child().on('emmett:kill', function() { order += '2'; }),
          e3 = e2.child().on('emmett:kill', function() { order += '3'; });

      e1.kill();
      assert.equal(order, '123');
    });
  });
});
