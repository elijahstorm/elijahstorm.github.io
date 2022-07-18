/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in Elijah Storm's Portfolio Project

  /**
  	*	Feel free to look through self code to see how I
  	*	approach soultions :)
   	*/

  /**
  	*	In order to maximize effeciency and performace ->
  	* We will constantly be running the engine Evaluation
  	* in a seprate worker thread, and from the results of
  	* the best moves, the AI will just choose the best moves
  	* -------------------------------------------------
  	* this is the worker file that manages evaluating the position
   	*/


'use strict';
self.postMessage = (self.webkitPostMessage || self.postMessage);

const Evaluation = function(input_engine) {
	let self = this;

	const INFINITY = 99999;	// represents checkmate in score
	const DELAY = 5;	// slows threaded calc. down to improve performance

		// heat map for better positional evaluation
	const OPENING = {
		'P': [
			6.0,	6.0,	6.0,	6.0,	6.0,	6.0,	6.0,	6.0,
			0.1,	0.1,	0.1,	0.1,	0.1,	0.1,	0.1,	0.1,
			0.1,	0.1,	0.1,	0.1,	0.1,	0.1,	0.1,	0.1,
			0.1,	0.2,	0.2,	0.1,	0.1,	0.2,	0.2,	0.1,
			0.1,	0.1,	0.1,	0.2,	0.2,	0.1,	0.1,	0.1,
			0.1,	0.2,	0.2,	0.1,	0.1,	0.2,	0.2,	0.1,
			0.1,	0.1,	0.1,	0.0,	0.0,	0.1,	0.1,	0.1,
			0.0,	0.0,	0.0,	0.0,	0.0,	0.0,	0.0,	0.0,
		],
		'N': [
			0.0,	0.1,	0.2,	0.2,	0.2,	0.2,	0.1,	0.0,
			0.1,	0.2,	0.4,	0.4,	0.4,	0.4,	0.2,	0.1,
			0.2,	0.4,	0.6,	0.6,	0.6,	0.6,	0.4,	0.2,
			0.2,	0.4,	0.6,	0.8,	0.8,	0.6,	0.4,	0.2,
			0.2,	0.4,	0.6,	0.8,	0.8,	0.6,	0.4,	0.2,
      0.2,	0.4,	0.6,	0.6,	0.6,	0.6,	0.4,	0.2,
      0.1,	0.2,	0.4,	0.4,	0.4,	0.4,	0.2,	0.1,
      0.0,	0.1,	0.2,	0.2,	0.2,	0.2,	0.1,	0.0,
		],
		'B': [
			-0.15,	0.0,	0.0,	0.0,	0.0,	0.0,	-0.1,	-0.2,
			-0.01,	0.1,	0.1,	0.1,	0.1,	0.1,	0.1,	0.1,
			0.15,	0.15,	0.1,	0.1,	0.1,	0.1,	0.05,	0.15,
			0.05,	0.25,	0.1,	0.15,	0.15,	0.1,	0.2,	0.1,
			0.15,	0.1,	0.25,	0.15,	0.15,	0.15,	0.1,	0.15,
			0.17,	0.3,	0.2,	0.3,	0.35,	0.2,	0.3,	0.13,
			0.15,	0.4,	0.3,	0.2,	0.25,	0.3,	0.45,	0.15,
			0.05,	0.15,	0.2,	0.2,	0.2,	0.2,	0.1,	0.05,
		],
		'R': [
			0.3,	0.15,	0.25,	0.5,	0.5,	0.25,	0.15,	0.3,
			0.2,	0.2,	0.35,	0.4,	0.4,	0.25,	0.35,	0.2,
			0.1,	0.15,	0.25,	0.35,	0.35,	0.25,	0.15,	0.1,
			0.1,	0.15,	0.25,	0.45,	0.45,	0.25,	0.15,	0.1,
			0.1,	0.15,	0.25,	0.45,	0.45,	0.25,	0.15,	0.1,
			0.1,	0.35,	0.3,	0.4,	0.4,	0.2,	0.3,	0.1,
			0.1,	0.2,	0.2,	0.6,	0.6,	0.2,	0.2,	0.0,
			0.5,	0.1,	0.2,	0.5,	0.5,	0.0,	0.1,	0.5,
		],
		'Q': [
			0.2,	0.2,	0.2,	0.2,	0.2,	0.2,	0.2,	0.2,
			0.4,	0.5,	0.6,	0.2,	0.3,	0.4,	0.7,	0.6,
			0.1,	0.2,	0.2,	0.2,	0.2,	0.2,	0.2,	0.1,
			0.1,	0.25,	0.25,	0.25,	0.25,	0.25,	0.25,	0.3,
			0.3,	0.1,	0.15,	0.3,	0.3,	0.15,	0.17,	0.1,
			0.1,	0.2,	0.2,	0.1,	0.1,	0.2,	0.2,	0.1,
			0.0,	0.1,	0.17,	0.17,	0.17,	0.1,	0.05,	0.0,
			0.0,	0.05,	0.1,	0.3,	0.1,	0.05,	0.0,	0.0,
		],
		'K': [
			-1.0,	-1.0,	-1.0,	-1.0,	-1.0,	-1.0,	-1.0,	-1.0,
			-0.5,	-0.5,	-0.5,	-0.5,	-0.5,	-0.5,	-0.5,	-0.5,
			-0.1,	-0.1,	-0.1,	-0.1,	-0.1,	-0.1,	-0.1,	-0.1,
			-0.05,	-0.05,	-0.1,	-0.2,	-0.2,	-0.1,	-0.05,	-0.05,
			0.01,	0.0,	-0.1,	-0.2,	-0.2,	-0.1,	-0.1,	0.0,
			0.02,	0.01,	0.03,	0.05,	0.05,	0.07,	0.1,	0.03,
			0.05,	0.05,	0.1,	0.01,	0.01,	0.1,	0.2,	0.07,
			0.1,	0.1,	0.2,	0.05,	0.2,	0.3,	0.5,	0.1,
		],
	};
	const MIDDLE = {
		'P': [
			6.0,	6.0,	6.0,	6.0,	6.0,	6.0,	6.0,	6.0,
			1.4,	1.4,	1.4,	1.4,	1.4,	1.4,	1.4,	1.4,
			0.85,	0.85,	0.85,	0.85,	0.85,	0.85,	0.85,	0.85,
			0.1,	0.2,	0.2,	0.1,	0.1,	0.2,	0.2,	0.1,
			0.1,	0.1,	0.1,	0.2,	0.2,	0.1,	0.1,	0.1,
			0.1,	0.2,	0.2,	0.1,	0.1,	0.2,	0.2,	0.1,
			0.1,	0.1,	0.1,	0.0,	0.0,	0.1,	0.1,	0.1,
			0.0,	0.0,	0.0,	0.0,	0.0,	0.0,	0.0,	0.0,
		],
		'N': [
			0.5,	0.2,	0.3,	0.3,	0.3,	0.3,	0.2,	0.5,
			0.2,	0.3,	0.5,	0.5,	0.5,	0.5,	0.3,	0.2,
			0.3,	0.5,	0.7,	0.7,	0.7,	0.7,	0.5,	0.3,
			0.25,	0.45,	0.65,	0.85,	0.85,	0.65,	0.45,	0.25,
			0.2,	0.4,	0.6,	0.8,	0.8,	0.6,	0.4,	0.2,
      0.2,	0.4,	0.6,	0.6,	0.6,	0.6,	0.4,	0.2,
      0.1,	0.2,	0.4,	0.4,	0.4,	0.4,	0.2,	0.1,
      0.0,	0.1,	0.2,	0.2,	0.2,	0.2,	0.1,	0.0,
		],
		'B': [
			-0.15,	0.0,	0.0,	0.0,	0.0,	0.0,	-0.1,	-0.2,
			-0.01,	0.1,	0.1,	0.1,	0.1,	0.1,	0.1,	0.1,
			0.15,	0.15,	0.1,	0.1,	0.1,	0.1,	0.05,	0.15,
			0.05,	0.25,	0.1,	0.15,	0.15,	0.1,	0.2,	0.1,
			0.15,	0.1,	0.25,	0.15,	0.15,	0.15,	0.1,	0.15,
			0.17,	0.3,	0.2,	0.3,	0.35,	0.2,	0.3,	0.13,
			0.15,	0.4,	0.3,	0.2,	0.25,	0.3,	0.45,	0.15,
			0.05,	0.15,	0.2,	0.2,	0.2,	0.2,	0.1,	0.05,
		],
		'R': [
			0.3,	0.15,	0.25,	0.5,	0.5,	0.25,	0.15,	0.3,
			0.2,	0.2,	0.35,	0.4,	0.4,	0.25,	0.35,	0.2,
			0.1,	0.15,	0.25,	0.35,	0.35,	0.25,	0.15,	0.1,
			0.1,	0.15,	0.25,	0.45,	0.45,	0.25,	0.15,	0.1,
			0.1,	0.15,	0.25,	0.45,	0.45,	0.25,	0.15,	0.1,
			0.1,	0.35,	0.3,	0.4,	0.4,	0.2,	0.3,	0.1,
			0.1,	0.2,	0.2,	0.6,	0.6,	0.2,	0.2,	0.0,
			0.5,	0.1,	0.2,	0.5,	0.5,	0.0,	0.1,	0.5,
		],
		'Q': [
			0.2,	0.2,	0.2,	0.2,	0.2,	0.2,	0.2,	0.2,
			0.4,	0.5,	0.6,	0.2,	0.3,	0.4,	0.7,	0.6,
			0.1,	0.2,	0.2,	0.2,	0.2,	0.2,	0.2,	0.1,
			0.1,	0.25,	0.25,	0.25,	0.25,	0.25,	0.25,	0.3,
			0.3,	0.1,	0.15,	0.3,	0.3,	0.15,	0.17,	0.1,
			0.1,	0.2,	0.2,	0.1,	0.1,	0.2,	0.2,	0.1,
			0.0,	0.1,	0.17,	0.17,	0.17,	0.1,	0.05,	0.0,
			0.0,	0.05,	0.1,	0.3,	0.1,	0.05,	0.0,	0.0,
		],
		'K': [
			-1.0,	-1.0,	-1.0,	-1.0,	-1.0,	-1.0,	-1.0,	-1.0,
			-0.5,	-0.5,	-0.5,	-0.5,	-0.5,	-0.5,	-0.5,	-0.5,
			-0.1,	-0.1,	-0.1,	-0.1,	-0.1,	-0.1,	-0.1,	-0.1,
			-0.05,	-0.05,	-0.1,	-0.2,	-0.2,	-0.1,	-0.05,	-0.05,
			0.01,	0.0,	-0.1,	-0.2,	-0.2,	-0.1,	-0.1,	0.0,
			0.02,	0.01,	0.03,	0.05,	0.05,	0.07,	0.1,	0.03,
			0.05,	0.05,	0.1,	0.01,	0.01,	0.1,	0.2,	0.07,
			0.1,	0.1,	0.1,	0.02,	0.2,	0.2,	0.3,	0.1,
		],
	};
	const ENDGAME = {
		'P': [
			6.0,	6.0,	6.0,	6.0,	6.0,	6.0,	6.0,	6.0,
			5.0,	5.0,	5.0,	5.0,	5.0,	5.0,	5.0,	5.0,
			4.0,	4.0,	4.0,	4.0,	4.0,	4.0,	4.0,	4.0,
			3.0,	3.0,	3.0,	3.0,	3.0,	3.0,	3.0,	3.0,
			2.0,	2.0,	2.0,	2.0,	2.0,	2.0,	2.0,	2.0,
			1.0,	1.0,	1.0,	1.0,	1.0,	1.0,	1.0,	1.0,
			0.0,	0.0,	0.0,	0.0,	0.0,	0.0,	0.0,	0.0,
			0.0,	0.0,	0.0,	0.0,	0.0,	0.0,	0.0,	0.0,
		],
		'N': [
			0.0,	0.1,	0.2,	0.2,	0.2,	0.2,	0.1,	0.0,
			0.1,	0.2,	0.4,	0.4,	0.4,	0.4,	0.2,	0.1,
			0.2,	0.4,	0.6,	0.6,	0.6,	0.6,	0.4,	0.2,
			0.2,	0.4,	0.6,	0.8,	0.8,	0.6,	0.4,	0.2,
			0.2,	0.4,	0.6,	0.8,	0.8,	0.6,	0.4,	0.2,
      0.2,	0.4,	0.6,	0.6,	0.6,	0.6,	0.4,	0.2,
      0.1,	0.2,	0.4,	0.4,	0.4,	0.4,	0.2,	0.1,
      0.0,	0.1,	0.2,	0.2,	0.2,	0.2,	0.1,	0.0,
		],
		'B': [
			0.0,	0.05,	0.10,	0.15,	0.15,	0.10,	0.05,	0.0,
			0.05,	0.1,	0.15,	0.2,	0.2,	0.15,	0.1,	0.05,
			0.10,	0.15,	0.2,	0.3,	0.3,	0.2,	0.15,	0.10,
			0.15,	0.2,	0.3,	0.4,	0.4,	0.3,	0.2,	0.15,
			0.15,	0.2,	0.3,	0.4,	0.4,	0.3,	0.2,	0.15,
			0.10,	0.15,	0.2,	0.3,	0.3,	0.2,	0.15,	0.10,
			0.05,	0.1,	0.15,	0.2,	0.2,	0.15,	0.1,	0.05,
			0.0,	0.05,	0.10,	0.15,	0.15,	0.10,	0.05,	0.0,
		],
		'R': [
			0.2,	0.2,	0.25,	0.3,	0.3,	0.25,	0.2,	0.2,
			0.2,	0.2,	0.35,	0.4,	0.4,	0.35,	0.2,	0.2,
			0.25,	0.35,	0.35,	0.45,	0.45,	0.35,	0.35,	0.25,
			0.3,	0.35,	0.45,	0.55,	0.55,	0.45,	0.35,	0.3,
			0.3,	0.35,	0.45,	0.55,	0.55,	0.45,	0.35,	0.3,
			0.28,	0.38,	0.38,	0.48,	0.48,	0.38,	0.38,	0.28,
			0.25,	0.25,	0.4,	0.45,	0.45,	0.4,	0.25,	0.25,
			0.27,	0.27,	0.33,	0.37,	0.37,	0.33,	0.27,	0.27,
		],
		'Q': [
			0.2,	0.3,	0.4,	0.5,	0.5,	0.4,	0.3,	0.2,
			0.3,	0.4,	0.5,	0.5,	0.5,	0.5,	0.4,	0.3,
			0.4,	0.5,	0.5,	0.6,	0.6,	0.5,	0.5,	0.4,
			0.5,	0.6,	0.7,	0.75,	0.75,	0.7,	0.6,	0.5,
			0.5,	0.6,	0.7,	0.75,	0.75,	0.7,	0.6,	0.5,
			0.4,	0.5,	0.5,	0.6,	0.6,	0.5,	0.5,	0.4,
			0.3,	0.4,	0.5,	0.5,	0.5,	0.5,	0.4,	0.3,
			0.2,	0.3,	0.4,	0.5,	0.5,	0.4,	0.3,	0.2,
		],
		'K': [
			-6.0,	-5.0,	-4.9,	-4.5,	-4.5,	-4.9,	-5.0,	-6.0,
			-5.0,	-4.5,	-2.5,	-2.0,	-2.0,	-2.5,	-4.5,	-5.0,
			-4.9,	-2.0,	-1.5,	-1.0,	-1.0,	-1.5,	-2.0,	-4.9,
			-4.5,	-1.0,	-0.5,	1.0,	1.0,	-0.5,	-1.0,	-4.5,
			-4.5,	-1.0,	-0.5,	1.0,	1.0,	-0.5,	-1.0,	-4.5,
			-4.9,	-2.0,	-1.5,	-1.0,	-1.0,	-1.5,	-2.0,	-4.9,
			-5.0,	-4.5,	-2.5,	-2.0,	-2.0,	-2.5,	-4.5,	-5.0,
			-6.0,	-5.0,	-4.9,	-4.5,	-4.5,	-4.9,	-5.0,	-6.0,
		],
	};

	const DYNAMIC = [OPENING, MIDDLE, ENDGAME];

    // a few helper functions for the make_move process
  function square_color(location) {
		if ((Math.floor(location / 8) + location) % 2 == 1)
			return true;	// true for white
		return false;	// false for black
	}
	function clone_status(status) {
		return {
			activeKing: status.activeKing,
			inactiveKing: status.inactiveKing,
			whiteKingsideCastle: status.whiteKingsideCastle,
			whiteQueensideCastle: status.whiteQueensideCastle,
			blackKingsideCastle: status.blackKingsideCastle,
			blackQueensideCastle: status.blackQueensideCastle,
			enpassant: status.enpassant,
			fullmoves: status.fullmoves,
			halfmoves: status.halfmoves,
			whiteActive: status.whiteActive,
			inCheck: status.inCheck,
		};
	}
  function clone_engine(source_engine) {
		let _cloned_map = source_engine.map.slice();

		let status = clone_status(source_engine.status);

		let new_engine = {
			map: _cloned_map,
			status: status,
		};
    new_engine.transposition = Transpositions.state(new_engine);

		new_engine.pins = source_engine.pins.slice();
		new_engine.threats = source_engine.threats.slice();
		new_engine.attacks = source_engine.attacks.slice();
		new_engine.checking_pieces = source_engine.checking_pieces.slice();
		new_engine.transposition = source_engine.transposition;
		new_engine.active_pieces = source_engine.active_pieces.slice();
		new_engine.inactive_pieces = source_engine.inactive_pieces.slice();
		new_engine.attackers = source_engine.attackers.slice();
		new_engine.defenders = source_engine.defenders.slice();
		new_engine.board_state = source_engine.board_state;

		return new_engine;
	}
	function remove_duplicates(array) {
		let seen = {};

		return array.filter(function(item) {
			return seen.hasOwnProperty(item) ? false : (seen[item] = true);
		});
	}

    // commiting a move to the engine, and undoing it to consider moves
	function make_move(engine, move) {

					// execute and evaluate the current move ->
					// we keep track of if a piece was captured
					// so we can bring it back when we undo the
					// last board state change -- this is a very
					// lightweight memory approach to remembering
					// past board states without using much memory

		move.previous = {
			status: clone_status(engine.status),
			threats: engine.threats.slice(),
			attacks: engine.attacks.slice(),
			pins: engine.pins.slice(),
			checking_pieces: engine.checking_pieces.slice(),
			map: engine.map.slice(),
			transposition: engine.transposition,
			active_pieces: engine.active_pieces.slice(),
			inactive_pieces: engine.inactive_pieces.slice(),
			attackers: engine.attackers.slice(),
			defenders: engine.defenders.slice(),
		};
		move.previous.status.captured_piece = engine.map[move.dest];

			// remove captured piece
		if (engine.map[move.dest] != Pieces.empty) {
			engine.status.halfmoves = -1;

			engine.transposition = Transpositions.transform(
				engine.transposition,
				engine.map[move.dest],
				move.dest,
			);

			engine.defenders.splice(
				engine.map[move.dest],
				1,
				null,
			);

			engine.inactive_pieces.splice(
				engine.inactive_pieces.indexOf(
					move.dest
				), 1
			);
		}

		engine.transposition = Transpositions.move(
			engine.transposition,
			engine.map[move.source],
			move,
		);
		if (engine.status.enpassant != null) {
			engine.transposition = Transpositions.enpassant(
				engine.transposition,
				engine.status.enpassant,
			);
		}

		engine.attackers.splice(
			engine.map[move.source],
			1,
			Pieces.All_Possible_Moves(
				engine,
				move.dest,
				true,
			),
		);

		engine.map[move.dest] = engine.map[move.source];
		engine.map[move.source] = Pieces.empty;
		engine.active_pieces.splice(
			engine.active_pieces.indexOf(
				move.source
			), 1
		);
		engine.active_pieces.push(move.dest);

			//// this part below will help us update the engine->status

		if (move.source == engine.status.activeKing) {
			engine.status.activeKing = engine.status.inactiveKing;
			engine.status.inactiveKing = move.dest;

					// handle castles
			let kingHome;

			if (engine.status.whiteActive) {
				if (engine.status.whiteKingsideCastle) {
					engine.transposition = Transpositions.castle(
						engine.transposition,
						{
							whiteKingsideCastle: true,
						},
					);
				}
				if (engine.status.whiteQueensideCastle) {
					engine.transposition = Transpositions.castle(
						engine.transposition,
						{
							whiteQueensideCastle: true,
						},
					);
				}
				engine.status.whiteKingsideCastle = false;
				engine.status.whiteQueensideCastle = false;
			}
			else {
				if (engine.status.blackKingsideCastle) {
					engine.transposition = Transpositions.castle(
						engine.transposition,
						{
							blackKingsideCastle: true,
						},
					);
				}
				if (engine.status.blackQueensideCastle) {
					engine.transposition = Transpositions.castle(
						engine.transposition,
						{
							blackQueensideCastle: true,
						},
					);
				}
				engine.status.blackKingsideCastle = false;
				engine.status.blackQueensideCastle = false;
			}

      let new_rook_location, old_rook_location;

			if (move.source == kingHome && move.dest == kingHome - 2) {	// queenside castle
        new_rook_location = kingHome - 1;
        old_rook_location = kingHome - 4;
			}
			else if (move.source == kingHome && move.dest == kingHome + 2) {	// queenside castle
        new_rook_location = kingHome + 1;
        old_rook_location = kingHome + 3;
			}

      if (new_rook_location != null) {
        engine.attackers.splice(
          engine.map[old_rook_location],
          1,
          Pieces.All_Possible_Moves(
            engine,
            new_rook_location,
            true,
          ),
        );
        engine.active_pieces.splice(
          engine.active_pieces.indexOf(
            old_rook_location
          ), 1
        );
        engine.active_pieces.push(new_rook_location);
        engine.map[new_rook_location] = engine.map[old_rook_location];
        engine.map[old_rook_location] = Pieces.empty;
        engine.transposition = Transpositions.move(
          engine.transposition,
          engine.map[new_rook_location],
          {
            source: old_rook_location,
            dest: new_rook_location,
          },
        );
      }
		}
		else {
			let temp = engine.status.activeKing;
			engine.status.activeKing = engine.status.inactiveKing;
			engine.status.inactiveKing = temp;
		}

		engine.status.whiteActive = !engine.status.whiteActive;
		engine.status.halfmoves++;
		if (engine.status.whiteActive) engine.status.fullmoves++;

				// these are moves that would stop a future castle opportunity
		if (engine.status.whiteActive) {
			if (engine.status.whiteQueensideCastle && move.dest == 0) {
				engine.transposition = Transpositions.castle(
					engine.transposition,
					{
						whiteQueensideCastle: true,
					},
				);
				engine.status.whiteQueensideCastle = false;
			}
			else if (engine.status.whiteKingsideCastle && move.dest == 7) {
				engine.transposition = Transpositions.castle(
					engine.transposition,
					{
						whiteKingsideCastle: true,
					},
				);
				engine.status.whiteKingsideCastle = false;
			}
			else if (engine.status.blackQueensideCastle && move.dest == 56) {
				engine.transposition = Transpositions.castle(
					engine.transposition,
					{
						blackQueensideCastle: true,
					},
				);
				engine.status.blackQueensideCastle = false;
			}
			else if (engine.status.blackKingsideCastle && move.dest == 63) {
  			engine.transposition = Transpositions.castle(
  				engine.transposition,
  				{
  					blackKingsideCastle: true,
  				},
  			);
  			engine.status.blackKingsideCastle = false;
  		}
		}
		else {
			if (engine.status.whiteQueensideCastle && move.source == 0) {
				engine.transposition = Transpositions.castle(
					engine.transposition,
					{
						whiteQueensideCastle: true,
					},
				);
				engine.status.whiteQueensideCastle = false;
			}
			else if (engine.status.whiteKingsideCastle && move.source == 7) {
				engine.transposition = Transpositions.castle(
					engine.transposition,
					{
						whiteKingsideCastle: true,
					},
				);
				engine.status.whiteKingsideCastle = false;
			}
			else if (engine.status.blackQueensideCastle && move.source == 56) {
				engine.transposition = Transpositions.castle(
					engine.transposition,
					{
						blackQueensideCastle: true,
					},
				);
				engine.status.blackQueensideCastle = false;
			}
			else if (engine.status.blackKingsideCastle && move.source == 63) {
  			engine.transposition = Transpositions.castle(
  				engine.transposition,
  				{
  					blackKingsideCastle: true,
  				},
  			);
  			engine.status.blackKingsideCastle = false;
  		}
		}

			// if last move was a pawn push
		if (Pieces.dereference(engine.map[move.dest] % 16) == 'P') {

			engine.status.halfmoves = 0;

				// promotion on back rank
			if (Math.floor(move.dest / 8) == 7 || Math.floor(move.dest / 8) == 0) {
				const PROMOTION_CHOICE = 1;

				let isWhite = Pieces.isWhite(engine.map[move.dest]);
				let promotion_increment = 1;
						// find how many pieces of that type each side has already

						// cycle thru and tally each duplicate piece
				for (let i=0;i<engine.active_pieces.length;i++) {
					if (engine.map[engine.active_pieces[i]] == PROMOTION_CHOICE) promotion_increment++;
				}

				let promotionValue = (isWhite ? 0 : 16) + PROMOTION_CHOICE
							+ 32 * promotion_increment;
							// create new index based off of duplicates

				engine.transposition = Transpositions.transform(
					Transpositions.transform(
						engine.transposition,
						engine.map[move.dest],
						move.dest,
					),
					promotionValue,
					move.dest,
				);
				engine.map[move.dest] = promotionValue;
				engine.attackers[promotionValue] = Pieces.All_Possible_Moves(
					engine,
					move.dest,
					true,
				);
			}

				// capturing on en passant
			else if (engine.status.enpassant != null) {
				let file = engine.status.enpassant[0];
				let row = 9 - parseInt(engine.status.enpassant[1]) - 1;

				if (file == 'a') file = 0;
				else if (file == 'b') file = 1;
				else if (file == 'c') file = 2;
				else if (file == 'd') file = 3;
				else if (file == 'e') file = 4;
				else if (file == 'f') file = 5;
				else if (file == 'g') file = 6;
				else if (file == 'h') file = 7;

				if (move.dest == squareFromXY(file, row)) {
					let DIRECTION = Pieces.isWhite(engine.map[move.dest]);

					let enpassant_location = move.dest + (8 * (
						engine.status.whiteActive ? 1 : -1
					));
					move.previous.status.captured_piece = 100 + engine.map[
						enpassant_location
					];

					engine.defenders.splice(
						engine.map[enpassant_location],
						1,
						null,
					);
					engine.inactive_pieces.splice(
						engine.inactive_pieces.indexOf(
							enpassant_location
						), 1
					);
          engine.map[enpassant_location] = Pieces.empty;

					for (let i=0;i<engine.inactive_pieces.length;i++) {
						let attack_list = engine.defenders[
							engine.map[
								engine.inactive_pieces[i]
							]
						];

						if (
							attack_list.includes(enpassant_location)
						) {
							attack_list = Pieces.All_Possible_Moves(
								engine,
								engine.inactive_pieces[i],
								true,
							);

							engine.defenders[
								engine.map[
									engine.inactive_pieces[i]
								]
							] = attack_list;
						}
					}

					for (let i=0;i<engine.active_pieces.length;i++) {
						let attack_list = engine.attackers[
							engine.map[
								engine.active_pieces[i]
							]
						];

						if (
							attack_list.includes(enpassant_location)
						) {
							attack_list = Pieces.All_Possible_Moves(
								engine,
								engine.active_pieces[i],
								true,
							);

							engine.attackers[
								engine.map[
									engine.active_pieces[i]
								]
							] = attack_list;
						}
					}
				}
			}

				// if last move was double move, then make en passant possible
			if (Math.abs(move.source - move.dest) == 16) {

					// here we set the en passent value as a string
					// its quick, but ugly, code it into proper fen

				engine.status.enpassant =	// speed is key here as this will be ran a lot
					`${'abcdefgh'[move.dest % 8]}${(Math.floor(move.source / 8) + Math.floor(move.dest / 8)) / 2 + 1}`;

				engine.transposition = Transpositions.enpassant(
					engine.transposition,
					engine.status.enpassant,
				);
			}
			else engine.status.enpassant = null;
		}
		else engine.status.enpassant = null;

    [engine.inactive_pieces, engine.active_pieces] =
      [engine.active_pieces, engine.inactive_pieces];

    [engine.attackers, engine.defenders] =
      [engine.defenders, engine.attackers];

		engine.checking_pieces = [];

		let threats_array = [];
		for (let i=0;i<engine.inactive_pieces.length;i++) {
			let attack_list = engine.defenders[
				engine.map[
					engine.inactive_pieces[i]
				]
			];

			if (
				attack_list.includes(move.source) ||
				attack_list.includes(move.dest)
			) {
				attack_list = Pieces.All_Possible_Moves(
					engine,
					engine.inactive_pieces[i],
					true,
				);

				engine.defenders[
					engine.map[
						engine.inactive_pieces[i]
					]
				] = attack_list;
			}

			threats_array = threats_array.concat(attack_list);

			if (
				attack_list.includes(engine.status.activeKing)
			) {
				engine.checking_pieces.push(engine.inactive_pieces[i]);
			}
		}
		engine.threats = remove_duplicates(threats_array);

		let _in_check = false;
		if (engine.threats.includes(engine.activeKing)) {
			_in_check = true;
		}

		threats_array = [];
		for (let i=0;i<engine.active_pieces.length;i++) {
			let attack_list = engine.attackers[
				engine.map[
					engine.active_pieces[i]
				]
			];

      if (attack_list == null) continue;

			if (
				_in_check ||
				attack_list.includes(move.source) ||
				attack_list.includes(move.dest)
			) {
				attack_list = Pieces.All_Possible_Moves(
					engine,
					engine.active_pieces[i],
					true,
				);

				engine.attackers[
					engine.map[
						engine.active_pieces[i]
					]
				] = attack_list;
			}

			threats_array = threats_array.concat(attack_list);
		}
		engine.attacks = remove_duplicates(threats_array);
	}
	function undo_move(engine, move) {

		if (move.previous == null) return;

		engine.status = move.previous.status;
		engine.threats = move.previous.threats;
		engine.attacks = move.previous.attacks;
		engine.pins = move.previous.pins;
		engine.checking_pieces = move.previous.checking_pieces;
		engine.map = move.previous.map;
		engine.transposition = move.previous.transposition;
		engine.active_pieces = move.previous.active_pieces;
		engine.inactive_pieces = move.previous.inactive_pieces;
		engine.attackers = move.previous.attackers;
		engine.defenders = move.previous.defenders;
	}

    // used to determine checks and attacks
  function is_square_threatened(engine, square) {
		return engine.threats.includes(square);
	}
	function is_square_attacked(engine, square) {
		return engine.attacks.includes(square);
	}

    // converting map layout (single array) to board layout (2D array)
	function squareFromXY(x, y) {
		return (7 - y) * 8 + x;
	}
	function xyFromSquare(square) {
		let x = square % 8;
		let y = 7 - Math.floor((square - x) / 8);
		return [x, y];
	}


      /******** AI Functionality ********
        *		the above functions and constant variables are only for
        *   support and are not crucial to understanding the complexity
        *   of the AI engine -- which is entirely contained below
        */


		// figures out if board is in opening, middle game or endgame
	function determine_board_state(engine) {
		if (engine.status.fullmoves < 8) {
			return 0;
		}

		let pieces_amount = 0, pawn_amount = 0, queens_amount = 0;

		let pieces = engine.active_pieces.concat(engine.inactive_pieces);

		for (let i=0;i<pieces.length;i++) {
			let piece = Pieces.dereference(engine.map[pieces[i]] % 16);

			if (piece == 'P') {
				pawn_amount++;
			}
			if (piece == 'Q') {
				queens_amount++;
			}
			else {
				pieces_amount++;
			}
		}

		if (pieces_amount < 4 && queens_amount < 2) {
			return 2;
		}

		if (pawn_amount < 6 && pieces_amount < 6 && queens_amount == 0) {
			return 2;
		}

		return 1;
	}



		//// depending on the state of the board
		// weight piece value by their location
	function heat_map(engine, piece, location) {

		if (piece >= 16) {
			piece -= 16;
			location = 63 - location;
		}

		return DYNAMIC[
			engine.board_state
		][
			Pieces.dereference(piece % 16)
		][
			location
		];
	}



    //// we want to achieve faster move pruning, so we want to look at
    // potentially better moves first, and worse moves after
    // so we will keep track of estimated move values and place them
    // in the list_of_moves list in order from Best to Worse
	function predict_move(engine, piece_value, source, dest) {
		let guess = heat_map(engine, engine.map[source], dest) * 2;

			// a potentially good move is a capture of a high value piece by a low value piece
		if (engine.map[dest] != Pieces.empty) {
			guess = 10 * Pieces.Score(engine.map[dest]) - piece_value;
					// so we weight captures by 10 so Queens taking
					// pawns is looked at against the capturing piece
		}

			// if the move source is threated by the enemy, weight the move higher
		if (is_square_threatened(engine, dest)) {
			guess += piece_value;
		}

			// if the move dest is threated by the enemy, weight the move a little less
		if (is_square_threatened(engine, dest)) {
			guess -= piece_value;
		}

		return guess;
	}



		// returns a list of all possible legal moves
	function list_of_legal_moves(engine) {
		let list_of_moves = [];

		let source, dest, value;

		for (let p=0;p<engine.active_pieces.length;p++) {
			source = engine.active_pieces[p];
			value = Pieces.Score(engine.map[source]);

			let moves = Pieces.All_Possible_Moves(
				engine,
				source,
			);

			for (let m=0;m<moves.length;m++) {
				dest = moves[m];

				if (engine.map[dest] != Pieces.empty)
				if (Pieces.isWhite(engine.map[dest]) == engine.status.whiteActive)
					continue;

				list_of_moves.push({
					source: source,
					dest: dest,
					guess: predict_move(engine, value, source, dest),
				});
			}
		}

			// to make this more efficent, we want to search by BEST guesses to WORST
		list_of_moves.sort((a, b) => b.guess - a.guess);

		return list_of_moves;
	}
		// returns a list of all potential pesudo moves
	function list_of_pesudo_moves(engine) {
		let list_of_moves = [];

			// in check,  almost no pusdo legal moves are legal -- worthless to check
		if (is_square_threatened(
			engine,
			engine.status.activeKing,
		)) return list_of_legal_moves(engine);

		let source, dest, value;

		for (let p=0;p<engine.active_pieces.length;p++) {
			source = engine.active_pieces[p];
			value = Pieces.Score(engine.map[source]);

			let moves = engine.attackers[
				engine.map[source]
			];

			for (let m=0;m<moves.length;m++) {
				dest = moves[m];

				if (engine.map[dest] != Pieces.empty)
				if (Pieces.isWhite(engine.map[dest]) == engine.status.whiteActive)
					continue;

				list_of_moves.push({
					source: source,
					dest: dest,
					guess: predict_move(engine, value, source, dest),
				});
			}
		}

			// to make this more efficent, we want to search by BEST guesses to WORST
		list_of_moves.sort((a, b) => b.guess - a.guess);

		return list_of_moves;
	}
		// returns a list of all legal captures from the current active side
	function list_of_legal_attacks(engine) {
		let list_of_moves = [];

		let source, dest, value;

		for (let p=0;p<engine.active_pieces.length;p++) {
			source = engine.active_pieces[p];
			value = Pieces.Score(engine.map[source]);

			let moves = engine.attackers[
				engine.map[source]
			];

			for (let m=0;m<moves.length;m++) {
				dest = moves[m];

				if (engine.map[dest] == Pieces.empty) continue;

				if (Pieces.isWhite(engine.map[dest]) == engine.status.whiteActive)
					continue;

				list_of_moves.push({
					source: source,
					dest: dest,
					guess: predict_move(engine, value, source, dest),
				});
			}
		}

			// to make this more efficent, we want to search by BEST guesses to WORST
		list_of_moves.sort((a, b) => b.guess - a.guess);

		return list_of_moves;
	}



		//// standard eval that uses heat mapping and other simple
		// tests to get an accurate value of the current board state
	function evaluate(engine) {
		let score = 0;

		let twoBishops = [null, null];

		let pieces = engine.active_pieces.concat(engine.inactive_pieces);

			// look at material advantages
		for (let i=0;i<pieces.length;i++) {
			let location = pieces[i];

			let direction = 1, color = 0;
			if (	// positive for active player
				engine.map[location] < 16 != engine.status.whiteActive
			) {
				direction = -1;
				color = 1;
			}

			score += heat_map(engine, engine.map[location], location) * direction;
			score += Pieces.Score(Math.floor(engine.map[location])) * direction;

			if (Pieces.dereference(engine.map[location] % 16) == 'B') {
				if (twoBishops[color] == null)
					twoBishops[color] = location;
				else if (
					square_color(twoBishops[color]) !=
					square_color(location)
				) {	// if second bishop is on a different color
					score += (engine.board_state == 2 ? 2 : .75) * direction;
				}
			}
		}

			// we want to try and checkmate the king by minimizing their moves
		if (engine.board_state == 2 && Math.abs(score) > 2.5) {	// dynamic endgame
			let activeKing = engine.status.whiteActive ? engine.status.blackKing : engine.status.whiteKing;
			let inactiveKing = engine.status.whiteActive ? engine.status.whiteKing : engine.status.blackKing;

			let mating_play = 1;

				// if you have a material advatage in the endgame,
				// benifit using king to restrict other kings movement
				// be aggressive and go for mate

			if (score < 0) {
				mating_play = -1;
			}

			let activeXY = xyFromSquare(activeKing);
			let inactiveXY = xyFromSquare(inactiveKing);

			let distance = Math.min(Math.abs(activeXY[0] - inactiveXY[0] - 1),
										Math.abs(activeXY[1] - inactiveXY[1] - 1));

					// king pressure is how much many more legal moves the active king has
					// over the inactive king, leading to evaluation preferring aggresive
					// king moves in a non-drawn endgame
			let kingPressure = engine.attackers[
										engine.map[activeKing]
									].length -
									engine.defenders[
										engine.map[inactiveKing]
									].length;


				// ignore heatmap pentality for aggressive player
			score -= heat_map(engine, engine.map[activeKing], activeKing) * mating_play;
			score += (8 - distance) / 3 * mating_play;
			score += kingPressure / 2;
		}
		// else if (engine.board_state == 2) {	// drawish endgame
    //
		// 		// here will want to check pawns and their files
		// 		// against their opposing king's location
		// }

		if (Math.abs(engine.attacks.length - engine.threats.length) > 8) {
			score += (engine.attacks.length - engine.threats.length) / 8;
		}

		return score;
	}



		//// we want to nullify the horizion effect ->
		// so we will run through the list of all possible
		// attacks and return the result on how potentially bad
		// it could be to determine more closely the positions
		// evaluation after a stablization of an unstable position occures
	function stablize_position(engine, alpha, beta, limit) {

			// using a theoretically proven 'stand pat' approach
			// we can quickly reject a line that completes captures
			// in the wrong order -- leading into a garenteed bad position

		let stand_pat = evaluate(engine);

		if (stand_pat >= beta) {
			return beta;
		}

		alpha = Math.max(alpha, stand_pat);

		if (limit < 0) {
			return alpha;
		}

		let list_of_moves = list_of_legal_attacks(engine);

			// this loops through all the legal moves
		for (let move=0;move<list_of_moves.length;move++) {

			let evaluating_move = new Move_Class(list_of_moves[move]);

				// if we have indexed this evaluation -- refer to it for speed
			let evaluation = Transpositions.access(
				Transpositions.move(
					engine.transposition,
					engine.map[evaluating_move.source],
					evaluating_move,
				),
				0,
			);

				// we want to find the value after the opponent makes the best responses
			if (evaluation == null) {

				make_move(
					engine,
					evaluating_move,
				);

					// evaluate the new position
				evaluation = -stablize_position(
					engine,
					-beta,
					-alpha,
					limit - 1,
				);

				Transpositions.input(engine.transposition, 0, evaluation);

				undo_move(
					engine,
					evaluating_move,
				);
			}

			if (evaluation >= beta) {
				return beta;
			}

			alpha = Math.max(evaluation, alpha);
		}

		return alpha;
	}



		//// using the Multi-Cut pruning method, we can quickly prune moves that
		// are flagged by the Transposition table even though it doesn't quite meet
		// the depth requirements -- due to the assumption that the position won't
		// varry that much in this search (best moves searched first)
		//	* M is the number of moves to look at when checking for mc-prune.
		//	* C is the number of cutoffs to cause an mc-prune, C < M.
	function predictive_pruning(engine, beta, depth, cut) {
		if (depth < 0) return stablize_position(engine, beta-1, beta, search_depth);

		const M = 6, C = 3;

		let list_of_moves = list_of_pesudo_moves(engine);

		if (cut) {
			let c = 0;

			for (let m=0;m<M && m<list_of_moves.length;m++) {

				let move = new Move_Class(list_of_moves[m]);

				make_move(
					engine,
					move,
				);

				let score = -predictive_pruning(
					engine,
					1 - beta,
					depth - 1,
					!cut,
				);

				undo_move(
					engine,
					move,
				);

				if (score >= beta) {
					if (++c == C) {
						return beta; // multi-cut prune
					}
				}
			}
		}

		for (let m=0;m<list_of_moves.length;m++) {

			let move = new Move_Class(list_of_moves[m]);

			make_move(
				engine,
				move,
			);

			let score = -predictive_pruning(
        engine,
				1 - beta,
				depth - 1,
				!cut,
			);

			undo_move(
				engine,
				move,
			);

			if (score >= beta) {
				return beta;	// regular prune
			}
		}

		return beta - 1;
	}



		// main recursive function for finding the score from the best move
	function find_score_after_best_response(engine, alpha, beta, iteration) {

		if (kill_operation) {
			return null;
		}


			/******** Evaluation Process ********
				*		The below IF statement is used to determine if the
				*		set depth limit has been reached, and if so we will
				*		evaluate and return the current position
				*		---------------------------------------------------
				*		future operations will compare final Evaluations
				*		and continue looking down promising continuations,
				*		while disregarding bad lines by using alpha-beta pruning
				*/

		if (iteration < 0) {

			numOfLines++;

			let evaluation = stablize_position(engine, alpha, beta, search_depth);

			if (	// all numbers far above above the lateral cull--get culled
				evaluation >= beta
			) {
				return beta;
			}

			return evaluation;
		}



			/******** Branching Process ********
				*		In this area of the function, we have not reached depth limit
				*		So the code will continue to create branches for future evals
				*/


			// generate the list of all possible moves
		let list_of_moves = list_of_legal_moves(engine);

		if (list_of_moves.length == 0) {
			if (is_square_threatened(
  			engine,
  			engine.status.activeKing,
  		)) {
				return -INFINITY;	// a loss is bad and we should avoid it
			}
			return 0;	// a draw is netural
		}


			/******** ALPHA - BETA Pruning -> Min - Maxing ********
				*	we want to make the best moves WHILE assuming the opponate will
				*	also make the best responses. we don't want to follow a move series
				*	that leaves open a weakness
				*/

			// this loops through all the legal moves
		for (let move=0;move<list_of_moves.length;move++) {

			let evaluating_move = new Move_Class(list_of_moves[move]);

				// if we have indexed this evaluation -- refer to it for speed
			let evaluation = Transpositions.access(
				Transpositions.move(
					engine.transposition,
					engine.map[evaluating_move.source],
					evaluating_move,
				),
				iteration,
				true,	// search for multi-cut
			);

				// Transposition table has flagged this move for predictive pruning
			if (
        evaluation != null &&
        evaluation.multi_cut
      ) {
				if (evaluation.eval >= beta) {

					evaluation = -predictive_pruning(
						engine,
						-alpha,
						iteration,
						false,
					);

						// here we identify that there was no Multi-Cut pruning
						// and there might be an inaccurate evaluation due to
						// predictive_pruning being a short-scope scout search
					if (evaluation > alpha) {	// we set up to do a full re-search
						evaluation = null;
					}

						// otherwise -> the value is less than alpha, and can be
						// disregarded and we can move onto the next search stem
				}
				else {
					evaluation = null;
				}
			}

				// we want to find the value after the opponent makes the best responses
			if (evaluation == null) {

				make_move(
					engine,
					evaluating_move,
				);

					//// evaluate the new position
          // we negate the value because the board's active
          // player (and score) switches when a move is made
				evaluation = -find_score_after_best_response(
					engine,
					-beta,
					-alpha,
          iteration - 1,
				);

					// exit on command or failstate
				if (evaluation == null) return null;

				Transpositions.input(engine.transposition, iteration, evaluation);

				undo_move(
					engine,
					evaluating_move,
				);
			}

			if (
				evaluation >= beta
			) {
				return beta;
			}

			alpha = Math.max(evaluation, alpha);

        //// adding move to the list of preferred lines
        // at the end of the operation, this will be sorted
        // from best score to worst, giving the final eval
        // as the best possible score, and the AI will choose
        // a from the moves in this list
      if (iteration == search_depth) {
        new_preferred_lines.push({
          move: {
            source: evaluating_move.source,
            dest: evaluating_move.dest,
          },
          eval: evaluation,
        });
      }

		}

		return alpha;
	}



      /******** Iterative Deepening ********
        *		we break up searching into segments search_depth length long,
    		*   then recursively deepen to increase the search accuracy,
    		*   with the depth wall being the maximum depth limit
        */


	let search_depth = 2;
	let depth_wall = 4;
	let numOfLines;	// only used to show performance data, no functional use
	let killer_moves = [];

	let kill_operation = false;
	self.Force_Stop = function() {
		kill_operation = true;
	};

	function recur_search(engine, alpha, beta) {

		setTimeout(function() {

			let evaluation = find_score_after_best_response(
				engine,
				alpha,
				beta,
        search_depth,
			);

				// exit on command or failstate
			if (evaluation == null) return;

        // sort moves by best to worst
      preferred_lines = new_preferred_lines.sort((a, b) => b.eval - a.eval);
      new_preferred_lines = [];

        // update overall eval information
      Transpositions.input(board_index, search_depth + 1, preferred_lines[0].eval);

        // report findings to main thread
      message({
        type: 0,  // report eval
        data: preferred_lines[0].eval * (board_state.status.whiteActive ? 1 : -1),
      });
      message({
        type: 210,
        data: search_depth + 1,
      });
      message({
        type: 211,
        data: preferred_lines,
      });
      message({
        type: 1,
        data: {
          numOfLines: numOfLines,
          depth: search_depth + 1,
          time: new Date - start_time,
        },
      });

			deepen_search();

		}, DELAY);
	}



      /******** AI Functionality ********
        *		the main meat of the evaluation process
    		*   each iteration uses a hashed state of the board
    		*   to quickly resume calculation without becoming a memory hog
    		*   and keep track of each depth values best moves with preferred_lines
    		*   (sorted each time by alpha (evaluation) best to worst)
        */


	let board_state, board_index;
	let preferred_lines, new_preferred_lines;
	let start_time;

    //// using iterative deepening, we can search deeper
    // until the depth limit is reached, or a move is made
	function deepen_search() {

    // stop search, we hit the depth wall
    if (search_depth >= depth_wall) return;

    let next_alpha = -INFINITY,
        next_beta = INFINITY;

    search_depth += 2;

		recur_search(
			clone_engine(board_state),
      next_alpha,
      next_beta,
		);
	}
	function start() {
		kill_operation = false;
		numOfLines = 0;
		new_preferred_lines = [];
		start_time = new Date;

    recur_search(
			clone_engine(board_state),
      -INFINITY,
      INFINITY,
		);
	}


	self.Board_State = function() {
		return determine_board_state(board_state);
	};

	self.Heat_Map = function(piece, location) {
		return heat_map(board_state, piece, location);
	};
	self.Evaluate = function() {
		let evaluation = Transpositions.access(
			board_state.transposition,
			0,
		);

		if (evaluation != null) return evaluation;

		evaluation = stablize_position(board_state, -INFINITY, INFINITY, search_depth);

		Transpositions.input(board_state.transposition, 0, evaluation);

		return evaluation;
	};

  if (input_engine == null) return;

  board_state = clone_engine(input_engine);
  board_state.board_state = determine_board_state(board_state);

  message({
    type: 212,
    data: list_of_legal_moves(board_state),
  });
  message({
    type: 213,
    data: board_state.board_state == 0 ? 'Opening' :
          board_state.board_state == 1 ? 'Middle Game' : 'Endgame',
  });

  start();
};

let process;

function message(data) {
  self.postMessage(JSON.stringify(data));
}

self.addEventListener('message', function(event) {
  let input = JSON.parse(event.data);

  let data = input.data,
      type = input.type;

  if (type == 100) {
    if (process != null) {
      process.Force_Stop();
    }

    process = new Evaluation(data);
  }
  else if (type == 400) {
    if (process != null) {
      process.Force_Stop();
    }
  }
});


const Transpositions = new function() {
	let self = this;

		//// this indexes different board states, so if the same state
		// is reached via a different method -- or in the future --
		// we can reanalyze it's evaluation ASAP

	let randomNumbers;
	const RANDOM = 922337203;
	const whiteToMove = 736;
	const castleRights = 737;
	const enpassant = 741;
	const maxNumbers = 749;
	const pieces = 'KkQqRrBbNnPp';

	function init() {
		randomNumbers = new Array(maxNumbers);

		for (let i=0;i<maxNumbers;i++) {
			let repeat, new_random;

			do {
				repeat = false;
				new_random = Math.floor(Math.random() * RANDOM);

				for (let j=0;j<i;j++) {
					if (new_random == randomNumbers[j]) {
						repeat = true;
						break;
					}
				}
			} while (repeat);

			randomNumbers[i] = new_random;
		}
	}

	let states = new Array(),
			depths = new Array();

	function stateToIndex(state) {
		let running = 0;

		if (state.status.whiteActive) {
			running ^= randomNumbers[whiteToMove];
		}

		if (state.status.whiteKingsideCastle) {
			running ^= randomNumbers[castleRights];
		}
		if (state.status.whiteQueensideCastle) {
			running ^= randomNumbers[castleRights + 1];
		}
		if (state.status.blackKingsideCastle) {
			running ^= randomNumbers[castleRights + 2];
		}
		if (state.status.blackQueensideCastle) {
			running ^= randomNumbers[castleRights + 3];
		}

		if (state.status.enpassant != null) {
			running ^= randomNumbers[
				enpassant + 'abcdefgh'.indexOf(state.status.enpassant[0])
			];
		}

		for (let i=0;i<64;i++) {
			let piece = state.map[i];

			if (piece == Pieces.empty) continue;

			piece = Pieces.dereference(piece);

			let index = pieces.indexOf(piece);

			if (index >= 10) {
				running ^= randomNumbers[index * 64 + i - 8];
				continue;
			}

			running ^= randomNumbers[index * 64 + i];
		}

		return running;
	}

	self.access = function(state, depth, multi_cut) {
		if (depths[state] >= depth) {
			return states[state];
		}

		if (!multi_cut || states[state] == null) return null;

		return {
			multi_cut: true,
			eval: states[state],
		};
	};
	self.input = function(state, depth, value) {
		if (depths[state] == null || depths[state] <= depth) {
			states[state] = value;
			depths[state] = depth;
		}
	};
	self.state = function(state) {
		return stateToIndex(state);
	};

	self.move = function(state, piece, move) {
		piece = pieces.indexOf(Pieces.dereference(piece));

		let index = piece * 64 + move.source;
		if (piece >= 10) index -= 8;
		state ^= randomNumbers[index];

		index = piece * 64 + move.dest;
		if (piece >= 10) index -= 8;
		state ^= randomNumbers[index];

		state ^= randomNumbers[whiteToMove];

		return state;
	};
	self.transform = function(state, piece, location) {
		piece = pieces.indexOf(Pieces.dereference(piece));

		let index = piece * 64 + location;
		if (piece >= 10) index -= 8;
		state ^= randomNumbers[index];

		return state;
	};

	self.castle = function(state, status) {
		if (status.whiteKingsideCastle) {
			return state ^= randomNumbers[castleRights];
		}
		if (status.whiteQueensideCastle) {
			return state ^= randomNumbers[castleRights + 1];
		}
		if (status.blackKingsideCastle) {
			return state ^= randomNumbers[castleRights + 2];
		}
		if (status.blackQueensideCastle) {
			return state ^= randomNumbers[castleRights + 3];
		}
		return state;
	};
	self.enpassant = function(state, square) {
		return state ^= randomNumbers[
			enpassant + 'abcdefgh'.indexOf(square[0])
		];
	};

	init();
} ();


const Move_Class = function(input) {
	this.source = input.source;
	this.dest = input.dest;
};

const Pieces = new function() {
	const self = this;

	const ROW = 1, FILE = 8, BDIAG = 7, FDIAG = 9,
				KLU = 6, KRU = 10, KUL = 15, KUR = 17;
	const MOVES = {
		Pawn: FILE,
		Knight: [KLU, -KLU, KRU, -KRU, KUL, -KUL, KUR, -KUR],
		Bishop: [FDIAG, -FDIAG, BDIAG, -BDIAG],
		Rook: [ROW, -ROW, FILE, -FILE],
		Queen: [ROW, -ROW, FILE, -FILE, FDIAG, -FDIAG, BDIAG, -BDIAG],
		King: [ROW, -ROW, FILE, -FILE, FDIAG, -FDIAG, BDIAG, -BDIAG],
	};

	function squareFromXY(x, y) {
		return (7 - y) * 8 + x;
	}
	function xyFromSquare(square) {
		let x = square % 8;
		let y = 7 - Math.floor((square - x) / 8);
		return [x, y];
	}

  function is_square_threatened(engine, square) {
		return engine.threats.includes(square);
	}
	function is_square_attacked(engine, square) {
		return engine.attacks.includes(square);
	}

	function checkIfMoveWillBeInCheck(engine, square, dest) {
			// DEV NOTE: true -> in check and therefore invalid move
			//					false -> valid legal move

		if (square == engine.status.activeKing) {
				// adjust sliding piece attack when king moves
			if (engine.checking_pieces.length != 0) {
				let invalid_move = false;
				let temp = engine.map[dest];
				engine.map[dest] = engine.map[square];
				engine.map[square] = Pieces.empty;

				for (let i=0;i<engine.checking_pieces.length;i++) {
					if (dest == engine.checking_pieces[i]) continue;

					let attacks = Pieces.All_Possible_Moves(engine, engine.checking_pieces[i], true);

						// move is still in check
					if (attacks.includes(dest)) {
						invalid_move = true;
						break;
					}
				}

				engine.map[square] = engine.map[dest];
				engine.map[dest] = temp;
				if (invalid_move) return true;
			}
			return engine.threats.includes(dest);
		}
		else if (engine.checking_pieces.length != 0) {
			if (engine.checking_pieces.length > 1) return true;
				// can't stop a double check with a non-king move

			if (dest != engine.checking_pieces[0]) {
					//// if not attacking the checking piece,
					// determine if blocking by use of of pin

					// irelevent captures cannot stop a check
				if (engine.map[dest] != null) return true;

				let attacking_piece =
								_dereference(engine.map[engine.checking_pieces[0]] % 16);

				if (attacking_piece != 'Q' && attacking_piece != 'R' && attacking_piece != 'B') {
					return true;	// no possible blocking moves
				}

				engine.map[dest] = engine.map[square];

					// here we create the list of squares that would block the attack
				let pin_list = Pieces.Pin_List(
					engine,
					engine.checking_pieces[0],
					engine.status.activeKing,
				);

				engine.map[dest] = null;

					// and if the dest is NOT one of them, finally we realize it's not a valid move
				if (pin_list.includes(dest)) {
					return dest == pin_list[pin_list.length - 1];
				}
				else return true;
			}
		}

			// if the piece is pinned and the dest is not also a pinned tile
			// specifically from within the same pin source
		for (let i=0;i<engine.pins.length;i++) {
			if (engine.pins[i].includes(square)) {
				return !engine.pins[i].includes(dest);
			}
		}

			// special check considerations for an enpassant move
			// this is needed because here the piece removed was
			// neither on the source or the dest square
		if (
			engine.enpassant != null &&
			Pieces.dereference(engine.map[square] % 16) == 'P'
		) {
			let file = engine.status.enpassant[0];
			let row = 9 - parseInt(engine.status.enpassant[1]) - 1;

			if (file == 'a') file = 0;
			else if (file == 'b') file = 1;
			else if (file == 'c') file = 2;
			else if (file == 'd') file = 3;
			else if (file == 'e') file = 4;
			else if (file == 'f') file = 5;
			else if (file == 'g') file = 6;
			else if (file == 'h') file = 7;

			if (move.dest == squareFromXY(file, row)) {
				let DIRECTION = engine.status.whiteActive;

				let enpassant_location = move.dest - (8 * (
					engine.status.whiteActive ? -1 : 1
				));

				for (let i=0;i<engine.inactive_pieces.length;i++) {
					let attack_list = engine.attackers[
						engine.map[
							engine.inactive_pieces[i]
						]
					];

					if (
						attack_list.includes(enpassant_location)
					) {
						let placeholder_piece = engine.map[enpassant_location];
						engine.map[enpassant_location] = null;

						attack_list = Pieces.All_Possible_Moves(
							engine,
							engine.inactive_pieces[i],
							true,
						);

						if (attack_list.indexOf(engine.activeKing)) {
							engine.map[enpassant_location] = placeholder_piece;
							return true;
						}

						engine.map[enpassant_location] = placeholder_piece;
					}
				}
			}
		}

		return false;
	}
	function tryToAddToList(engine, list, square, dest, find_attacks) {
		if (!find_attacks)
		if (checkIfMoveWillBeInCheck(engine, square, dest)) return;

		list.push(dest);
	}

	let can_move_king = function(engine, square, dest, find_attacks) {
		let possible_moves = all_possible_king_moves(engine, square, find_attacks);

		for (let i=0;i<possible_moves.length;i++) {
			if (possible_moves[i]==dest) {
				return true;
			}
		}

		return false;
	};
	let can_move_queen = function(engine, square, dest, find_attacks) {
		let possible_moves = all_possible_queen_moves(engine, square, find_attacks);

		for (let i=0;i<possible_moves.length;i++) {
			if (possible_moves[i]==dest) {
				return true;
			}
		}

		return false;
	};
	let can_move_rook = function(engine, square, dest, find_attacks) {
		let possible_moves = all_possible_rook_moves(engine, square, find_attacks);

		for (let i=0;i<possible_moves.length;i++) {
			if (possible_moves[i]==dest) {
				return true;
			}
		}

		return false;
	};
	let can_move_bishop = function(engine, square, dest, find_attacks) {
		let possible_moves = all_possible_bishop_moves(engine, square, find_attacks);

		for (let i=0;i<possible_moves.length;i++) {
			if (possible_moves[i]==dest) {
				return true;
			}
		}

		return false;
	};
	let can_move_knight = function(engine, square, dest, find_attacks) {
		let possible_moves = all_possible_knight_moves(engine, square, find_attacks);

		for (let i=0;i<possible_moves.length;i++) {
			if (possible_moves[i]==dest) {
				return true;
			}
		}

		return false;
	};
	let can_move_pawn = function(engine, square, dest, find_attacks) {
		let possible_moves = all_possible_pawn_moves(engine, square, find_attacks);

		for (let i=0;i<possible_moves.length;i++) {
			if (possible_moves[i]==dest) {
				return true;
			}
		}

		return false;
	};

	let all_possible_king_moves = function(engine, square, find_attacks) {
		let list = [], test_dest;
		let piece_is_white = Pieces.isWhite(engine.map[square]);

		for (let i=0;i<MOVES.King.length;i++) {
			test_dest = MOVES.King[i] + square;

			if (test_dest < 0 || test_dest > 63) continue;
			if (Math.abs((square % 8) - (test_dest % 8)) > 1)
				continue;

			if (engine.map[test_dest] != Pieces.empty) {
				if (find_attacks) {
					tryToAddToList(engine, list, square, test_dest, find_attacks);
					continue;
				}

				if (piece_is_white != Pieces.isWhite(engine.map[test_dest])) {
					tryToAddToList(engine, list, square, test_dest, find_attacks);
				}

				continue;
			}

			tryToAddToList(engine, list, square, test_dest, find_attacks);
		}

		if (piece_is_white) {
			if (engine.status.whiteQueensideCastle) {
				if (
					engine.map[1] == Pieces.empty &&
					engine.map[2] == Pieces.empty &&
					engine.map[3] == Pieces.empty
				) if (
					is_square_attacked(engine, 4) &&
					is_square_attacked(engine, 3) &&
					is_square_attacked(engine, 2)
				) {
					tryToAddToList(engine, list, square, 2, find_attacks);
				}
			}
			if (engine.status.whiteKingsideCastle) {
				if (
					engine.map[5] == Pieces.empty &&
					engine.map[6] == Pieces.empty
				) if (
					is_square_attacked(engine, 4) &&
					is_square_attacked(engine, 5) &&
					is_square_attacked(engine, 6)
				) {
					tryToAddToList(engine, list, square, 6, find_attacks);
				}
			}
		}
		else {
			if (engine.status.blackQueensideCastle) {
				if (
					engine.map[57] == Pieces.empty &&
					engine.map[58] == Pieces.empty &&
					engine.map[59] == Pieces.empty
				) if (
					is_square_attacked(engine, 60) &&
					is_square_attacked(engine, 59) &&
					is_square_attacked(engine, 58)
				) {
					tryToAddToList(engine, list, square, 58, find_attacks);
				}
			}
			if (engine.status.blackKingsideCastle) {
				if (
					engine.map[61] == Pieces.empty &&
					engine.map[62] == Pieces.empty
				) if (
					is_square_attacked(engine, 60) &&
					is_square_attacked(engine, 61) &&
					is_square_attacked(engine, 62)
				) {
					tryToAddToList(engine, list, square, 62, find_attacks);
				}
			}
		}

		return list;
	};
	let all_possible_queen_moves = function(engine, square, find_attacks) {
		let list = [], test_dest, lastCheckedSquare;
		let piece_is_white = Pieces.isWhite(engine.map[square]);

		for (let i=0;i<MOVES.Queen.length;i++) {
			lastCheckedSquare = square;

			for (let j=1;j<8;j++) {
				test_dest = j * MOVES.Queen[i] + square;

				if (test_dest < 0 || test_dest > 63) break;
				if (Math.abs((lastCheckedSquare % 8) - (test_dest % 8)) > 1)
					break;

				lastCheckedSquare = test_dest;

				if (engine.map[test_dest] != Pieces.empty) {
					if (find_attacks) {
						tryToAddToList(engine, list, square, test_dest, find_attacks);
						break;
					}

					if (piece_is_white != Pieces.isWhite(engine.map[test_dest])) {
							tryToAddToList(engine, list, square, test_dest, find_attacks);
					}

					break;
				}

				tryToAddToList(engine, list, square, test_dest, find_attacks);
			}
		}

		return list;
	};
	let all_possible_rook_moves = function(engine, square, find_attacks) {
		let list = [], test_dest, lastCheckedSquare;
		let piece_is_white = Pieces.isWhite(engine.map[square]);

		for (let i=0;i<MOVES.Rook.length;i++) {
			lastCheckedSquare = square;

			for (let j=1;j<8;j++) {
				test_dest = j * MOVES.Rook[i] + square;

				if (test_dest < 0 || test_dest > 63) break;
				if (Math.abs((lastCheckedSquare % 8) - (test_dest % 8)) > 1)
					break;

				lastCheckedSquare = test_dest;

				if (engine.map[test_dest] != Pieces.empty) {
					if (find_attacks) {
						tryToAddToList(engine, list, square, test_dest, find_attacks);
						break;
					}

					if (piece_is_white != Pieces.isWhite(engine.map[test_dest])) {
						tryToAddToList(engine, list, square, test_dest, find_attacks);
					}

					break;
				}

				tryToAddToList(engine, list, square, test_dest, find_attacks);
			}
		}

		return list;
	};
	let all_possible_bishop_moves = function(engine, square, find_attacks) {
		let list = [], test_destm, lastCheckedSquare;
		let piece_is_white = Pieces.isWhite(engine.map[square]);

		for (let i=0;i<MOVES.Bishop.length;i++) {
			lastCheckedSquare = square;

			for (let j=1;j<8;j++) {
				let test_dest = j * MOVES.Bishop[i] + square;

				if (test_dest < 0 || test_dest > 63) break;
				if (Math.abs((lastCheckedSquare % 8) - (test_dest % 8)) > 1)
					break;

				lastCheckedSquare = test_dest;

				if (engine.map[test_dest] != Pieces.empty) {
					if (find_attacks) {
						tryToAddToList(engine, list, square, test_dest, find_attacks);
						break;
					}

					if (piece_is_white != Pieces.isWhite(engine.map[test_dest])) {
						tryToAddToList(engine, list, square, test_dest, find_attacks);
					}

					break;
				}

				tryToAddToList(engine, list, square, test_dest, find_attacks);
			}
		}

		return list;
	};
	let all_possible_knight_moves = function(engine, square, find_attacks) {
		let list = [], test_dest;
		let piece_is_white = Pieces.isWhite(engine.map[square]);

		for (let i=0;i<MOVES.Knight.length;i++) {
			test_dest = MOVES.Knight[i] + square;

			if (test_dest < 0 || test_dest > 63) continue;
			if (Math.abs((square % 8) - (test_dest % 8)) > 2)
				continue;

			if (engine.map[test_dest] != Pieces.empty) {
				if (find_attacks) {
					tryToAddToList(engine, list, square, test_dest, find_attacks);
					continue;
				}

				if (piece_is_white != Pieces.isWhite(engine.map[test_dest])) {
					tryToAddToList(engine, list, square, test_dest, find_attacks);
				}

				continue;
			}

			tryToAddToList(engine, list, square, test_dest, find_attacks);
		}

		return list;
	};
	let all_possible_pawn_moves = function(engine, square, find_attacks) {
		let list = [], test_dest;
		let piece_is_white = Pieces.isWhite(engine.map[square]);
		let direction = piece_is_white ? 1 : -1;

				// pawns can't attack forward, only move forward
		if (!find_attacks) {
			test_dest = direction * MOVES.Pawn + square;

			if (
				!(test_dest < 0 || test_dest > 63) &&
				engine.map[test_dest] == Pieces.empty
			) {
				tryToAddToList(engine, list, square, test_dest, find_attacks);
			}

			// double move on first move
			let test_y = Math.floor(square / 8);
			if (test_y == 1 || test_y == 6) {
				test_dest = direction * MOVES.Pawn * 2 + square;
				if (
					engine.map[direction * MOVES.Pawn + square] == Pieces.empty &&
					engine.map[test_dest] == Pieces.empty
				) {
					tryToAddToList(engine, list, square, test_dest, find_attacks);
				}
			}
		}

			// pawn captures
		test_dest = direction * FDIAG + square;
		if (
			Math.abs((square % 8) - (test_dest % 8)) == 1 && (
				find_attacks || (
					engine.map[test_dest] != Pieces.empty &&
					piece_is_white != Pieces.isWhite(engine.map[test_dest])
				)
			)
		) {
			tryToAddToList(engine, list, square, test_dest, find_attacks);
		}

		test_dest = direction * BDIAG + square;
		if (
			Math.abs((square % 8) - (test_dest % 8)) == 1 && (
				find_attacks || (
					engine.map[test_dest] != Pieces.empty &&
					piece_is_white != Pieces.isWhite(engine.map[test_dest])
				)
			)
		) {
			tryToAddToList(engine, list, square, test_dest, find_attacks);
		}

			// possible en passant ?
		if (engine.status.enpassant != null) {
			let file = engine.status.enpassant[0];
			let row = parseInt(engine.status.enpassant[1]) - 1;

			if (row == 2 && piece_is_white) return list;
			if (row == 5 && !piece_is_white) return list;

			if (file == 'a') file = 0;
			else if (file == 'b') file = 1;
			else if (file == 'c') file = 2;
			else if (file == 'd') file = 3;
			else if (file == 'e') file = 4;
			else if (file == 'f') file = 5;
			else if (file == 'g') file = 6;
			else if (file == 'h') file = 7;
			else return list;

			if (Math.abs(square % 8 - file) == 1) {
				if (Math.floor(square / 8) == row - direction * 1) {
					tryToAddToList(engine, list, square, squareFromXY(file, 7 - row), find_attacks);
				}
			}
		}

		return list;
	};

	self.Can_Move = function(engine, move, find_attacks) {
		let type = _dereference(engine.map[move.source]);

		if (type == 'K' || type == 'k') {
			if (can_move_king(engine, move.source, move.dest, find_attacks))
				return true;
		}

		else if (type == 'Q' || type == 'q') {
			if (can_move_queen(engine, move.source, move.dest, find_attacks))
				return true;
		}

		else if (type == 'R' || type == 'r') {
			if (can_move_rook(engine, move.source, move.dest, find_attacks))
				return true;
		}

		else if (type == 'B' || type == 'b') {
			if (can_move_bishop(engine, move.source, move.dest, find_attacks))
				return true;
		}

		else if (type == 'N' || type == 'n') {
			if (can_move_knight(engine, move.source, move.dest, find_attacks))
				return true;
		}

		else if (type == 'P' || type == 'p') {
			if (can_move_pawn(engine, move.source, move.dest, find_attacks))
				return true;
		}

		return false;
	};
	self.All_Possible_Moves = function(engine, square, find_attacks) {
		let type = _dereference(engine.map[square] % 16);

		if (type == Pieces.empty) return [];

		if (type == 'K')
			return all_possible_king_moves(engine, square, find_attacks).slice();

		if (type == 'Q')
			return all_possible_queen_moves(engine, square, find_attacks).slice();

		if (type == 'R')
			return all_possible_rook_moves(engine, square, find_attacks).slice();

		if (type == 'B')
			return all_possible_bishop_moves(engine, square, find_attacks).slice();

		if (type == 'N')
			return all_possible_knight_moves(engine, square, find_attacks).slice();

		if (type == 'P')
			return all_possible_pawn_moves(engine, square, find_attacks).slice();

		return [];
	};
	self.Pin_List = function(engine, source, pin) {
		let difference = Math.abs(source - pin);
		let direction = source < pin ? 1 : -1;
		let list = [], lastCheckedSquare, pinned_piece_found_yet = false;

		if (Math.floor(source / 8) == Math.floor(pin / 8)) {
			list.push(source);

			let test_dest = source + (ROW * direction);

			while (true) {
				list.push(test_dest);

				if (engine.map[test_dest] != Pieces.empty) {
					if (pinned_piece_found_yet) {
						break;
					}

					pinned_piece_found_yet = true;
				}

				lastCheckedSquare = test_dest;
				test_dest += ROW * direction;

				if (
					pinned_piece_found_yet &&
					(
						test_dest < 0 || test_dest > 63 ||
						Math.abs((lastCheckedSquare % 8) - (test_dest % 8)) > 1
					)
				) {
					return [];
				}
			}
		}
		else if (difference % FILE == 0) {
			list.push(source);

			let test_dest = source + (FILE * direction);

			while (true) {
				list.push(test_dest);

				if (engine.map[test_dest] != Pieces.empty) {
					if (pinned_piece_found_yet) {
						break;
					}

					pinned_piece_found_yet = true;
				}

				lastCheckedSquare = test_dest;
				test_dest += FILE * direction;

				if (
					pinned_piece_found_yet &&
					(
						test_dest < 0 || test_dest > 63 ||
						Math.abs((lastCheckedSquare % 8) - (test_dest % 8)) > 1
					)
				) {
					return [];
				}
			}
		}
		else if (difference % BDIAG == 0) {
			list.push(source);

			let test_dest = source + (BDIAG * direction);

			while (true) {
				list.push(test_dest);

				if (engine.map[test_dest] != Pieces.empty) {
					if (pinned_piece_found_yet) {
						break;
					}

					pinned_piece_found_yet = true;
				}

				lastCheckedSquare = test_dest;
				test_dest += BDIAG * direction;

				if (
					pinned_piece_found_yet &&
					(
						test_dest < 0 || test_dest > 63 ||
						Math.abs((lastCheckedSquare % 8) - (test_dest % 8)) > 1
					)
				) {
					return [];
				}
			}
		}
		else if (difference % FDIAG == 0) {
			list.push(source);

			let test_dest = source + (FDIAG * direction);

			while (true) {
				list.push(test_dest);

				if (engine.map[test_dest] != Pieces.empty) {
					if (pinned_piece_found_yet) {
						break;
					}

					pinned_piece_found_yet = true;
				}

				lastCheckedSquare = test_dest;
				test_dest += FDIAG * direction;

				if (
					pinned_piece_found_yet &&
					(
						test_dest < 0 || test_dest > 63 ||
						Math.abs((lastCheckedSquare % 8) - (test_dest % 8)) > 1
					)
				) {
					return [];
				}
			}
		}

		return list;
	};

	self.Score = function(type) {
		if (type % 16 == 0) return 999;									// King
		if (type % 16 == 1) return 9;										// Queen
		if (type % 16 == 2 || type % 16 == 3) return 5;	// Rook
		if (type % 16 == 4 || type % 16 == 5) return 3;	// Bishop
		if (type % 16 == 6 || type % 16 == 7) return 3;	// Knight
		return 1;																				// Pawn
	};
	self.isWhite = function(index) {
		if (index == Pieces.empty) return null;

		return index % 32 < 16;
	};

	self.empty = null;
	self.whiteKing = 'K';
	self.whiteQueen = 'Q';
	self.whiteRook = 'R';
	self.whiteBishop = 'B';
	self.whiteKnight = 'N';
	self.whitePawn = 'P';
	self.blackKing = 'k';
	self.blackQueen = 'q';
	self.blackRook = 'r';
	self.blackBishop = 'b';
	self.blackKnight = 'n';
	self.blackPawn = 'p';

	const _reference_array = 'KQRRBBNNPPPPPPPPkqrrbbnnpppppppp';
	const _dereference = function(id) {
		if (id >= 32 || id < 0) return Pieces.empty;

		return _reference_array[Math.floor(id)];
	};
	self.dereference = _dereference;
} ();
