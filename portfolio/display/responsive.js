
'use strict';


export class Responsive {
  static get mobile() {
    return     navigator.userAgent.match(/Android/i)
            || navigator.userAgent.match(/webOS/i)
            || navigator.userAgent.match(/iPhone/i)
            || navigator.userAgent.match(/BlackBerry/i)
            || navigator.userAgent.match(/Windows Phone/i);
  }
}

export class StatefulGapped {
  constructor(
    states = [],
    gap_size = 1,
    iteration = 0,
    starting_index = 0,
  ) {
    this.#states = states;
    this.#gap_size = gap_size;
    this.#iteration = iteration;
    this.#index = starting_index;
  }

  #index;
  #gap_size;
  #iteration;
  #states;

  get state() {
    return this.#states[this.#index];
  }

  get next() {
    if (
      this.#index === this.#states.length - 1 &&
      this.#iteration === this.#gap_size - 1
    ) return this.state;

    if (++this.#iteration % this.#gap_size === 0) {
      this.#index++;
      this.#iteration = 0;
    }

    return this.state;
  };

  get back() {
    if (
      this.#index === 0 &&
      this.#iteration === 1
    ) return this.state;

    if (--this.#iteration % this.#gap_size === 0) {
      this.#index--;
      this.#iteration = 0;
    }

    return this.state;
  };
}
