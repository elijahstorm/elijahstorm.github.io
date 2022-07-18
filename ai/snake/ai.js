/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in Elijah Storm's Portfolio Project


'use strict';


export class QLearningNetwork {
	constructor(genetics = {
		weights: null,
		layers: [
			new NeuralNetworkLayer(6),
			new NeuralNetworkLayer(20),
			new NeuralNetworkLayer(20),
			new NeuralNetworkLayer(3),
		],
	}) {
		const weights = genetics.weights;
		const layers = genetics.layers;

		this.inputLayerSize = layers[0].size;
		this.layers = layers;

		this.weights = weights || layers
			.slice(0, layers.length - 1)
			.map((layer, index) => {
				const layerSizeNext = layers[index + 1].size;

				return tf.randomUniform([layer.size, layerSizeNext], -1, 1);
			});
	}

	dispose() {
		this.weights
			.forEach(w => w.dispose());
	}

	getWeights() {
		return this.weights
			.map(weights => weights.dataSync());
	}

	get json() {
		return {
			weights: this.getWeights(),
			layers: this.layers,
		};
	}
	breed_json(partner) {
    const weightsA = this.getWeights();
    const weightsB = partner.weights;

    const weights = new Array(weightsA.length).fill()
      .map((_, index) => {
        const a = weightsA[index];
        const b = weightsB[index];

        return new Float32Array(a.length).fill()
          .map((_, weightIndex) => {
            if (Math.random() < QLearningNetwork.MUTATION_PROBABILITY) {
              return Math.random() * 2 - 1;
            }

            return Math.random() < 0.5
              ? a[weightIndex]
              : b[weightIndex];
          });
      })
      .map((arr, index) => tf.tensor(arr, this.weights[index].shape));

    return {
			weights: weights,
			layers: this.layers,
		};
	}

  #is_wall = (input, dest) => {
    const head = input.snake[input.snake.length - 1];

    if (input.snake.indexOf(dest) != -1) {
			return true;
		}

		if (dest < 0 || dest >= input.grid ** 2) {
			return true;
		}

		if (Math.abs(dest % input.grid - head % input.grid) > 1) {
			return true;
		}

		return false;
  };
  #apple_thisway = (input, direction) => {
    const apple = input.apple;
    const head = input.snake[input.snake.length - 1];
    const grid = input.grid;

    const apple_x = apple % grid;
    const apple_y = (apple - apple_x) / grid;
    const head_x = head % grid;
    const head_y = (head - head_x) / grid;

    if (direction == 'left') {
      return apple_x < head_x;
    }
    if (direction == 'up') {
      return apple_y < head_y;
    }
    if (direction == 'right') {
      return apple_x > head_x;
    }
    if (direction == 'down') {
      return apple_y > head_y;
    }

    return false;
  };
  #sight = (input) => {
    const head = input.snake[input.snake.length - 1];
    const previous = input.snake[input.snake.length - 1];
    const direction = input.last_direction;
    let turn_left, turn_right;

    if (direction == 'right') {
      turn_left = 'up';
      turn_right = 'down';
    }
    else if (direction == 'left') {
      turn_left = 'down';
      turn_right = 'up';
    }
    else if (direction == 'up') {
      turn_left = 'left';
      turn_right = 'right';
    }
    else if (direction == 'down') {
      turn_left = 'right';
      turn_right = 'left';
    }

    const walls = {
      'left': head - 1,
      'up': head - input.grid,
      'right': head + 1,
      'down': head + input.grid,
    };

    const safe_movements = [
      this.#is_wall(input, walls[direction]) ? 0 : 1,
      this.#is_wall(input, walls[turn_left]) ? 0 : 1,
      this.#is_wall(input, walls[turn_right]) ? 0 : 1,
    ];
    const apple_direction = [
      this.#apple_thisway(input, direction) ? 1 : 0,
      this.#apple_thisway(input, turn_left) ? 1 : 0,
      this.#apple_thisway(input, turn_right) ? 1 : 0,
    ];

    return [
      ...safe_movements,
      ...apple_direction,
    ];
  };
  #expected = (sight) => {
    const expected = new Array(3).fill(0);

    if (sight[0] == sight[3]) {
      expected[0] = sight[3];
    }
    if (expected[0] == 0 && sight[1] == sight[4]) {
      expected[1] = sight[4];
    }
    if (expected[1] == 0 && sight[2] == sight[5]) {
      expected[2] = sight[5];
    }
    if (expected.indexOf(1) == -1) {
      if (sight[1] == 1) {
        expected[1] = 1;
      }
      else if (sight[2] == 1) {
        expected[2] = 1;
      }
      else if (sight[0] == 1) {
        expected[0] = 1;
      }
    }

    return expected;
  };

	think(game) {
    const sight = this.#sight(game);

		return tf.tidy(() => {
			const inputLayer = tf.tensor(sight, [1, this.inputLayerSize]);

			return this.weights.reduce((layer, weights, index) => {
				const fn = this.layers[index].fn;
				const result = layer.matMul(weights);

				return result[fn]()
					.sub(tf.scalar(0.5));
			}, inputLayer);
		}).argMax(1).dataSync()[0];
	}

	static MUTATION_PROBABILITY = 0.05;
}

class NeuralNetworkLayer {
	constructor(size, fn = 'sigmoid') {
		this.fn = fn;
		this.size = size;
	}
}
