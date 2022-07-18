/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in Elijah Storm's Portfolio Project


import {Canvas} from '/ai/snake/canvas.js';
import {Snake, CANVAS_SIZE} from '/ai/snake/snake.js';

'use strict';


export class Population {
  constructor(
    genetics,
    container = document.getElementById('snakes'),
    total_boards = 50,
  ) {
    this.#canvas = new Canvas();

    this.#agents = new Array(total_boards).fill().map(() => {
      const _canvas = this.#canvas.createCanvas(
        container,
        CANVAS_SIZE,
        'canvas-boarder',
      );

      return {
        engine: new Snake(
          genetics,
          _canvas.draw,
        ),
        canvas: _canvas,
      };
    });

    this.#canvas.set_controls(this);
  }

  static generation = 0;
  #agents;

  #canvas;
  get total_reward() {
    return this.#agents.reduce((val, a) => val + a.engine.reward, 0);
  }
  get total_score() {
    return this.#agents.reduce((val, a) => val + a.engine.score, 0);
  }

  running = false;
  ready = () => {
    this.check_interval = setInterval(this.update, 500);

    this.running = true;

    this.#canvas.open();
    this.#canvas.generation(++Population.generation);

    this.start();
  };

  update = () => {
    this.#canvas.output(this.total_score);
    this.#canvas.reward(this.total_reward);

    if (
      this.#agents.every(
        (agent) =>
          agent.engine.reward < 0 ||
          agent.engine.status == 'dead'
      )
    ) {
      this.game_over();
    }
  };

  start = () => {
    this.#agents.forEach((game) => {
      if (game.engine.status == 'dead') return;

      game.engine.start();
    });

    this.#canvas.status('running');
  };
  halt = () => {
    this.#agents.forEach((game) => game.engine.halt());

    this.#canvas.status('halted');
  };
  game_over = () => {
    if (!this.running) return;
    this.running = false;

    this.halt();

    this.#canvas.status('dead');

    let fired_once = false;
    this.#canvas.game_over(async () => {
      if (fired_once) return;
      fired_once = true;

      const parents = this.#agents
        .sort((a, b) => a.engine.is_better(b.engine) ? -1 : 1)
        .slice(0, Population.TOP_BREEDERS);

      new Population(
        await parents
          .slice(1, parents.length)
          .reduce(
            async (left, right) => right.engine.brain.breed_json(await left),
            parents[0].engine.brain.json,
          )
      );

      this.dispose();
    });

    this.restart_timer = setTimeout(this.#canvas.restart_function, 3000);
  };

  dispose = () => {
    this.#agents.forEach((agent) => {
      agent.engine.dispose();
      agent.canvas.element.remove();
    });

    this.#agents = null;

    clearInterval(this.check_interval);
    this.check_interval = null;

    clearTimeout(this.restart_timer);
    this.restart_timer = null;

    this.#canvas.dispose();
    this.#canvas = null;
  };

  static get TOP_BREEDERS() {
    return 5;
  }
}
