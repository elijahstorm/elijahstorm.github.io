/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in Elijah Storm's Portfolio Project


import {CinematicBackground} from '../portfolio/display/main.js';
import {CharacterClass, ActorClass, NormalBeeActor} from '/../ai/bees/bees.js';
import {Flowers} from '/../ai/bees/flowers.js';


new CinematicBackground(true);


NormalBeeActor.dialog_options = {
	// idle: true,
};
const eunbyeul = new NormalBeeActor(
	CharacterClass.random_x(),
	CharacterClass.random_y(),
);
const doungdoungei = new NormalBeeActor(
	CharacterClass.random_x(),
	CharacterClass.random_y(),
);
const kimchi = new NormalBeeActor(
	CharacterClass.random_x(),
	CharacterClass.random_y(),
);

NormalBeeActor.start_ai();

const flowers = [];
const bees = [eunbyeul, doungdoungei, kimchi];
const flower_types = ['tulip', 'windmill', 'sunflower', 'trumpet'];

function introduce() {
	setTimeout(() => {
		eunbyeul.speech = 'It looks pretty empty here?';
		setTimeout(() => {
			eunbyeul.speech = null;
			setTimeout(() => {
				eunbyeul.speech = 'What\'s supposed to be here?';
				setTimeout(() => {
					eunbyeul.speech = null;
				}, 5000);
			}, 3000);
		}, 5000);
	}, 2000);
	setTimeout(() => {
		doungdoungei.speech = 'This section is under development.';
		setTimeout(() => {
			doungdoungei.speech = null;
			setTimeout(() => {
				doungdoungei.speech = 'This place will be a fun story about the importance of Bees in our ecosystem.';
				setTimeout(() => {
					doungdoungei.speech = null;
					setTimeout(() => {
						kimchi.speech = 'Yeah! All this space will be replaced with a natural forest.';
						setTimeout(() => {
							kimchi.speech = null;
							setTimeout(() => {
								kimchi.speech = 'Why are you still here? I promise there\'s nothing interesting to wait for.';
								setTimeout(() => {
									kimchi.speech = null;
									setTimeout(() => {
										eunbyeul.speech = 'Seriously... go away.';
										setTimeout(() => {
											eunbyeul.speech = null;
											setTimeout(() => {
												eunbyeul.speech = 'Alright, you have to go. We\'re sending you back...';
												setTimeout(() => {
													window.location = '..';
												}, 5000);
											}, 15000);
										}, 5000);
									}, 10000);
								}, 5000);
							}, 10000);
						}, 5000);
					}, 0);
				}, 5000);
			}, 5000);
		}, 5000);
	}, 5000);
}
// introduce();
function apologize() {
	setTimeout(() => {
		document.getElementById('adventure-container').style.transition = 'opacity .5s ease';

		eunbyeul.speech = 'This is all in development.';
		document.getElementById('adventure-container').style.opacity = '.4';
		setTimeout(() => {
			eunbyeul.speech = null;
			document.getElementById('adventure-container').style.opacity = '1';
			setTimeout(() => {
				doungdoungei.speech = 'I am actively working on this, and it\'ll be cool soon :) - Elijah 12/01/2021';
				document.getElementById('adventure-container').style.opacity = '.4';
				setTimeout(() => {
					doungdoungei.speech = null;
					document.getElementById('adventure-container').style.opacity = '1';
					setTimeout(() => {
						kimchi.speech = 'Thank you for checking out my project development! I would love if you left me a message, you can do that by hitting the back button!';
						document.getElementById('adventure-container').style.opacity = '.4';
						setTimeout(() => {
							kimchi.speech = null;
							document.getElementById('adventure-container').style.opacity = '1';
							document.querySelector('#exit-nav-back-button>*>div').classList.add('w3-red');
						}, 5000);
					}, 1000);
				}, 5000);
			}, 2000);
		}, 5000);
	}, 2000);
}
apologize();

const chase_flowers = (bee) => {
	return () => {
		const target = bee.best_untargeted_flower(flowers);

		if (target == null) {
			bee.search();
			return;
		}

		bee.chase(target);
	};
};
const search_function = (bee) => bee.search;

window.addEventListener('click', e => {
	let offsetX = 15;
	let offsetY = 85;

	if (window.innerWidth < 600) {
		offsetX = 20;
		offsetY = 60;
	}

	new Flower(
		flower_types[
			Math.floor(
				Math.random() * flower_types.length
			)
		],
		e.clientX - offsetX,
		e.clientY - offsetY,
		flowers,
	);
});

setInterval(() => {

	let act_function = search_function;

	if (flowers.length != 0) {
		act_function = chase_flowers;
	}

	bees.forEach(bee => {
		bee.act = act_function(bee);

		setTimeout(() => {
			bee.run();
		}, Math.random() * bees.length * 1000);
	});

	flowers.forEach(f => f.run());
}, bees.length * 1500);

class Flower extends ActorClass {
	constructor(type, x, y, list) {
		super(`flower-${type}`, x, y);

		this.#list = list;
		list.push(this);
	}

	#list;

	act = () => {
		this.life -= bees.length * 2;
	};

	pollen = 0;

	death_action = () => {
		this.#list.splice(
			this.#list.indexOf(
				this
			),
			1,
		);
	};
}

const BACK_BUTTON_ONLOAD_ANIMATION_TIMEOUT = 1000;
setTimeout(() => {
	document.querySelector('#exit-nav-back-button .ease').classList.add('w3-red');
	setTimeout(() => {
		document.querySelector('#exit-nav-back-button .ease').classList.remove('w3-red');
		setTimeout(() => {
			document.querySelector('#exit-nav-back-button .ease').classList.add('w3-red');
			setTimeout(() => {
				document.querySelector('#exit-nav-back-button .ease').classList.remove('w3-red');
			}, BACK_BUTTON_ONLOAD_ANIMATION_TIMEOUT);
		}, BACK_BUTTON_ONLOAD_ANIMATION_TIMEOUT);
	}, BACK_BUTTON_ONLOAD_ANIMATION_TIMEOUT);
}, BACK_BUTTON_ONLOAD_ANIMATION_TIMEOUT * 3);
