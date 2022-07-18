
import {Ai} from '/ai/bees/ai.js';
import {Speech} from '/ai/bees/speech.js';
import {ActorDialog} from '/ai/bees/actor-dialog.js';

'use strict';

const MAX_HEALTH = 10;
const BODY_SIZE = 40;


const BeeTypes = {
	Normal: 'normal',
	Honeycomb: 'honeycomb',
	FlyingUp: 'flying-up',
	Towards: 'fatty',
	AbstractHoneycomb: 'abstract-honeycomb',
};

class CharacterClass {
	constructor(type, x, y, link = '', dialog_options) {
		this.#dialog = new ActorDialog(this, dialog_options);

		const casing = document.createElement('div');
		casing.className = `actor-casing actor-${type} no-select`;

		const filter = document.createElement('div');
		filter.className = 'actor-filter';

		const spawner = document.createElement('div');
		spawner.className = 'actor-spawner';
		setTimeout(() => {
			spawner.style.transform = 'scale(1, 1)';
			spawner.style.opacity = '1';
		}, 100);

		const animator = document.createElement('div');
		animator.className = `actor-${type}-animation`;

		const img = document.createElement('img');
		img.className = `actor-img`;
		img.src = link === '' ? `/ai/bees/svgs/${type}.svg` : `/ai/bees/${link}`;

		animator.appendChild(img);
		spawner.appendChild(animator);
		filter.appendChild(spawner);
		casing.appendChild(filter);

		this.#display = casing;

		this.move(x, y, 1);

		document.getElementById('bees').appendChild(casing);
	}

	#dialog;
	#display;
	get hit_box() {
		const display = this.#display;

		return {
			left: display.getBoundingClientRect().left,
			top: display.getBoundingClientRect().top,
			right: display.getBoundingClientRect().right,
			bottom: display.getBoundingClientRect().bottom,
		};
	}

	#_x;
	get x() {
		return this.#_x;
	}

	#_y;
	get y() {
		return this.#_y;
	}

	__window_offset = {x: 0, y: 0};
	set __movement_slide_off(value) {
		if (value !== true) return;

		this.#display.style.transition = 'none';
	}

	move = (x = this.x, y = this.y, scale = Math.random() / 2 + .5) => {

		x = Math.min(
			Math.max(
				x,
				this.wall_buffer,
			),
			window.innerWidth - this.wall_buffer,
		);
		y = Math.min(
			Math.max(
				y,
				this.wall_buffer,
			),
			window.innerHeight - this.wall_buffer,
		);

		let transform = '';

		if (this.x < x) {
			transform = 'scaleX(-1)';
		}

		this.#display.children[0].style.transform = `${transform}`;
		this.#display.style.transform = `translate(${
			x + this.__window_offset.x
		}px, ${
			y + this.__window_offset.y
		}px)scale(${scale})`;

		this.#_x = x;
		this.#_y = y;
		this.#_scale = scale;
	};

	#_scale = 1;
	scale = (scale = 1) => {
		this.move(this.x, this.y, scale);
	};

	get position() {
		return Ai.createVector(
			this.#_x + this.size / 2,
			this.#_y + this.size / 2,
		);
	}
	set position(v) {
		this.move(v.x, v.y);
	}

	accurate_size = BODY_SIZE;
	get size() {
		return this.accurate_size * this.#_scale;
	}

	#_angle = 0;
	get angle() {
		return  this.#_angle;
	}

	#_target;
	get target() {
		return this.#_target;
	}
	set target(value) {
		this.#_target = value;
	}

	sight_distance = 200;
	travel_distance = 100;
	wall_buffer = 50;

	angle_between = (target) => {
		const pos = this.position;

		return Math.atan2(
			target.y - pos.y,
			target.x - pos.x,
		);
	};
	find_flee_angle = (enemies) => {
		let sum = Ai.createVector(0, 0);

		if (enemies.length == 0) return sum;

		enemies.forEach((enemy) => sum.add(enemy.position));

		return 180 + this.angle_between(sum.div(enemies.length));
	};

	travel_by_angle = (angle, amount) => {
		this.#_angle = angle;

		const distance = Math.min(amount, this.travel_distance);

		this.move(
			this.x + distance * Math.cos(this.angle),
			this.y + distance * Math.sin(this.angle),
		);
	};
	search = () => {
		this.travel_by_angle(
			Math.random() * 360,
			Math.random() * this.travel_distance,
		);
	};
	chase = (target) => {
		this.travel_by_angle(
			this.angle_between(target.position),
			this.position.dist(target.position),
		);
	};
	flee = (enemies) => {
		this.travel_by_angle(
			this.find_flee_angle(enemies),
			this.travel_distance,
		);
	};
	random_move = () => {
		this.move(CharacterClass.random_x(), CharacterClass.random_y());
	};

	sees = (entity) => {
		const distance = this.position.dist(entity.position);

		if (distance > this.sight_distance) return false;

		return true;
	};
	look = () => {};

	set onclick(event) {
		const display = this.#display;

		if (event == null) {
			display.onclick = () => {};
			display.style.cursor = 'none';
			return;
		};

		display.onclick = () => {
			event(this);
		};

		display.style.cursor = 'pointer';
	};
	get speech() {
		const display = this.#display;

		return display.classList.contains(Speech.activeClassName);
	}
	set speech(speech) {
		const display = this.#display;

		if (speech == null) {
			display.classList.remove(Speech.activeClassName);
			setTimeout(() => {
				display.querySelector(`.${Speech.textClassName}`).remove();
			}, Speech.ANIMATION_TIMEOUT);
			return;
		}
		else if (this.speech) {
			this.speech = null;
			setTimeout(() => {
				this.speech = speech;
			}, Speech.ANIMATION_TIMEOUT + 1);
			return;
		}

		if (typeof speech === 'string') {
			speech = new Speech(speech);
		}

		const tip = document.createElement('span');
		tip.classList.add(Speech.textClassName, speech.color_class);
		tip.textContent = speech.text;

		display.appendChild(tip);

		display.classList.add(Speech.className);

		setTimeout(() => {
			if (this.y + tip.clientHeight > window.innerHeight - 100) {
				tip.classList.add(Speech.topTextClassName);
				tip.style.transform = `scale(1)translate(-30%, -${tip.clientHeight + 50}px)`;
			}

			display.classList.add(Speech.activeClassName);
		}, 1);
	};

	dispose = () => {
		this.#dialog.dispose();
		this.#display.remove();
	};
	die = () => {
		this.dispose();

		this.death_action();
	};
	death_action = () => {};

  static random_x = () => {
		const width = window.innerWidth;

		return Math.floor(Math.random() * width * .8) + width * .1;
	};
	static random_y = () => {
		const height = window.innerHeight;

		return Math.floor(Math.random() * height * .6) + height * .2;
	};
  static middle_x = () => {
		const width = window.innerWidth;

		return Math.floor(Math.random() * width * .30) + width * .35;
	};
  static middle_y = () => {
		const height = window.innerHeight;

		return Math.floor(Math.random() * height * .30) + height * .35;
	};
	static random_left = () => {
		const width = window.innerWidth;

		return Math.floor(Math.random() * Math.max(0, width * .2 - 200)) + width * .1;
	};
	static random_right = () => {
		const width = window.innerWidth;

		return Math.floor(Math.random() * Math.max(0, width * .2 - 200)) + width * .6 + 200;
	};
};

class ActorClass extends CharacterClass {
	constructor(type, x, y, link, dialog_options) {
		super(type, x, y, link, dialog_options);
	}

	#_life = MAX_HEALTH;
	get life() {
		return this.#_life;
	}
	set life(value) {
		this.#_life = value;
	}

	#_waiting = 0;
	set waiting(value) {
		this.#_waiting = value;
	}
	get waiting() {
		return this.#_waiting != 0;
	}

	run = () => {
		if (this.#_life <= 0) {
			this.scale(0);
			setTimeout(this.die, 500);
			return;
		}

		if (this.#_waiting > 0) {
			this.#_waiting--;
			return;
		}

		this.look();

		this.act();

		this.target = null;
	}

	act = () => {
		this.scale(Math.min(1, this.#_life-- / MAX_HEALTH + .3));
	};

	seen_actors = (list) => {
		let seen = [];

		list.forEach((actor) => {
			if (this.sees(actor)) {
				seen.push(actor);
			}
		});

		return seen;
	};

	contacts = (actor) => {
		const size = this.size / 2;
		const their_size = actor.size / 2;

		return this.position.dist(actor.position) < size + their_size;
	};
}

class NormalBeeActor extends ActorClass {
	constructor(x, y, parent, dialog_options = NormalBeeActor.dialog_options) {
		super(BeeTypes.Normal, x, y, 'pngs/bee.png', dialog_options);

		if (parent != null) {
			this.#_honey_hive = parent.get_hive;
			this.#_flowers = parent.get_flowers;
			this.#_get_enemies = parent.get_enemies;
			this.#_get_bees = parent.get_bees;
		}
	}

	#_flowers = () => [];
	get flowers() {
		return this.#_flowers();
	}

	#_get_bees = () => [];
	get all_bees() {
		return this.#_get_bees();
	}

	#_get_enemies = () => [];
	get enemies() {
		return this.#_get_enemies();
	}

	#_honey_hive = () => {
		return {
			position: Ai.createVector(0, 0),
		};
	};
	get hive() {
		return this.#_honey_hive();
	}

	#pollen = 0;
	#add_points = (points) => {
		NormalBeeActor.ai.loss += points;

		if (NormalBeeActor.ai.loss % 20 < points && this.enemies.length != 0) {
			this.enemies[0].die();
		}
	};

	static ai;
	static start_ai = (boids) => {
		if (NormalBeeActor.ai != null) {
			NormalBeeActor.ai.dispose();
		}

		NormalBeeActor.ai = new Ai(boids);
	};


	#acceleration = Ai.createVector(0, 0);
	#velocity = Ai.createVector(0, 0);

	get acceleration() {
		return Ai.createVector(this.#acceleration.x, this.#acceleration.y);
	}
	get velocity() {
		return Ai.createVector(this.#velocity.x, this.#velocity.y);
	}
	get maxspeed() {
		return this.travel_distance;
	}
	get maxforce() {
		return 80;
	}

	seek = (target) => {
		let desired = target.sub(this.position);  // A vector pointing from the location to the target
	  // Normalize desired and scale to maximum speed
	  desired.normalize();
	  desired.mult(this.maxspeed);
	  // Steering = Desired minus Velocity
	  let steer = desired.sub(this.velocity);
	  steer.limit(this.maxforce);  // Limit to maximum steering force
	  return steer;
	};
	applyForce = (force) => {
		this.#acceleration.add(force);
		return this;
	};

	flock = (movements) => {
		this.applyForce(movements.sep)
				.applyForce(movements.ali)
				.applyForce(movements.coh)
				.applyForce(movements.tgt)
				.applyForce(movements.avd);

		this.#velocity.add(this.#acceleration);

	  // Limit speed
	  this.#velocity.limit(this.maxspeed);
	  this.position = this.position.add(this.velocity);

	  // Reset acceleration to 0 each cycle
	  this.#acceleration.mult(0);
	};
	#multiple_frames = (action, frames = 1, i = 0) => {
		if (i >= frames) {
			return;
		}

		action();

		setTimeout(() => {
			this.#multiple_frames(action, frames, i + 1);
		}, 1000 / frames);
	};

	#nearby_bees = () => {
		return this.seen_actors(this.all_bees);
	};

	best_untargeted_flower = (flowers) => {
		let best_target = this.target;

		flowers.forEach((flower) => {
			if (!this.sees(flower)) return;

			let refuse_target = false;
			this.#nearby_bees().forEach((bee) => {
				if (bee.target == flower) {
					refuse_target = true;
				}
			});

			if (refuse_target) {
				return;
			}

			if (best_target == null) {
				best_target = flower;
				return;
			}

			if (
				this.position.dist(flower.position)
				< this.position.dist(best_target.position)
			) {
				best_target = flower;
			}
		});

		return best_target;
	};
	look = () => {
		if (this.#pollen >= 10) {
			this.target = this.hive;
			return;
		}

		this.target = this.best_untargeted_flower(this.flowers);
	};

	act = () => {
		if (this.contacts(this.hive) && this.#pollen != 0) {
			this.#add_points(this.#pollen);
			this.#pollen = 0;

			return;
		}

		if (this.#pollen != 10) {
			for (let i = 0; i < this.flowers.length; i++) {
				let flower = this.flowers[i];

				if (!this.contacts(flower)) continue;

				flower.life -= flower.pollen;
				this.#pollen += flower.pollen;
				if (flower.life < 0) {
					this.#pollen += flower.life;
					flower.life = 0;
				}

				return;
			}
		}

		this.flock(NormalBeeActor.ai.flock(
			this,
			this.#nearby_bees(),
			this.target,
			this.seen_actors(this.enemies),
		));
	};

	death_action = () => {
		this.all_bees.splice(
			this.all_bees.indexOf(this),
			1
		);
	};

	static dialog_options;
};

class EnemyWaspActor extends ActorClass {
	constructor(x, y, parent) {
		super(BeeTypes.FlyingUp, x, y, 'pngs/zombie_fly.png');

		this.sight_distance = 100;
		this.travel_distance = 50;
		this.#spawn = parent.create_actor;
		this.#_get_bees = parent.get_bees;
		this.#_get_enemies = parent.get_enemies;
	}

	#_get_bees = () => [];
	get all_bees() {
		return this.#_get_bees();
	}

	#_get_enemies = () => [];
	get all_enemies() {
		return this.#_get_enemies();
	}

	#spawn = () => {};

	look = () => {
		this.all_bees.forEach((bee) => {
			if (this.sees(bee)) {
				this.target = bee;
			}
		});
	};

	death_action = () => {
		this.all_enemies.splice(
			this.all_enemies.indexOf(this),
			1
		);
	};

	act = () => {
		const bees = this.all_bees;

		for (let i = 0; i < bees.length; i++) {
			const bee = bees[i];

			if (!this.contacts(bee) || bee.life == 0) continue;

			bee.life = 0;
			setTimeout(() => {
				this.#spawn(BeeTypes.FlyingUp, bee.x, bee.y, this.all_enemies);
			}, 1000);

			return;
		}

		if (this.target != null) {
			this.chase(this.target);
			return;
		}

		this.search();
	};
};

class GhostActor extends ActorClass {
	constructor(
		x = CharacterClass.middle_x(),
		y = CharacterClass.random_y(),
		parent,
	) {
		super(BeeTypes.Towards, x, y, 'pngs/butterfly.png');

		this.#_get_bees = parent.get_bees;
	}

	#_get_bees = () => [];
	get all_bees() {
		return this.#_get_bees();
	}

	#action_cooldown = 5;
	#action_timer = 0;

	act = () => {
		this.all_bees.forEach((bee) => {
			if (!bee.waiting && this.contacts(bee)) {
				bee.waiting = this.#action_cooldown - this.#action_timer;
			}
		});

		if (this.#action_timer++ != this.#action_cooldown) return;

		this.move(
			CharacterClass.middle_x(),
			CharacterClass.random_y(),
		);

		this.#action_timer = 0;
	};
};

class HoneycombActor extends ActorClass {
	constructor(x, y) {
		super(BeeTypes.Honeycomb, x, y);
	}

	accurate_size = 150;

	act = () => {};
};
class EnemyAbstractHoneycombActor extends ActorClass {
	constructor(x, y) {
		super(BeeTypes.AbstractHoneycomb, x, y);
	}

	act = () => {};
};

export {BeeTypes, CharacterClass, ActorClass, NormalBeeActor, HoneycombActor, EnemyWaspActor, GhostActor, EnemyAbstractHoneycombActor};
