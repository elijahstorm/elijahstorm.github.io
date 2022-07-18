/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in Elijah Storm's Portfolio Project

import Canvas from '/ai/handwriting/canvas.js';
import {Ai, __IMAGE_SIDE_PIXEL_LENGTH} from '/ai/handwriting/ai.js';

'use strict';

const __TRAINING_DATA_LENGTH = 60000;
const __MASTER_LARGE_IMAGES_PATH = 't10k-images.idx3-ubyte';
const __MASTER_LARGE_LABELS_PATH = 't10k-labels.idx1-ubyte';
const __MASTER_TRAIN_IMAGES_PATH = 'train-images.idx3-ubyte';
const __MASTER_TRAIN_LABELS_PATH = 'train-labels.idx1-ubyte';

const Program = function() {
	let self = this;

	function convert_image_data_to_training_format(pixels) {
		let output = new Array(pixels.data.length / 4);

		for (let i = 0; i < output.length; i++) {
			output[i] = pixels.data[i * 4 + 3];
		}

		return output;
	}

	function load_training_data(result) {

		let requirement_loaded = [false, false];
		let dataFileBuffer  = new FileReader();
		let labelFileBuffer = new FileReader();
		const __dirname = 'data';

		function parse_training_data() {

			if (requirement_loaded.includes(false)) return;

			Canvas.load('parsing data');

			result(new Promise(result => setTimeout(() => {

				const _LABEL_BUFFER_OFFSET = 8;
				const _DATA_BUFFER_OFFSET = 16;

				let pixelValues = [];

				for (let image = 0; image < __TRAINING_DATA_LENGTH; image++) {
					let pixels = [];

					for (let y = 0; y < __IMAGE_SIDE_PIXEL_LENGTH; y++) {
						for (let x = 0; x < __IMAGE_SIDE_PIXEL_LENGTH; x++) {
							pixels.push(
								dataFileBuffer[
									(image * __IMAGE_SIDE_PIXEL_LENGTH * __IMAGE_SIDE_PIXEL_LENGTH)
									+ (x + (y * __IMAGE_SIDE_PIXEL_LENGTH)) + _DATA_BUFFER_OFFSET
								]
							);
						}
					}

					pixelValues.push({
						label: parseInt(JSON.stringify(labelFileBuffer[image + _LABEL_BUFFER_OFFSET])),
						pixels: pixels,
					});
				}

				Canvas.load('training');
				result(pixelValues);
			}, 0)));
		}

		dataFileBuffer.onload = function(e) {
			requirement_loaded[0] = true;
			dataFileBuffer = new Uint8Array(e.target.result);
			parse_training_data();
		};
		labelFileBuffer.onload = function(e) {
			requirement_loaded[1] = true;
			labelFileBuffer = new Uint8Array(e.target.result);
			parse_training_data();
		};

		function load_file_and_read_data(buffer, path) {
			const request = new XMLHttpRequest();
			request.open('GET', `${__dirname}/${path}`, true);
			request.responseType = 'blob';
			request.onload = function() {
				buffer.readAsArrayBuffer(request.response);
			};
			request.send();
		}

		load_file_and_read_data(dataFileBuffer, __MASTER_TRAIN_IMAGES_PATH);
		load_file_and_read_data(labelFileBuffer, __MASTER_TRAIN_LABELS_PATH);
	}

	const ai = new Ai();
	ai.train(
		() => Canvas.open(),
		new Promise(result =>
			load_training_data(result)
		)
	);

	self.predict = function(input) {
		if (!ai.trained) return;

		let prediction = ai.predict(
			convert_image_data_to_training_format(
				input,
			),
		);

		Canvas.output(prediction);
	}
};

window.onload = function() {
	Canvas.init();

	let program = new Program();
	Canvas.complete_prediciton_function(program.predict);

	document.getElementById('clear-canvas').onclick = function() {
		Canvas.clear();
	};
};
