import blur from '/ai/handwriting/blur.js';

'use strict';

const Canvas = new function() {
	let self = this;

	let __predict_call_into = null;
	function predict(data) {
		if (__predict_call_into == null) return;

		__predict_call_into(data);
	}
	self.complete_prediciton_function = function(fnc) {
		__predict_call_into = fnc;
	};

	self.load = function(text) {
		document.getElementById('loader').style.display = 'inline-block';
		document.getElementById('handwriting-board-container').style.display = 'none';
		document.getElementById('loader-status').innerHTML = text;
	};
	self.open = function() {
		document.getElementById('loader').style.display = 'none';
		document.getElementById('handwriting-board-container').style.display = 'inline-block';
	};

	self.init = function() {
		const canvas = document.getElementById('input-canvas');
		const ctx = canvas.getContext('2d');
		const CANVAS_SIZE = canvas.width;

		self.draw = function(pixels) {
			let pre_canvas = document.createElement('canvas');
			let pre_size = Math.sqrt(pixels.length);
			pre_canvas.width = pre_size;
			pre_canvas.height = pre_size;
			let pre_ctx = pre_canvas.getContext('2d');

			let image_data = pre_ctx.getImageData(0, 0, pre_size, pre_size);

			for (let i = 0; i < pixels.length; i++) {
				image_data.data[(4 * i) + 0] = pixels[i];
				image_data.data[(4 * i) + 1] = pixels[i];
				image_data.data[(4 * i) + 2] = pixels[i];
				image_data.data[(4 * i) + 3] = pixels[i];
			}

			pre_ctx.putImageData(image_data, 0, 0);

			var imageObject = new Image();
			imageObject.onload = function() {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.save();
				ctx.scale(CANVAS_SIZE / pre_size, CANVAS_SIZE / pre_size);
				ctx.drawImage(imageObject, 0, 0);
				ctx.restore();
			}
			imageObject.src = pre_canvas.toDataURL();
		};
		self.read = function() {
		return ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
	};

		let is_drawing = false;

		let prevX = 0, prevY = 0,
			currX = 0, currY = 0;

		const _color = 'white', _size = 2;

		ctx.strokeStyle = _color;
		ctx.fillStyle = _color;
		ctx.lineWidth = _size;

		let stop_timeout_prediction = true;
		const stop_timeout_delay = 0;

		const outputDialog = document.getElementById('output-text');
		function finish() {
			is_drawing = false;

			stop_timeout_prediction = false;
			setTimeout(function() {
				if (stop_timeout_prediction) return;

				predict(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE));
			}, stop_timeout_delay);
		}
		function clear_canvas() {
			ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
			output_result('?');
		}
		function output_result(str) {
			outputDialog.innerHTML = str;
		}

		self.clear = function() {
			clear_canvas();
		};
		self.output = function(str) {
			output_result(str);
		};

		canvas.addEventListener('mousemove', function (e) {
			if (!is_drawing) return;

			const rect = canvas.getBoundingClientRect();
	    const x = e.clientX - rect.left;
	    const y = e.clientY - rect.top;

			prevX = currX;
			prevY = currY;

			currX = Math.floor(x / 4);
			currY = Math.floor(y / 4);

			ctx.beginPath();
			ctx.moveTo(prevX, prevY);
			ctx.lineTo(currX, currY);
			ctx.stroke();
			ctx.closePath();
		}, false);
		canvas.addEventListener('mousedown', function (e) {
			stop_timeout_prediction = true;

			const rect = canvas.getBoundingClientRect();
	    const x = e.clientX - rect.left;
	    const y = e.clientY - rect.top;

			prevX = currX;
			prevY = currY;

			currX = Math.floor(x / 4);
			currY = Math.floor(y / 4);

			is_drawing = true;
		}, false);
		canvas.addEventListener('mouseup', function (e) {
			finish();
		}, false);
		canvas.addEventListener('mouseout', function (e) {
			if (!is_drawing) return;

			finish();
		}, false);
	};
};

export default Canvas;
