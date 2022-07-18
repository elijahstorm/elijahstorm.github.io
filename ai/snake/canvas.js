'use strict';


export const ColorCodes = {
	NOTHING: 0,
	APPLE: 100,
	SNAKE: 255,
}


export class Canvas {
	constructor() {
		this.#outputDialog = document.getElementById('output-text');
		this.#rewardDialog = document.getElementById('reward-text');
		this.#generationDialog = document.getElementById('generation-text');
		this.#statusDialog = document.getElementById('status-text');
	}

	dispose() {
		document.getElementById('info-button').onclick = () => {};
		document.getElementById('info-exit-button').onclick = () => {};
		this.restart_function = null;
	}

	#outputDialog;
	#rewardDialog;
	#generationDialog;
	#statusDialog;
	output = function(str) {
		this.#outputDialog.innerHTML = str;
	};
	reward = function(str) {
		this.#rewardDialog.innerHTML = str;
	};
	generation = function(str) {
		this.#generationDialog.innerHTML = str;
	};
	status = function(str) {
		this.#statusDialog.innerHTML = str;
	};

	static HUD_Shown_Time = 3;

	open_helper_info = () => {
		const help = document.getElementById('help-dialog');
		const main = document.getElementById('main-card-fade-away');

		if (!this.#infomation_card_shown) {
			help.style.transform = 'scale(1)';
			help.style.opacity = 1;
			this.#infomation_card_shown = true;
			this.#hide_main_card();
			main.style.visibility = 'hidden';
		}
		else {
			help.style.transform = 'scale(2)';
			help.style.opacity = 0;
			this.#infomation_card_shown = false;
			main.style.visibility = 'visible';
		}
	};

	#idleTimeout;
	#is_shown = false;
	#infomation_card_shown = false;

	show_display = () => {
		this.#interaction();
	};
	#interaction = () => {
		window.clearTimeout(this.#idleTimeout);

		this.#start_idle_delay();

		this.#show_main_card();
	}
	#start_idle_delay = (i = Canvas.HUD_Shown_Time) => {
		if (i <= 0) {
			this.#hide_main_card();
			return;
		}

		document.getElementById('hiding-card-timer').innerHTML = `${i}secs`;

		this.#idleTimeout = setTimeout(() => {
			this.#start_idle_delay(i - 1);
		}, 1000);
	}
	#show_main_card = () => {
		if (this.#infomation_card_shown || this.#is_shown) return;

		this.#is_shown = true;
		document.getElementById('main-card-fade-away').style.transform = 'scale(1)';
		document.getElementById('main-card-fade-away').style.opacity = 1;
		document.getElementById('halt-canvas').style.transform = 'scale(1)translateY(0px)';
		document.getElementById('halt-canvas').style.opacity = 1;
	}
	#hide_main_card = () => {
		if (!this.#is_shown) return;

		this.#is_shown = false;
		document.getElementById('main-card-fade-away').style.transform = 'scale(2)';
		document.getElementById('main-card-fade-away').style.opacity = 0;
		document.getElementById('halt-canvas').style.transform = 'scale(2)translateY(100px)';
		document.getElementById('halt-canvas').style.opacity = 0;
	}

	load = (text) => {
		document.getElementById('loader').style.display = 'inline-block';
		document.getElementById('board-container').style.display = 'none';
		document.getElementById('loader-status').innerHTML = text;
	};
	open = () => {
		document.getElementById('loader').style.display = 'none';
		document.getElementById('board-container').style.display = 'inline-block';
	};

	game_over = (dispose_and_recreate) => {
		const haltBtn = document.getElementById('halt-canvas');
		this.restart_function = function() {
			dispose_and_recreate();

			haltBtn.className = haltBtn.className.replace('green', 'red');
			haltBtn.innerHTML = 'STOP';
		};

		haltBtn.className = haltBtn.className.replace('red', 'green');
		haltBtn.innerHTML = 'RESTART';

		haltBtn.onclick = this.restart_function;

		this.#interaction();

		return this.restart_function;
	};

	static interaction_function;
	static keyup_function;

	set_controls = (controls_input) => {

		const self = this;
		document.getElementById('info-button').onclick = function() {
			self.open_helper_info();
		};
		document.getElementById('info-exit-button').onclick = function() {
			self.open_helper_info();
		};
		this.#interaction();

		const haltBtn = document.getElementById('halt-canvas');
		const halt_fnc = () => {
			if (haltBtn.className.includes('green')) {
				controls_input.start();
				haltBtn.className = haltBtn.className.replace('green', 'red');
				haltBtn.innerHTML = 'STOP';
			}
			else {
				controls_input.halt();
				haltBtn.className = haltBtn.className.replace('red', 'green');
				haltBtn.innerHTML = 'RESTART';
			}
		};
		haltBtn.onclick = halt_fnc;

		if (Canvas.interaction_function != null) {
			document.removeEventListener('mousemove', Canvas.interaction_function);
			document.removeEventListener('click', Canvas.interaction_function);
			document.removeEventListener('keydown', Canvas.interaction_function);
			document.removeEventListener('keyup', Canvas.keyup_function);
		}

		const interaction_function = e => {
			this.#interaction();
		};
		const keyup_function = e => {
			this.#interaction();
			if (e.code == 'Space') {
				halt_fnc();
			}
		};
		document.addEventListener('mousemove', interaction_function);
		document.addEventListener('click', interaction_function);
		document.addEventListener('keydown', interaction_function);
		document.addEventListener('keyup', keyup_function);

		Canvas.interaction_function = interaction_function;
		Canvas.keyup_function = keyup_function;

		controls_input.ready();
	};

	createCanvas = (container, CANVAS_SIZE, className) => {
		const canvas = document.createElement('canvas');
		canvas.className = className;
		canvas.width = CANVAS_SIZE;
		canvas.height = CANVAS_SIZE;

		const ctx = canvas.getContext('2d');
		const _color = 'white', _size = 2;

		ctx.strokeStyle = _color;
		ctx.fillStyle = _color;
		ctx.lineWidth = _size;

		const draw = (pixels, flash) => {
			let pre_canvas = document.createElement('canvas');
			let pre_size = Math.sqrt(pixels.length);
			pre_canvas.width = pre_size;
			pre_canvas.height = pre_size;
			let pre_ctx = pre_canvas.getContext('2d');

			let image_data = pre_ctx.getImageData(0, 0, pre_size, pre_size);

			for (let i = 0; i < pixels.length; i++) {
				if (pixels[i] == ColorCodes.APPLE) {
					image_data.data[(4 * i) + 0] = 255;
					image_data.data[(4 * i) + 1] = 0;
					image_data.data[(4 * i) + 2] = 0;
					image_data.data[(4 * i) + 3] = 255;
				}
				else if (pixels[i] == ColorCodes.SNAKE) {
					image_data.data[(4 * i) + 0] = 255;
					image_data.data[(4 * i) + 1] = 255;
					image_data.data[(4 * i) + 2] = 255;
					image_data.data[(4 * i) + 3] = 255;
				}
			}

			pre_ctx.putImageData(image_data, 0, 0);

			if (flash != 0) {
				pre_ctx.fillStyle = flash == 1 ? 'green' : 'red';
				pre_ctx.globalAlpha = .7;
				pre_ctx.fillRect(0, 0, pre_size, pre_size);
			}

			var imageObject = new Image();
			imageObject.onload = function() {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.save();
				// ctx.scale(CANVAS_SIZE / pre_size, CANVAS_SIZE / pre_size);
				ctx.drawImage(imageObject, 0, 0);
				ctx.restore();
			};
			imageObject.src = pre_canvas.toDataURL();
		};

		container.appendChild(canvas);

		return {
			element: canvas,
			draw: draw,
		};
	};
};
