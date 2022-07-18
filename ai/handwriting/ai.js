'use strict';

import {Matrix} from '/ai/matrix.js';

export const __IMAGE_SIDE_PIXEL_LENGTH = 28;
const __INPUT_LAYER = __IMAGE_SIDE_PIXEL_LENGTH * __IMAGE_SIDE_PIXEL_LENGTH;
const __OUTPUT_LAYER = 10;
const __MASTER_LAYER_TRAINING_SIZE = [__INPUT_LAYER, 32, 16, 16, __OUTPUT_LAYER];
const __LEARNING_RATE = 0.4;
const __LEARNING_ITERATIONS = 5;


export class Ai {
  constructor(algo) {
    this.#network = new QLearningNetwork({
      layers: __MASTER_LAYER_TRAINING_SIZE,
    });
  }

  #network;

	#request_training = async (data) => {
		for (let x = 0; x < __LEARNING_ITERATIONS; x++) {
      for (let i = 0; i < data.length; i++) {
        const expected = new Array(__OUTPUT_LAYER).fill()
        .map((_, label) => label == data[i].label ? 1 : 0);

        await this.#network.fitModel(data[i].pixels, expected);
      }
		}
  };

	trained = false;
	train = async (finished, training_data) => {
		await this.#request_training(await training_data);

		this.trained = true;

		finished();
	};
	predict = (input_data) => {
		return this.#network.makePrediction(input_data);
	};
}

class QLearningNetwork {
  constructor(options) {
    const layers = options.layers;

    this.#input_size = layers[0];
    this.#output_size = layers[layers.length - 1];

    if (QLearningNetwork.model != null) return;

    QLearningNetwork.model = tf.sequential();
    for (let i = 1; i < layers.length; i++) {
      QLearningNetwork.model.add(tf.layers.dense({
        units: layers[i],
        activation: 'relu',
        inputShape: [layers[i - 1]],
      }));
    }

    QLearningNetwork.model.compile({
      optimizer: tf.train.adam(__LEARNING_RATE),
      loss: 'binaryCrossentropy',
      metrics: ['acc'],
    });
  }

  static model;
  #input_size;
  #output_size;

  #fitOptions = {
    batchSize: 1,
    epochs: 1,
    validationSplit: 0.15,
    verbose: 0,
  };
  #esp = .7;  // rate of random predictions

  makePrediction = (input) => {
    if (Math.random() > this.#esp) {
      return Math.floor(Math.random() * this.#output_size);
    }

    return tf.tidy(() => {
      const max = QLearningNetwork.model.predict(
        tf.tensor2d(
          input,
          [1, this.#input_size],
        )
      ).argMax(1).dataSync();

      return max[max.length - 1];
    });
  };

  fitModel = async (input, fit) => {

    const actions = tf.tensor2d(
      input,
      [1, this.#input_size],
    );

    const expected = tf.tensor2d(
      fit,
      [1, this.#output_size],
    );

    await QLearningNetwork.model.fit(actions, expected, this.#fitOptions);

    expected.dispose();
    actions.dispose();
  };
  reward = async (input, reward) => {
    // TODO work here
  };
}
