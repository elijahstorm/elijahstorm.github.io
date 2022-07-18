
'use strict';


export class Speech {
  constructor(
    text = '',
    color = 'red',
  ) {
    this.#_text = text;
    this.#_bg_color = color;
  }

  #_bg_color;
  #_text;

  get color_class() {
    return `w3-${this.#_bg_color}`;
  }
  get text() {
    return this.#_text;
  }

  static className = 'actor-dialog';
  static activeClassName = 'show-tip';
  static textClassName = 'actor-dialog-text';
  static topTextClassName = 'actor-dialog-top';
  static ANIMATION_TIMEOUT = 450;
}
