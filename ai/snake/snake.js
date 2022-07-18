/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in Elijah Storm's Portfolio Project


import {ColorCodes} from '/ai/snake/canvas.js';
import {QLearningNetwork} from '/ai/snake/ai.js';

'use strict';

const FRAMES_PER_SECOND = 60;
const TIME_PER_FRAME = 1000 / FRAMES_PER_SECOND;
const DATA_SIZE = 28;
const OUTPUT_SCALE = 3;
const CANVAS_SIZE = DATA_SIZE * OUTPUT_SCALE;
const OUTPUT_MARGIN = 0;

const REWARD_DEATH = 0;
const REWARD_EAT = 10;
const REWARD_TOWARDS = 1;
const REWARD_AWAY = -1.5;


class Snake {
	constructor(genetics, _draw_fnc) {
		this.brain = new QLearningNetwork(genetics);

		this.#snake = new Array(5).fill((DATA_SIZE ** 2 + DATA_SIZE) / 2);
		this.#place_apple();

    this.#send_to_canvas = _draw_fnc;
	}

	breed = (partner) => this.brain.breed(partner.brain);

	dispose = () => {
		this.brain.dispose();
	};

	#generate_sight = () => {
		return {
			snake: this.#snake,
			apple: this.#apple,
			score: this.#_score,
			last_direction: this.#last_direction,
			grid: DATA_SIZE,
		};
	};

	#snake;
	#head = () => this.#snake[this.#snake.length - 1];
	#apple;
	#place_apple = () => {
		const snake = this.#snake;

		const apple = Math.floor(Math.random() * DATA_SIZE ** 2);

		for (let i = 0; i < snake.length; i++) {
			if (snake[i] != apple) continue;

			this.#place_apple();
			return;
		}

		this.#apple = apple;
	};

	#total_reward = 0;
  get reward() {
    return this.#total_reward;
  }
  is_better = (compare) => {
    return this.reward > compare.reward;
  };

	#directions = ['left', 'up', 'right', 'down'];
	#direction_after_turn = (choice) => {
		// straight, left, right

		const last_direction = this.#last_direction;

		if (choice == 0) return last_direction;

		if (choice == 1) {
			if (last_direction == 'left') return 'down';
			if (last_direction == 'up') return 'left';
			if (last_direction == 'right') return 'up';
			if (last_direction == 'down') return 'right';
		}

		if (last_direction == 'left') return 'up';
		if (last_direction == 'up') return 'right';
		if (last_direction == 'right') return 'down';
		if (last_direction == 'down') return 'left';
	};

	#_score = 0;
	get score() {
		return this.#_score;
	}
	#eat_apple = () => {
		this.#snake.unshift(this.#apple);
		this.#_score += REWARD_EAT;
		this.#place_apple();
	};

	#clock_ticker = false;

	#reflow = () => {
		if (!this.#clock_ticker) return;

		setTimeout(this.#run, TIME_PER_FRAME);
	};
	#run = async () => {
		const brain = this.brain;

		const sight = this.#generate_sight();

		this.#snake_direction = this.#direction_after_turn(
			brain.think(sight)
		);

		const snake_direction = this.#snake_direction;
		const move_actions = this.#move_actions;
		const apple = this.#apple;

		let reward = 0;

		if (!move_actions['validate']()) {
			this.game_over();

			reward += REWARD_DEATH;
		}
		else {
			move_actions[snake_direction]();

			const head = this.#head();

			if (apple == head) {
				this.#eat_apple();

				reward += REWARD_EAT;
			}
			else {
				const apple_x = apple % DATA_SIZE;
				const apple_y = (apple - apple_x) / DATA_SIZE;
				const head_x = head % DATA_SIZE;
				const head_y = (head - head_x) / DATA_SIZE;
				const previous = this.#snake[this.#snake.length - 2];
				const previous_x = previous % DATA_SIZE;
				const previous_y = (previous - previous_x) / DATA_SIZE;

				const head_distance = Math.sqrt((apple_x - head_x) ** 2 + (apple_y - head_y) ** 2);
				const previous_distance = Math.sqrt((apple_x - previous_x) ** 2 + (apple_y - previous_y) ** 2);

				if (head_distance < previous_distance) {
					reward += REWARD_TOWARDS;
				}
				else {
					reward += REWARD_AWAY;
				}
			}
		}

		this.#draw(reward);

		this.#total_reward += reward;
		this.#last_direction = snake_direction;

		this.#reflow();
	};
	#draw = (reward) => {
		const snake = this.#snake;

		let output_pixels = new Array(CANVAS_SIZE ** 2).fill(ColorCodes.NOTHING);

		function draw_pixel(pixel, color) {
			const starting_output = (
				Math.floor(pixel / DATA_SIZE) * CANVAS_SIZE	// y offset
				* (OUTPUT_SCALE - 1) / OUTPUT_SCALE					// math fix
				+ pixel
			) * OUTPUT_SCALE;

			for (let j = OUTPUT_MARGIN; j < OUTPUT_SCALE - OUTPUT_MARGIN; j++) {
				const x_offset = starting_output + j;

				for (let k = OUTPUT_MARGIN; k < OUTPUT_SCALE - OUTPUT_MARGIN; k++) {
					output_pixels[
						x_offset + k * CANVAS_SIZE
					] = color;
				}
			}
		}

		draw_pixel(this.#apple, ColorCodes.APPLE);

		for (let s = 0; s < snake.length; s++) {
			draw_pixel(snake[s], ColorCodes.SNAKE);
		}

		this.#send_to_canvas(
			output_pixels.splice(0, Math.min(132495, output_pixels.length)),
			reward == REWARD_EAT ? 1 : reward == REWARD_DEATH ? 2 : 0,
		);
	};
  #send_to_canvas;

	start = () => {
		if (this.#clock_ticker) return;

		this.#clock_ticker = true;

		this.#set_status('running');

		this.#reflow();
	};
	halt = () => {
		this.#clock_ticker = false;
	};
	game_over = () => {
		this.#clock_ticker = false;

		this.#set_status('dead');
	};

	dispose = () => {
		this.#set_status = 'disposed';
		this.#snake = null;
		this.#send_to_canvas = null;
	};
	#_status = 'loading';
	get status() {
		return this.#_status;
	}
	#set_status = (input) => {
		this.#_status = input;
	};

	#snake_direction = 'left';
	#last_direction = 'left';
	#move_actions = {
		'validate': () => {
			const head = this.#head();
			const snake = this.#snake;
			const snake_direction = this.#snake_direction;

			let dest = head;

			if (snake_direction == 'left') {
				dest -= 1;
			}
			if (snake_direction == 'up') {
				dest -= DATA_SIZE;
			}
			if (snake_direction == 'right') {
				dest += 1;
			}
			if (snake_direction == 'down') {
				dest += DATA_SIZE;
			}

			if (snake.indexOf(dest) != -1) {
				return false;
			}

			if (dest < 0 || dest > DATA_SIZE ** 2) {
				return false;
			}

			if (Math.abs(dest % DATA_SIZE - head % DATA_SIZE) > 1) {
				return false;
			}

			return true;
		},
		'update': () => {
			const snake = this.#snake;

			for (let i = 0; i < snake.length - 1; i++) {
				snake[i] = snake[i + 1];
			}
		},
		'left': () => {
			const snake = this.#snake;
			const snake_direction = this.#snake_direction;

			this.#move_actions['update']();

			snake[snake.length - 1] -= 1;
		},
		'up': () => {
			const snake = this.#snake;
			const snake_direction = this.#snake_direction;

			this.#move_actions['update']();

			snake[snake.length - 1] -= DATA_SIZE;
		},
		'right': () => {
			const snake = this.#snake;
			const snake_direction = this.#snake_direction;

			this.#move_actions['update']();

			snake[snake.length - 1] += 1;
		},
		'down': () => {
			const snake = this.#snake;
			const snake_direction = this.#snake_direction;

			this.#move_actions['update']();

			snake[snake.length - 1] += DATA_SIZE;
		},
	};
	#controls = {
		'ArrowLeft': {
			flag: false,
			action: () => {
				this.#snake_direction = 'left';
			},
		},
		'ArrowUp': {
			flag: false,
			action: () => {
				this.#snake_direction = 'up';
			},
		},
		'ArrowRight': {
			flag: false,
			action: () => {
				this.#snake_direction = 'right';
			},
		},
		'ArrowDown': {
			flag: false,
			action: () => {
				this.#snake_direction = 'down';
			},
		},
	};

	input = (code, value) => {
		if (this.#controls[code] == null) return true;

		this.#controls[code].action();

		return false;
	};
};

export {Snake, CANVAS_SIZE};
