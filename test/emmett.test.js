var assert = require('assert'),
  Emitter = require('../emmett.js');

describe('Emitter', function() {
  describe('Events emission', function() {
    var mainCount = 0,
      emitter = new Emitter(),
      mainCallback = function(event) {
        mainCount += (event.data || {}).count || 1;
      };

    it('unregistering event in emit callback should work', function() {
      var callback = function() {
        emitter.off('myEvent', callback);
        mainCount++;
      };
      emitter.on('myEvent', callback);
      emitter.emit('myEvent');
      emitter.emit('myEvent');
      assert.equal(mainCount, 1);
      mainCount = 0;
    });

    it('unregistering other event in emit callback should work', function() {
      var callback = function() {
        emitter.off('myEvent2', callback);
        mainCount++;
      };
      emitter.once('myEvent', callback);
      emitter.on('myEvent2', callback);
      emitter.emit('myEvent');
      emitter.emit('myEvent2');
      assert.equal(mainCount, 1);
      mainCount = 0;
    });

    it('dispatching an event with no trigger does nothing', function() {
      emitter.emit('myEvent');
      assert.equal(mainCount, 0);
      mainCount = 0;
    });

    it('dispatching an event with a trigger executes the callback', function() {
      emitter.on('myEvent', mainCallback);
      emitter.emit('myEvent');
      assert.equal(mainCount, 1);
      mainCount = 0;
    });

    it('data should effectively be given to the callback', function() {
      emitter.emit('myEvent', {count: 2});
      assert.equal(mainCount, 2);
      mainCount = 0;
    });

    it('dispatching an event with a trigger than has been unbound does nothing', function() {
      emitter.off('myEvent', mainCallback);
      emitter.emit('myEvent');
      assert.equal(mainCount, 0);
      mainCount = 0;
    });

    it('binding a function with "once" set to true should work only once', function() {
      emitter.once('myOnceEvent', mainCallback);
      emitter.emit('myOnceEvent');
      assert.equal(mainCount, 1);
      emitter.emit('myOnceEvent');
      assert.equal(mainCount, 1);
      mainCount = 0;
    });

    it('handlers should be fired using the emitter\'s scope', function() {
      emitter.on('initEvent', function() {
        this.emit('scopeEvent');
      });
      emitter.on('scopeEvent', mainCallback);
      emitter.emit('initEvent');
      assert.strictEqual(mainCount, 1);
    });

    it('handlers should be fired using custom scope if given', function() {
      emitter.on(
        'customScopeEvent',
        function() {
          assert.deepEqual(this, {a: 1, b: 2});
        },
        {scope: {a: 1, b: 2}}
      );
      emitter.emit('customScopeEvent');
    });

    it('handlers should be fired using custom scope if given (with emmett#on(object))', function() {
      emitter.on(
        {
          customScopeEvent2: function() {
            assert.deepEqual(this, {a: 1, b: 2});
          }
        },
        {scope: {a: 1, b: 2}}
      );
      emitter.emit('customScopeEvent2');
    });

    it('should work with both "once" and "scope" used', function() {
      var scope = {a: 0};
      emitter.on(
        'myOnceEvent',
        function() {
          this.a++;
        },
        {scope: scope, once: true}
      );
      emitter.emit('myOnceEvent');
      assert.equal(scope.a, 1);
      emitter.emit('myOnceEvent');
      assert.equal(scope.a, 1);
    });

    it('should work with a "scope" used with the #once method', function() {
      var scope = {a: 0};
      emitter.once(
        'myOnceEvent',
        function() {
          this.a++;
        },
        {scope: scope}
      );
      emitter.emit('myOnceEvent');
      assert.equal(scope.a, 1);
      emitter.emit('myOnceEvent');
      assert.equal(scope.a, 1);
    });

    it('should guarantee binding order.', function() {
      var results = [],
        ne = new Emitter();

      ne.on('event', function() {
        results.push(1);
      });

      ne.on(function() {
        results.push(2);
      });

      ne.emit('event');
      assert.deepEqual(results, [1, 2]);
    });

    it('should be possible to bind regexes.', function() {
      var count = 0,
        ne = new Emitter(),
        callback = function() {
          count++;
        };

      ne.on(/^event/, callback);
      ne.on(/event\d+/, callback);

      ne.emit('event1');
      ne.emit('eventOne');

      assert.strictEqual(count, 3);
    });

    it('should be possible to bind symbols.', function() {
      var count = 0,
        ne = new Emitter(),
        callback = function() {
          count++;
        };

      var s = Symbol('test');

      ne.on(s, callback);
      ne.emit(s);
      ne.off(s, callback);
      ne.emit(s);

      assert.strictEqual(count, 1);
    });

    it('should work with all the different polymorphisms.', function() {
      var count = 0,
        ne = new Emitter(),
        callback = function(e) {
          if (e.data.nb) count += e.data.nb;
          else count++;
        };

      var s1 = Symbol(),
        s2 = Symbol();

      var binding = {};
      binding[s1] = callback;
      binding[s2] = callback;

      ne.on(binding);

      var emitting = {};
      emitting[s1] = {};
      emitting[s2] = {nb: 2};

      ne.emit(emitting);

      assert.strictEqual(count, 3);

      ne.off(binding);

      ne.emit(emitting);

      assert.strictEqual(count, 3);
    });

    it('should work with #off and symbols (regression #28).', function() {
      var count = 0,
        ne = new Emitter(),
        callback = function() {
          count++;
        };

      var s = Symbol('test');

      ne.on(s, callback);
      ne.emit(s);
      ne.off(callback);
      ne.emit(s);

      assert.strictEqual(count, 1);
    });

    it('should work with symbols and complex handlers (regression #29).', function() {
      var ne = new Emitter();

      ne.on(/some pattern/, function() {});
      ne.emit(Symbol('test'));

      assert.ok(true);
    });

    it('onces should be unbound in the correct order.', function() {
      var count = 0,
        ne = new Emitter(),
        callback = function() {
          count++;
        };

      ne.once('event', callback);
      ne.once('event', callback);

      ne.emit('event');

      assert.strictEqual(count, 2);

      ne.emit('event');

      assert.strictEqual(count, 2);
    });

    it('should only emit once in this edge case.', function() {
      var count = 0,
        ne = new Emitter(),
        callback1 = function() {
          count++;
        },
        callback2 = function() {
          count++;
        };

      ne.once('myEvent', callback1);
      ne.once('myEvent', callback2);

      ne.off('myEvent', callback1);

      ne.emit('myEvent');
      ne.emit('myEvent');

      assert.equal(count, 1);
      count = 0;
    });
  });

  describe('API', function() {
    it('unbind polymorphisms should work', function() {
      var count = 0,
        e = new Emitter(),
        callback = function() {
          count++;
        };

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

      e.on('event1', callback);
      e.on('event2', callback);
      e.off({
        event1: callback,
        event2: callback
      });
      e.emit(['event1', 'event2']);
      assert.strictEqual(count, 0);

      e.on('myEvent', callback);
      e.on('myEvent', callback);
      e.off('myEvent');
      e.emit('myEvent');
      assert.strictEqual(count, 0);
    });

    it('bind polymorphisms should work', function() {
      var count1 = 0,
        count2 = 0,
        e = new Emitter(),
        callback1 = function() {
          count1++;
        },
        callback2 = function() {
          count2++;
        };

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

      e.on({myEvent1: callback1, myEvent2: callback2});
      e.emit('myEvent1');
      e.emit('myEvent2');
      assert.deepEqual([count1, count2], [1, 1]);
      e.unbindAll();
      count1 = 0;
      count2 = 0;
    });

    it('emit polymorphism should work.', function() {
      var count = 0,
        callback = function(e) {
          count += e.data;
        },
        e = new Emitter();

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
        callback = function() {
          count++;
        },
        e = new Emitter().on('myEvent', callback);

      e.emit('myEvent');
      assert.equal(count, 1);

      e.kill();
      e.emit('myEvent');
      assert.equal(count, 1);
    });
  });

  describe('Enabling / disabling', function() {
    var count = 0,
      callback = function() {
        count++;
      },
      e = new Emitter().on('myEvent', callback);

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
      var ee = new Emitter(),
        fn = function test() {};

      var m = function(hs) {
        return hs.map(function(h) {
          return h.fn;
        });
      };

      ee.on(fn);
      ee.on('event1', fn);
      ee.on('event2', fn);

      assert.deepEqual(m(ee.listeners('event1')), [fn, fn]);
      assert.deepEqual(m(ee.listeners('event2')), [fn, fn]);
    });
  });
});
