export interface KeyboardShortcutHandler {
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  /** Key as reported in the KeyboardEvent, see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key */
  key: string;
  handler: (ev: KeyboardEvent) => { shouldStopProcessing: boolean };
}

export class KeyboardShortcutHandlerBuilder {
  #alt = false;
  #ctrl = false;
  #meta = false;
  #shift = false;
  #stopPropagation = false;
  #preventDefault = false;
  #key: string | undefined = undefined;

  constructor(
    initial?:
      | string
      | {
          alt?: boolean;
          ctrl?: boolean;
          meta?: boolean;
          shift?: boolean;
          stopPropagation?: boolean;
          preventDefault?: boolean;
          key?: string;
        },
  ) {
    if (initial) {
      if (typeof initial === "string") {
        this.#key = initial;
        return;
      }
      this.#alt = initial.alt ?? false;
      this.#ctrl = initial.ctrl ?? false;
      this.#meta = initial.meta ?? false;
      this.#shift = initial.shift ?? false;
      this.#stopPropagation = initial.stopPropagation ?? false;
      this.#preventDefault = initial.preventDefault ?? false;
      this.#key = initial.key;
    }
  }

  alt() {
    this.#alt = true;
    return this;
  }

  ctrl() {
    this.#ctrl = true;
    return this;
  }

  meta() {
    this.#meta = true;
    return this;
  }

  shift() {
    this.#shift = true;
    return this;
  }

  stopPropagation() {
    this.#stopPropagation = true;
    return this;
  }

  preventDefault() {
    this.#preventDefault = true;
    return this;
  }

  key(key: string) {
    this.#key = key;
    return this;
  }

  handle(handler: (ev: KeyboardEvent) => { shouldStopProcessing: boolean }) {
    if (this.#key === undefined) {
      throw new Error("Key must be set before setting the handler");
    }
    if (handler === undefined) {
      throw new Error("Handler must be set");
    }
    const shouldStopPropagation = this.#stopPropagation;
    const shouldPreventDefault = this.#preventDefault;
    return {
      alt: this.#alt,
      ctrl: this.#ctrl,
      meta: this.#meta,
      shift: this.#shift,
      key: this.#key,
      handler: (ev: KeyboardEvent) => {
        if (shouldStopPropagation) ev.stopPropagation();
        if (shouldPreventDefault) ev.preventDefault();
        return handler(ev);
      },
    };
  }

  handleAndStop(handler: (ev: KeyboardEvent) => void) {
    return this.handle((ev) => {
      handler(ev);
      return { shouldStopProcessing: true };
    });
  }
}

export const k = (initial?: ConstructorParameters<typeof KeyboardShortcutHandlerBuilder>[0]) =>
  new KeyboardShortcutHandlerBuilder(initial);
export const ksd = (initial?: ConstructorParameters<typeof KeyboardShortcutHandlerBuilder>[0]) =>
  new KeyboardShortcutHandlerBuilder(initial).stopPropagation().preventDefault();
