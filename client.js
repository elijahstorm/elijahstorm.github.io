/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in Elijah Storm's Portfolio Project


import '/portfolio/portfolio.data.js';
import {CinematicBackground} from '/portfolio/display/main.js';
import {CharacterClass, ActorClass, NormalBeeActor} from '/ai/bees/bees.js';
import {Flowers} from '/ai/bees/flowers.js';


const CINEMATIC_BACKGROUND = new CinematicBackground();


function validateEmail(email) {
	// /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
}
function CONTACT() {
	const err = (msg) => {
		document.getElementById('contact-error').style.display = 'block';
		document.getElementById('contact-error').innerHTML = msg;
	};
	let name, body, sender;

	name = document.getElementById('contact-name').value;
	sender = document.getElementById('contact-email').value;
	body = document.getElementById('contact-message').value;

	if(name == '' || body == '' || sender == '') {
		err('Make sure to fill all forms');
		return;
	}
	if(name.length>100 || body.length>1500) {
		err('Your messge is too long');
		return;
	}

	err('');
	document.getElementById('contact-error').style.display = 'none';

	socket.emit('email', {
		email: sender,
		name: name,
		body: body,
	});
}

var title_box_alert = function(updated){
	var old = document.title;
	this.time = 1000;
	var kill = false;
	var self = this;
	var toggle = true;
	this.stop = function(){
		kill = true;
	};
	var refresh_fnc = function(){
		if(kill){
			document.title = old;
			return;
		}
		if(toggle)
		{
			document.title = updated;
			toggle = false;
		}
		else
		{
			document.title = old;
			toggle = true;
		}
		setTimeout(refresh_fnc, self.time);
	};
	refresh_fnc();
};
var LOADED = false;
var socket;
if(typeof io!=='undefined'){socket = io();}
var onFinishedLoadingList = [];
function onFinishedLoading(fnc){
	if(onFinishedLoadingList==null)return;
	onFinishedLoadingList.push(fnc);
}
window.onload = function() {
	LOADED = true;
	socket.on('public log', function(msg, color, time){
	});

	socket.on('message', function(data){
	// timestamp("MESSAGE: "+data.type);
		if(data.type==null)return;
			/** initiate connection and errors */
		if(data.type==0)
		{	// refresh connection

		}
		else if(data.type==1)
		{ /** unused */	}

			/** logs */
		else if(data.type==110)
		{	// console log message
			console.warn("WARNING: IMPROPER USE OF MESSAGING");
			console.log(data.msg);
		}
	});
	for(var i in onFinishedLoadingList){
		onFinishedLoadingList[i]();
	}
	onFinishedLoadingList = null;
};


// NormalBeeActor.dialog_options = {
// 	idle: true,
// };
const eunbyeul = new NormalBeeActor(
	CharacterClass.random_x(),
	CharacterClass.random_y(),
);
const doungdoungei = new NormalBeeActor(
	CharacterClass.random_x(),
	CharacterClass.random_y(),
);
// const kimchi = new NormalBeeActor(
// 	CharacterClass.random_x(),
// 	CharacterClass.random_y(),
// );

NormalBeeActor.start_ai();

setTimeout(() => {
	eunbyeul.speech = 'Click one of us to go on an adventure';
	setTimeout(() => {
		eunbyeul.speech = null;
	}, 5000);
}, 5000);

const flowers = [];
const bees = [eunbyeul, doungdoungei];
const flower_types = ['tulip', 'windmill', 'sunflower', 'trumpet'];

document.body.onscroll = () => {
	bees.forEach(bee => {
		bee.__window_offset = {
			x: window.scrollX,
			y: window.scrollY,
		};
	});
	CINEMATIC_BACKGROUND.update_camera();
};

bees.forEach(bee => {
	bee.onclick = () => {
		window.location = '/adventure';
	};
	bee.sight_distance = 1000;
});

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

	const flower = new Flower(
		flower_types[
			Math.floor(
				Math.random() * flower_types.length
			)
		],
		e.clientX - offsetX,
		e.clientY - offsetY,
		flowers,
	);
	flower.__movement_slide_off = true;
	flower.__window_offset = {
		x: window.scrollX,
		y: window.scrollY,
	};
	flower.move();
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

function timestamp(){
	var str = "";
	for(var i in arguments)
	{
		str+=arguments[i]+" ";
	}
	console.log(new Date().toLocaleTimeString(),"->",str);
}

document.querySelectorAll("input, textarea, .w3-button, button").forEach(el => {
	if (el.onclick != null) return;
	el.onclick = (e) => e.stopImmediatePropagation();
});

document.getElementById('send-message-btn').onclick = function(e) {
	CONTACT();
	e.stopImmediatePropagation();
};


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
