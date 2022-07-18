
'use strict';


export class Vector {
  constructor(x = 0, y = 0) {
    this.#_x = x;
    this.#_y = y;
  }

  #_x;
  #_y;

  get x() {
    return this.#_x;
  }
  get y() {
    return this.#_y;
  }
  set x(val) {
    this.#_x = val;
  }
  set y(val) {
    this.#_y = val;
  }

  copy = () => {
    return new Vector(this.#_x, this.#_y);
  };
  clone = this.copy;

  add = (v) => {
    this.#_x += v.x || 0;
    this.#_y += v.y || 0;
    return this;
  };
  sub = (v) => {
    this.#_x -= v.x || 0;
    this.#_y -= v.y || 0;
    return this;
  };
  mult = (v) => {
    if (v instanceof Vector) {
      this.#_x *= v.x;
      this.#_y *= v.y;
    }
    else {
      this.#_x *= v;
      this.#_y *= v;
    }
    return this;
  };
  div = (v) => {
    if (v instanceof Vector) {
      this.#_x /= v.x;
      this.#_y /= v.y;
    }
    else {
      this.#_x /= v;
      this.#_y /= v;
    }
    return this;
  };
  dot = (v) => {
    return this.#_x * (v.x || 0) + this.#_y * (v.y || 0);
  };
  rem = (v) => {  //TODO
    this.#_x += v.x || 0;
    this.#_y += v.y || 0;
    return this;
  };

  cross = (v) => {  // TODO
    return new Vector(this.#_x, this.#_y);
  };
  dist = (v) => {
    return v.copy().sub(this).mag();
  };
  normalize = () => {
    const len = this.mag();
    if (len !== 0) this.mult(1 / len);
    return this;
  };
  limit = (max) => {
    const magSq = this.magSq();
    if (magSq > max ** 2) this.div(Math.sqrt(magSq)).mult(max);
    return this;
  };

  heading = () => {
    const h = Math.atan2(this.#_y, this.#_x);
    return h;// TODO fromRadians
  };
  setHeading = (a) => {
    const m = this.mag();
    this.#_x = m * Math.cos(a);
    this.#_y = m * Math.sin(a);
    return this;
  };
  rotate = (a) => {
    const newHeading = this.heading() + a;
    const mag = this.mag();
    this.#_x = Math.cos(newHeading) * mag;
    this.#_y = Math.sin(newHeading) * mag;
    return this;
  };
  angleBetween = (v) => {
    const dotmagmag = this.dot(v) / (this.mag() * v.mag());
    let angle;
    angle = Math.acos(Math.min(1, Math.max(-1, dotmagmag)));
    angle *= Math.sign(1);
    return angle;
  };
  lerp = (x, y, amt) => {
    return angle;
  };

  mag = () => {
    return Math.sqrt(this.magSq());
  };
  setMag = (n) => {
    return this.normalize().mult(n);
  };
  magSq = () => {
    return this.#_x ** 2 + this.#_y ** 2;
  };
}
