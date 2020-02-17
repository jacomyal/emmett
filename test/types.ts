import Emitter, { Handler } from "../emmett";

const emitterNames = new Map();
const handler1: Handler = function(event) {
  console.log("Received event:", event.type);
  console.log("  - Data:", event.data);
  console.log("  - Target:", emitterNames.get(event.target));
  console.log("");
};
const handler2: Handler = function(event) {
  console.log("(handler2 here)");
  handler1(event);
};
const handler3: Handler = function(e) {
  console.log("(handler3 here)");
};

const symbolE = Symbol("eventE");
const symbolF = Symbol("eventF");

// #on
const emitter1 = new Emitter();
emitterNames.set(emitter1, "Emitter 1");
emitter1.on("eventA", handler1);
emitter1.on(["eventB", "eventC"], handler1);
emitter1.on(/eventD/, handler2);
emitter1.on(symbolE, handler1);
emitter1.on([symbolF], handler2);
emitter1.on(handler3);

// #emit
console.log("Everybody should emit twice:");
console.log("");
[..."ABCD"].forEach(c => emitter1.emit("event" + c, { payload1: c }));
emitter1.emit([symbolE, symbolF], { payload: "common payload" });
emitter1.emit({
  ...[..."ABCD"].reduce(
    (events, c) => ({
      ...events,
      ["event" + c]: { payload2: c }
    }),
    {}
  ),
  [symbolE]: { payload2: symbolE },
  [symbolF]: { payload2: symbolF }
});

// #off
emitter1.off("eventA");
emitter1.off("eventB", handler1);
emitter1.off(["eventC"], handler1);
emitter1.off({ eventD: handler1 });
emitter1.off(symbolE);
emitter1.off(handler2).off(handler3);

console.log("Nobody should emit:");
console.log("");

[..."ABCD"].forEach(c => emitter1.emit("event" + c, { payload1: c }));
emitter1.emit([symbolE, symbolF], { payload: "common payload" });

// #listeners
emitter1.listeners(symbolE);

// #unbindAll
emitter1.unbindAll();

// #once
const emitter2 = new Emitter();
emitterNames.set(emitter2, "Emitter 2");

console.log("Everybody should emit once:");
console.log("");
emitter2.once("eventA", handler1);
emitter2.once(["eventB", "eventC"], handler1);
emitter2.once(/eventD/, handler2);
emitter2.once(symbolE, handler1);
emitter2.once([symbolF], handler2);
emitter2.once(handler3);
[..."AABBCCDD"].forEach(c => emitter2.emit("event" + c, { payload: c }));
emitter2.emit([symbolE, symbolE, symbolF, symbolF], {
  payload: "common payload"
});

// other methods and properties
let emitter3: Emitter = new Emitter();
emitter3 = emitter3.disable();
emitter3 = emitter3.enable();
const value: void = emitter3.kill();

const version: string = Emitter.version;
