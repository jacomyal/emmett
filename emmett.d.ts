type Handler = (event: Event) => any;

export interface EmmettOptions {
  once?: boolean;
  scope?: any;
}

export interface Event {
  data: any;
  type: string;
  target: Emitter;
}

export type EventName = string | Symbol;

export default class Emitter {
  constructor();

  static version: string;

  // Bind handlers to events:
  on(event: EventName, handler: Handler, options?: EmmettOptions): this;
  on(events: EventName[], handler: Handler, options?: EmmettOptions): this;
  on(eventPattern: RegExp, handler: Handler, options?: EmmettOptions): this;
  on(bindings: { [eventName: string]: Handler }, options?: EmmettOptions): this;
  on(handler: Handler, options?: EmmettOptions): this;
  once(event: EventName, handler: Handler, options?: EmmettOptions): this;
  once(events: EventName[], handler: Handler, options?: EmmettOptions): this;
  once(eventPattern: RegExp, handler: Handler, options?: EmmettOptions): this;
  once(
    bindings: { [eventName: string]: Handler },
    options?: EmmettOptions
  ): this;
  once(handler: Handler, options?: EmmettOptions): this;

  // Unbind handlers:
  unbindAll(): this;
  off(event: EventName): this;
  off(handler: Handler): this;
  off(event: EventName, handler: Handler): this;
  off(events: EventName[], handler: Handler): this;
  off(bindings: { [eventName: string]: Handler }): this;

  // Emit event:
  emit(event: EventName, data?: any): this;
  emit(events: EventName[], data?: any): this;
  emit(events: { [eventName: string]: any }): this;

  // Other:
  listeners(event?: EventName): Handler[];
  enable(): this;
  disable(): this;
  kill(): void;
}
