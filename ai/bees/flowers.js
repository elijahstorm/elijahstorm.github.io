
import {CharacterClass, ActorClass} from '/ai/bees/bees.js';

'use strict';


const FlowerTypes = {
	Sunflower: 'sunflower',
	Trumpet: 'trumpet',
	Tulip: 'tulip',
	Windmill: 'windmill',
	Honey: 'honey',
};
const LillyTypes = {
	Blue: 'blue',
	Brown: 'brown',
	Green: 'green',
	Orange: 'orange',
	Passion: 'passion',
	Purple: 'purple',
	Red: 'red',
	Turquoise: 'turquoise',
};

const MIN_FLOWERS = 4;
const STARTING_FLOWERS = 5;
const MIN_LILLIES = 6;
const STARTING_LILLIES = 9;

class Flower extends ActorClass {
	constructor(type, parent, img) {
		super(
			`flower-${type}`,
			CharacterClass.random_x(),
			CharacterClass.random_y(),
			img,
		);

		this.death_action = () => {
			parent.dead(this);
		};
	}

	flower_type = 'flower';

	pollen = 5;
}

class Sunflower extends Flower {
	constructor(parent) {
		super('sunflower', parent);
	}
}
class Trumpet extends Flower {
	constructor(parent) {
		super('trumpet', parent);
	}
}
class Tulip extends Flower {
	constructor(parent) {
		super('tulip', parent);
	}
}
class Windmill extends Flower {
	constructor(parent) {
		super('windmill', parent);
	}
}
class Honey extends Flower {
	constructor(parent) {
		super('honey', parent, 'pngs/honey.png');
	}

	pollen = 10;
}

class Lilly extends ActorClass {
	constructor(type, parent) {
		super(
			`lilly-${type}`,
			Math.random() < .5
				? CharacterClass.random_right()
				: CharacterClass.random_left(),
			CharacterClass.random_y(),
		);

		this.death_action = () => {
			parent.dead(this);
		};
	}

	flower_type = 'lilly';

	pollen = 2;
}

class BlueLilly extends Lilly {
	constructor(parent) {
		super('blue', parent);
	}
}
class BrownLilly extends Lilly {
	constructor(parent) {
		super('brown', parent);
	}
}
class GreenLilly extends Lilly {
	constructor(parent) {
		super('green', parent);
	}
}
class OrangeLilly extends Lilly {
	constructor(parent) {
		super('orange', parent);
	}
}
class PassionLilly extends Lilly {
	constructor(parent) {
		super('passion', parent);
	}
}
class PurpleLilly extends Lilly {
	constructor(parent) {
		super('purple', parent);
	}
}
class RedLilly extends Lilly {
	constructor(parent) {
		super('red', parent);
	}
}
class TurquoiseLilly extends Lilly {
	constructor(parent) {
		super('turquoise', parent);
	}
}

export class Flowers {

	static flowers = [Sunflower, Trumpet, Tulip, Windmill, Honey];
	static lillies = [BlueLilly, BrownLilly, GreenLilly, OrangeLilly, PassionLilly, PurpleLilly, RedLilly, TurquoiseLilly];

	#create_random = (types) => {
		this.actors.push(
			new types[
				Math.floor(
					Math.random() * types.length
				)
			](this)
		);
	};

	actors = [];

	run = () => {
		let flowers_amount = 0, lillies_amount = 0;

		this.actors.forEach((x) => {
			x.run();

			if (x.flower_type == 'flower') {
				flowers_amount++;
			}
			else if (x.flower_type == 'lilly') {
				lillies_amount++;
			}
		});

		if (flowers_amount < MIN_FLOWERS) {
			this.#create_random(Flowers.flowers);
		}
		if (lillies_amount < MIN_LILLIES) {
			this.#create_random(Flowers.lillies);
		}
	}

	dead = (value) => {
		const actors = this.actors;

		const index = actors.indexOf(value);

		actors.splice(index, 1);

		if (value.flower_type == 'flower') {
			this.#create_random(Flowers.flowers);
		}
		else if (value.flower_type == 'lilly') {
			this.#create_random(Flowers.lillies);
		}
	};
}
