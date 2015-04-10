var assert = require('assert'),
    emitter = require('../emmett.js');

describe('Emitter', function() {
  describe('events emission', function() {
    var count = 0,
        e = new emitter(),
        callback = function(e) {
          count += e.data.count || 1;
        };

    it('unregistering event in emit callback should work', function() {
      var callback = function () {
        e.off('myEvent', callback);
        count++;
      };
      e.on('myEvent', callback);
      e.emit('myEvent');
      e.emit('myEvent');
      assert.equal(count, 1);
      count = 0;
    });

    it('unregistering other event in emit callback should work', function() {
      var callback = function () {
        e.off('myEvent2', callback);
        count++;
      };
      e.once('myEvent', callback);
      e.on('myEvent2', callback);
      e.emit('myEvent');
      e.emit('myEvent2');
      assert.equal(count, 1);
      count = 0;
    });

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

    it('should guarantee binding order.', function() {
      var results = [],
          ne = new emitter();

      ne.on('event', function() {
        results.push(1);
      });

      ne.on(function() {
        results.push(2);
      });

      ne.emit('event');
      assert.deepEqual(results, [1, 2]);
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

    it('emit polymorphism should work.', function() {
      var count = 0,
          callback = function(e) { count += e.data; },
          e = new emitter();

      e.on('event1', callback);
      e.on('event2', callback);

      e.emit({
        event1: 2,
        event2: 3
      });

      assert.strictEqual(count, 5);
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

  describe('Retrieving listeners', function() {
    it('should be possible to retrieve an emitter\'s listeners', function() {
      var ee = new emitter(),
          fn = function test() {};

      var m = function(hs) {
        return hs.map(function(h) {
          return h.handler;
        });
      };

      ee.on(fn);
      ee.on('event1', fn);
      ee.on('event2', fn);

      assert.deepEqual(m(ee.listeners()), [fn, fn, fn]);
      assert.deepEqual(m(ee.listeners('event1')), [fn, fn]);
    });
  });
});
