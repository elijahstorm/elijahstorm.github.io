/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in Elijah Storm's Portfolio Project

	/**
		*	Feel free to look through self code to see how I
		*	approach solutions :)
		*
		* Please visit this page to view the heavily documented
		* AI engine, using MinMax and Alpha-Beta processing
		* https://elijahstorm.herokuapp.com/ai/chess/evaluation.js
	 	*/

	/**
		*	In order to maximize effeciency and performace ->
		* We will constantly be running the engine Evaluation
		* in a seprate worker thread, and from the results of
		* the best moves, the AI will just choose the best moves
		* -------------------------------------------------
		* easier AIs will often make mistakes on purpose
		* by choosing a move that is a certain distance below
		* the current evaluation
	 	*/

'use strict';

const AI_Actor = new function() {
	let self = this;

			/** Initialize AI supporting data
			*			The AI needs to have some levels to stop
			*			calculation of the best move at a certain
			*			point -- so we'll use this to our advantage
			*			and create 'level' systems by adjusting the
			*			limits of thinking Time and Depth
			*/

	let MaxTime = {}, IdealDepth = {}, BlunderChance = {};
	let AiTYPE;
	self.Move_Delay = 500;

	function _codeAiKnobs(type, time, moves, blunder) {
		MaxTime[type] = time;
		IdealDepth[type] = moves;
		BlunderChance[type] = blunder;
	}

		// _codeAiKnobs arguments:
		// Name, Max time in Seconds, Max fullmove depth, Blunder chance
	_codeAiKnobs('easyAi', 2, 4, .3);
	_codeAiKnobs('normalAi', 4, 6, .2);
	_codeAiKnobs('hardAi', 7, 8, .1);
	_codeAiKnobs('impossibleAi', 100, 12, 0);

	AiTYPE = 'normalAi';		// set the default AI type -- can be changed


		// a quick check to see if operation is ready to be finished
	function shouldEndCalculation(time) {

		if (Evaluation.depth >= IdealDepth[AiTYPE]) {
			return true;
		}

		if (new Date - time >= MaxTime[AiTYPE] * 1000) {
			return true;
		}

		return false;
	}


			// finds and makes the best move based on Evals
	function findBestMove(engine, executionStartTime) {

			// generate the list of all possible moves

		let preferred_lines = Evaluation.lines;

		if (
			preferred_lines == null ||
			preferred_lines.length == 0
		) {
			return null;
		}

			// this list is already sorted from Best to Worst (potentially) here
			// 0 being the best

		let move_choice = 0;

			// if the AI blunders, then choose a random move not determined to be the best

		if (Math.random() < BlunderChance[AiTYPE]) {
			// TODO: remove on finish project
			// move_choice = Math.floor(Math.random() * preferred_lines.length);
		}

		return preferred_lines[move_choice].move;
	}

			// purely for testing -- this finds all moves and returns one at random
	function makeRandomMove(engine) {
		let list_of_moves = Evaluation.moves;

		if (
				list_of_moves == null ||
				list_of_moves.length == 0
		) {
			return null;
		}

		let move_limit = Math.min(list_of_moves.length, 3);
		let decision = list_of_moves[Math.floor(Math.random() * move_limit)];

		Report.decision(Style.Beautify_Move(
			null,
			{
				piece: engine.map[decision.source],
				dest: decision.dest,
			},
			`<br />Fellback to a random move on Error`,
		));

		return new Move_Class({
			source: decision.source,
			dest: decision.dest,
		});
	}

			// the first five moves will follow the opening book saved on file
	function findBookOpening(engine) {
		const ROW = 1, FILE = 8, BDIAG = 7, FDIAG = 9,
					KLU = 6, KRU = 10, KUL = 15, KUR = 17;
		const WHITE_KING = 4, BLACK_KING= 60;

		let png = Engine.PNG(engine).replace(/[0-9]. /g, '');

		let list = Openings.access(png);

		if (list == null || list.length == 0) {
			return null;
		}

		let png_reverse = png.split('').reverse().join('') + ' ';

		let last_move = png_reverse.substring(0, png_reverse.indexOf(' '))
											.split('').reverse().join('');

		let random_choice = list[Math.floor(Math.random() * list.length)];

		let move_in_png_index = random_choice.indexOf(last_move) + last_move.length + 1;

		let end_move = random_choice.indexOf(' ', move_in_png_index + 1);
		if (end_move == -1) {
			end_move = undefined;
		}

		let move = random_choice.slice(
			move_in_png_index,
			end_move,
		).split('').reverse().join('');

		if (move[0] == '0') {
			let king_location = engine.status.whiteActive ? WHITE_KING : BLACK_KING;
			if (move.length == 3) {	// kingside castle
				return new Move_Class({
					source: king_location,
					dest: king_location + 2,
				});
			}
			return new Move_Class({
				source: king_location,
				dest: king_location - 2,
			});
		}

		let dest = Interface.squareFromXY(
			'abcdefgh'.indexOf(move[1]),
			8 - parseInt(move[0]),
		);
		let source;

		move = move.split('').reverse().join('');

		if (move.length == 2) {	// pawn
			let direction = engine.status.whiteActive ? -1 : 1;

			if (Pieces.dereference(engine.map[dest + 8 * direction] % 16) == 'P') {
				source = dest + 8 * direction;
			}
			else source = dest + 16 * direction;
		}
		else if (move[0] == 'N') {	// knight
			let correct_color = engine.status.whiteActive ? 'N' : 'n';

			if (
				move.length == 3 ||
				(
					move.length == 4 && move[1] == 'x'
				)
			) {	// find the knight that CAN make the move
				let Knight = [
					KLU, KRU, KUL, KUR,
					-KLU, -KRU, -KUL, -KUR,
				];

				for (let i=0;i<Knight.length;i++) {
					let test_dest = dest + Knight[i];
					if (test_dest < 0 || test_dest > 63) continue;
					if (Math.abs((dest % 8) - (test_dest % 8)) > 2) continue;

					if (Pieces.dereference(engine.map[test_dest]) == correct_color) {
						source = test_dest;

						break;
					}
				}
			}
			else {	// multiple knights could fit, so the PGN tells us which to move
				let Knight = [FILE, FILE * 2, -FILE, -FILE * 2];
				source = 'abcdefgh'.indexOf(move[1]);

				for (let i=0;i<Knight.length;i++) {
					let test_dest = dest + Knight[i];
					if (test_dest < 0 || test_dest > 63) continue;

					if (Pieces.dereference(engine.map[test_dest]) == correct_color) {
						source = test_dest;

						break;
					}
				}
			}
		}
		else if (move[0] == 'B') {
			let correct_color = engine.status.whiteActive ? 'B' : 'b';
			let Bishop = [FDIAG, -FDIAG, BDIAG, -BDIAG];

			for (let distance=1;distance<8;distance++) {
				for (let i=0;i<Bishop.length;i++) {
					let test_dest = dest + Bishop[i] * distance;
					if (test_dest < 0 || test_dest > 63) continue;
					if (Math.abs((dest % 8) - (test_dest % 8)) > 2) continue;

					if (Pieces.dereference(engine.map[test_dest]) == correct_color) {
						source = test_dest;

						break;
					}
				}
			}
		}
		else if (move[0] == 'R') {
			let correct_color = engine.status.whiteActive ? 'R' : 'r';
			let Rook = [ROW, -ROW, FILE, -FILE];
			for (let distance=1;distance<8;distance++) {
					for (let i=0;i<Rook.length;i++) {
						let test_dest = dest + Rook[i] * distance;
						if (test_dest < 0 || test_dest > 63) continue;
						if (Math.abs((dest % 8) - (test_dest % 8)) > 2) continue;

						if (Pieces.dereference(engine.map[test_dest]) == correct_color) {
							source = test_dest;

							break;
						}
					}
				}
		}
		else if (move[0] == 'Q') {
			let correct_color = engine.status.whiteActive ? 'Q' : 'q';
			let Queen = [ROW, -ROW, FILE, -FILE, FDIAG, -FDIAG, BDIAG, -BDIAG];
			for (let distance=1;distance<8;distance++) {
				for (let i=0;i<Queen.length;i++) {
					let test_dest = dest + Queen[i] * distance;
					if (test_dest < 0 || test_dest > 63) continue;
					if (Math.abs((dest % 8) - (test_dest % 8)) > 2) continue;

					if (Pieces.dereference(engine.map[test_dest]) == correct_color) {
						source = test_dest;

						break;
					}
				}
			}
		}
		else if (move[0] == 'K') {
			let correct_color = engine.status.whiteActive ? 'K' : 'k';
			let King = [ROW, -ROW, FILE, -FILE, FDIAG, -FDIAG, BDIAG, -BDIAG];
			for (let i=0;i<King.length;i++) {
				let test_dest = dest + King[i];
				if (test_dest < 0 || test_dest > 63) continue;
				if (Math.abs((dest % 8) - (test_dest % 8)) > 2) continue;

				if (Pieces.dereference(engine.map[test_dest]) == correct_color) {
					source = test_dest;

					break;
				}
			}
		}

		if (source == null) {
			return null;
		}

		let _report = document.createElement('div');
		_report.innerHTML = 'Opening book move';
		Report.decision(_report);

		return new Move_Class({
			source: source,
			dest: dest,
		});
	}


	self.Set_AI_Type = function(type) {
		if (MaxTime[type] == null) return;

		AiTYPE = type;
	};
	self.Solve = function(callback) {
		let engine = Engine.Clone(Engine.Current_Engine());

		Evaluation.create(engine);

		let solution, executionStartTime = new Date;

		function exit() {
			if (solution == null) {
				solution = makeRandomMove(Engine.Clone(Engine.Current_Engine()));
			}

			Evaluation.destroy();

			callback(solution);
		}

			// refer too book openings
		solution = findBookOpening(engine);

		if (solution != null) {
			exit();
			return;
		}

		function run_recursive_solve() {
			setTimeout(function() {

				try {
					solution = findBestMove(engine, executionStartTime);

					if (shouldEndCalculation(executionStartTime)) {
						exit();
						return;
					}

					if (solution != null) {
						Report.decision(Style.Beautify_Move(
							null,
							{
								piece: engine.map[solution.source],
								dest: solution.dest,
							},
							`<br />Depth of ${Evaluation.depth}`,
						));
					};

					run_recursive_solve();
				}
				catch (e) {
					console.error('ERROR in AI.Solve');
					console.error(e);

					exit();
				}

			}, AI_Actor.Move_Delay);
		}

		run_recursive_solve();
	};
} ();

const Engine = new function() {
	const self = this;

	let Engine_Class = function(input) {
		this.map = input.map;
		this.status = input.status;

		this.transposition = Transpositions.state(this);
	};

	let move_history = [];
	let current_engine;
	let _gameOver = false;
	let _runAiTest = false;
	let _lastBoard;
	let halt_action_until_ready = false;

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
	function remove_duplicates(array) {
		let seen = {};

		return array.filter(function(item) {
			return seen.hasOwnProperty(item) ? false : (seen[item] = true);
		});
	}
	function commitMoveToEngine(engine, move) {

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
				kingHome = 4;

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
				kingHome = 60;

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

				if (move.dest == Interface.squareFromXY(file, row)) {
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
							attack_list.indexOf(enpassant_location) != -1
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
							attack_list.indexOf(enpassant_location) != -1
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

		let flip_array = engine.inactive_pieces;
		engine.inactive_pieces = engine.active_pieces;
		engine.active_pieces = flip_array;

		flip_array = engine.attackers;
		engine.attackers = engine.defenders;
		engine.defenders = flip_array;

		engine.checking_pieces = [];

		let threats_array = [];
		for (let i=0;i<engine.inactive_pieces.length;i++) {
			let attack_list = engine.defenders[
				engine.map[
					engine.inactive_pieces[i]
				]
			];

			if (
				attack_list.indexOf(move.source) != -1 ||
				attack_list.indexOf(move.dest) != -1
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
				attack_list.indexOf(engine.status.activeKing) != -1
			) {
				engine.checking_pieces.push(engine.inactive_pieces[i]);
			}
		}
		engine.threats = remove_duplicates(threats_array);

		let _in_check = false;
		if (engine.threats.indexOf(engine.activeKing) != -1) {
			_in_check = true;
		}

		threats_array = [];
		for (let i=0;i<engine.active_pieces.length;i++) {
			let attack_list = engine.attackers[
				engine.map[
					engine.active_pieces[i]
				]
			];

			if (
				_in_check ||
				attack_list.indexOf(move.source) != -1 ||
				attack_list.indexOf(move.dest) != -1
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
	function reverseMoveToEngine(engine, move) {

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

	function act(move) {
		if (halt_action_until_ready) return;
		halt_action_until_ready = true;

		move.piece = Pieces.dereference(current_engine.map[move.source] % 16);

		let _needs_ident = false;
		if (move.piece == 'N') {
			let one_knight_already_found = false;

			const KLU = 6, KRU = 10, KUL = 15, KUR = 17;
			let Knight = [
				KLU, KRU, KUL, KUR,
				-KLU, -KRU, -KUL, -KUR,
			];
			let correct_color = current_engine.status.whiteActive ? 'N' : 'n';

			for (let i=0;i<Knight.length;i++) {
				let test_dest = move.dest + Knight[i];
				if (test_dest < 0 || test_dest > 63) continue;
				if (Math.abs((move.dest % 8) - (test_dest % 8)) > 2) continue;

				if (Pieces.dereference(current_engine.map[test_dest]) == correct_color) {
					if (one_knight_already_found) {
						_needs_ident = true;
						break;
					}
					else {
						one_knight_already_found = true;
					}
				}
			}
		}
		if (_needs_ident) {
			move.indenification = 'abcdefgh'[Interface.xyFromSquare(move.source)[0]];
		}

		move_history.push(move);

		Evaluation.destroy();

		Canvas.Slide_Piece(current_engine, move, function() {
			commitMoveToEngine(current_engine, move);

			Canvas.Threats_Highlight(current_engine.threats, current_engine.attacks);

			Canvas.Draw();

			Report.state(Evaluation.state);
			Report.fen(Engine.Board_State_To_Fen(current_engine));

			Report.lastMove(Style.Beautify_Move(
				current_engine.status.fullmoves,
				{
					piece: current_engine.map[move.dest],
					dest: move.dest,
				},
			));

			launchAi(function() {});
		});
	}
	function aiResponse(move, callback) {
		if (move == null) {	// if null, then AI had no legal moves
			validateStatusBeforeActing(function() {
				halt_action_until_ready = false;
			});

			return;
		}

		move.piece = Pieces.dereference(current_engine.map[move.source] % 16);

		let _needs_ident = false;
		if (move.piece == 'N') {
			let one_knight_already_found = false;

			const KLU = 6, KRU = 10, KUL = 15, KUR = 17;
			let Knight = [
				KLU, KRU, KUL, KUR,
				-KLU, -KRU, -KUL, -KUR,
			];
			let correct_color = current_engine.status.whiteActive ? 'N' : 'n';

			for (let i=0;i<Knight.length;i++) {
				let test_dest = move.dest + Knight[i];
				if (test_dest < 0 || test_dest > 63) continue;
				if (Math.abs((move.dest % 8) - (test_dest % 8)) > 2) continue;

				if (Pieces.dereference(current_engine.map[test_dest]) == correct_color) {
					if (one_knight_already_found) {
						_needs_ident = true;
						break;
					}
					else {
						one_knight_already_found = true;
					}
				}
			}
		}
		if (_needs_ident) {
			move.indenification = 'abcdefgh'[Interface.xyFromSquare(move.source)[0]];
		}

		move_history.push(move);

		Evaluation.destroy();

		Canvas.Slide_Piece(current_engine, move, function() {
			commitMoveToEngine(current_engine, move);

			Evaluation.create(current_engine);

			Canvas.Threats_Highlight(current_engine.threats, current_engine.attacks);

			Canvas.Draw();

			Report.lastMove(Style.Beautify_Move(
				current_engine.status.fullmoves,
				{
					piece: current_engine.map[move.dest],
					dest: move.dest,
				},
			));

			Report.state(Evaluation.state);
			Report.fen(Engine.Board_State_To_Fen(current_engine));

			validateStatusBeforeActing(function() {
				halt_action_until_ready = false;

				callback();
			});
		});
	}

	function validateStatusBeforeActing(callback) {

		Interface.Select_Square(null);

			// check if draw by 50 move rule
		if (current_engine.status.halfmoves >= 100) {
			_gameOver = true;
			Report.status('Stalemate by 50 move rule');
			return;
		}

		let pieces = current_engine.active_pieces.concat(current_engine.inactive_pieces);

			// check if there's a draw by insufficient material
		if (pieces.length <= 4) {
			let drawn = true, extraPieces = [];

			for (let i=0;i<pieces.length;i++) {
				if (current_engine.map[pieces[i]] % 16 == 0) continue;	// skip king check

				if (Math.floor(current_engine.map[pieces[i]]) % 16 == 1) {
					drawn = false;
					break;	// queen = NO DRAW
				}
				if (Math.floor(current_engine.map[pieces[i]]) % 16 == 2 ||
						current_engine.map[pieces[i]] % 16 == 3)
				{
					drawn = false;
					break;	// rook = NO DRAW
				}
				if (Math.floor(current_engine.map[pieces[i]]) % 16 > 7) {
					drawn = false;
					break;	// any panws = NO DRAW
				}

				extraPieces.push(pieces[i]);
			}

				////	if it reaches here -> the only possible non-draw situation is
				//	two bishops on different color-squares
			if (drawn && pieces.length == 4) {
				if (Pieces.dereference(current_engine.map[extraPieces[0]] % 16) == 'B')
				if (Pieces.dereference(current_engine.map[extraPieces[1]] % 16) == 'B')	// two bishops
				if (Engine.Square_Color(extraPieces[0]) !=
						Engine.Square_Color(extraPieces[1]))	// diff color-squared?
				{	// check if they're diff. color-squared bishops
					drawn = false;
				}
			}

			if (drawn) {
				_gameOver = true;
				Report.status('Draw by insufficient material');
				return;
			}
		}


			// now we check if the active player has any legal moves
		let at_least_one_possible_move = false;

		for (let i=0;i<pieces.length;i++) {
			if (Pieces.isWhite(current_engine.map[pieces[i]]) != current_engine.status.whiteActive) continue;

			let result = Pieces.All_Possible_Moves(
				current_engine,
				pieces[i],
			);

			if (result.length == 0) continue;

			at_least_one_possible_move = true;

			break;
		}

		if (!at_least_one_possible_move) {	// no legal moves -- game is OVER
			_gameOver = true;

			if (Engine.In_Check(current_engine)) {
					////	we make one final check to see if the AI king is in check...
					//	if it is ? game is LOST
					//	if it is NOT : game is DRAWN by stalemate
				Report.status(`Checkmate! ${current_engine.status.whiteActive ? 'Black' : 'White'} wins!`);
			}
			else {
				Report.status('Stalemate: 0.5 / 0.5');
			}

			return;
		}

		callback();
	}

	function runAiAgainstItself() {
		if (_gameOver) return;
		if (!_runAiTest) return;

		launchAi(function() {
			runAiAgainstItself();
		});
	}

	function launchAi(callback) {
		halt_action_until_ready = false;

		Interface.Stop_Input();

		Interface.Show_AI_Thinking_Icon(true);

		AI_Actor.Solve(
			function(solution) {
				Interface.Show_AI_Thinking_Icon(false);
				aiResponse(
					solution,
					function() {
						Interface.Allow_Input();

						callback();
					},
				);
			}
		);
	}


	self.Test = function(depth, engine) {
		Evaluation.destroy();

		if (engine == null) {
			self.Create_Board(Boards.regular, true);

			engine = Engine.Current_Engine();
		}

		function findNumOfPossibleMoves(engine, depth) {
			let numOfMoves = 0;

			if (depth == 0) {
				for (let p=0;p<engine.active_pieces.length;p++) {
					let source = engine.active_pieces[p];

					numOfMoves += Pieces.All_Possible_Moves(
						engine,
						source,
					).length;
				}

				return numOfMoves;
			}

			for (let p=0;p<engine.active_pieces.length;p++) {
				let source = engine.active_pieces[p];

				let moves = Engine.In_Check(engine) ?
						Pieces.All_Possible_Moves(
						engine,
						source,
					) :
					engine.attackers[
						engine.map[source]
					];

				for (let m=0;m<moves.length;m++) {
					let dest = moves[m];

					if (engine.map[dest] != Pieces.empty) {
						if (Pieces.isWhite(engine.map[dest]) == engine.status.whiteActive)
							continue;
					}

					let move = new Move_Class({
						source: source,
						dest: dest,
					});

					Engine.Make_Move(engine, move);
					numOfMoves += findNumOfPossibleMoves(engine, depth - 1);
					Engine.Undo_Move(engine, move);
				}
			}

			return numOfMoves;
		}

		let startTime = new Date;
		let result = findNumOfPossibleMoves(engine, depth - 1);

		return `Found ${result} after ${new Date - startTime}ms`;
	};


	self.Current_Fen = function() {
		return self.Board_State_To_Fen(current_engine);
	};
	self.Current_PNG = function() {
		let pgn = '', whiteCycle = true;

		for (let move=0;move<move_history.length;move++) {
			if (whiteCycle) {
				pgn += ` ${Math.floor(move / 2) + 1}.`;
			}

			let piece = '', extra = '',
					file, row;

			if (move_history[move].piece != 'P') {
				piece = move_history[move].piece;

				if (move_history[move].indenification != null) {
					extra = move_history[move].indenification;
				}
			}
			else {
				if (move_history[move].captured_piece != null) {
					piece = `${'abcdefgh'[Interface.xyFromSquare(move_history[move].source)[0]]}`;
				}
			}

			if (move_history[move].captured_piece != null) {
				extra += 'x';
			}

			let dest = Interface.xyFromSquare(move_history[move].dest);

			file = `${'abcdefgh'[dest[0]]}`;
			row = `${8 - dest[1]}`;

			pgn += ` ${piece}${extra}${file}${row}`;

			whiteCycle = !whiteCycle;
		}

		return pgn.substring(1, pgn.length);
	};
	self.Current_Engine = function() {
		return current_engine;
	};
	self.Game_Over = function() {
		return _gameOver;
	};
	self.Move_History = function() {
		return move_history;
	};
	self.Run_Ai_Against_Itself = function() {
		_runAiTest = true;

		self.Create_Board(_lastBoard);
	};
	self.Play_Against_Ai = function() {
		_runAiTest = false;

		self.Create_Board(_lastBoard);
	};
	self.Compute_Ai = function() {
		launchAi(function() {});
	};

	self.Is_Square_Threatened = function(engine, square) {
		return engine.threats.indexOf(square) != -1;
	};
	self.Is_Square_Attacked = function(engine, square) {
		return engine.attacks.indexOf(square) != -1;
	};
	self.In_Check = function(engine) {
		return Engine.Is_Square_Threatened(
			engine,
			engine.status.activeKing,
		);
	};

	self.Is_Actable_Piece = function(engine, square) {
		if (_gameOver || halt_action_until_ready) return false;
		if (square < 0 || square > 63) return false;

		let piece_is_white = Pieces.isWhite(engine.map[square]);

		if (piece_is_white == null) return false;

		if (Client.isWhite) {
			if (piece_is_white == engine.status.whiteActive) {
				return true;
			}
		}
		else {
			if (!piece_is_white == !engine.status.whiteActive) {
				return true;
			}
		}

		return false;
	};
	self.Board_State_To_Fen = function(engine) {
		let fenStr = '';

		for (let y=0, square=0, empty_space_counter=0;y<8;y++) {
			for (let x=0;x<8;x++, square++) {
				try {
					if (engine.map[square] == Pieces.empty) {
						empty_space_counter++;
					}
					else {
						if (empty_space_counter != 0) {
							fenStr += ''+empty_space_counter;
							empty_space_counter = 0;
						}
						fenStr += Pieces.dereference(engine.map[square]);
					}
				}
				catch (e) {
					console.error(e);
				}
			}

			if (empty_space_counter != 0) {
				fenStr += ''+empty_space_counter;
				empty_space_counter = 0;
			}

			if (y==7) continue;
			fenStr += '/';
		}

		fenStr += engine.status.whiteActive ? ' w ' : ' b ';

		if (
			!engine.status.whiteKingsideCastle &&
			!engine.status.whiteQueensideCastle &&
			!engine.status.blackKingsideCastle &&
			!engine.status.blackQueensideCastle
		) {
			fenStr += '-';
		}
		else {
			if (engine.status.whiteKingsideCastle) {
				fenStr += 'K';
			}
			if (engine.status.whiteQueensideCastle) {
				fenStr += 'Q';
			}
			if (engine.status.blackKingsideCastle) {
				fenStr += 'k';
			}
			if (engine.status.blackQueensideCastle) {
				fenStr += 'q';
			}
		}

		if (engine.status.enpassant) {
			fenStr += ' ' + engine.status.enpassant;
		}
		else {
			fenStr += ' -';
		}

		fenStr += ' ' + engine.status.halfmoves;
		fenStr += ' ' + engine.status.fullmoves;

		return fenStr;
	};
	self.PNG = function(engine) {
		return Engine.Current_PNG();
	};
	self.Engine_From_Fen = function(fen) {
		let fenArray = fen.split(' ');
		if (fenArray.length != 6) return;
		let fenBoard = fenArray[0].split('/');
		if (fenBoard.length != 8) return;

		let map = new Array(64);
		let reference = 'KQRRBBNNPPPPPPPPkqrrbbnnpppppppp';
		let whiteKingLocation, blackKingLocation;

		for (let y=7,mapIndex=0;y>=0;y--) {
			for (let j=0,x=0;j<fenBoard[y].length;j++) {
				try {
					let fenValue = parseInt(fenBoard[y][j]);

					if (isNaN(fenValue)) {
						map[mapIndex] = reference.indexOf(fenBoard[y][j]);
						reference = reference.replace(fenBoard[y][j], ' ');
						if (fenBoard[y][j] == 'K') {
							whiteKingLocation = mapIndex;
						}
						else if (fenBoard[y][j] == 'k') {
							blackKingLocation = mapIndex;
						}
						mapIndex++;
					}
					else {
						for (let i=0;i<fenValue;i++) {
							map[mapIndex++] = Pieces.empty;
						}
					}
				}
				catch (e) {
					console.error(e);
				}
			}
		}

		let boardStatus = {};

		boardStatus.whiteActive = fenArray[1] == 'w';

		if (fenArray[2] == '-') {
			boardStatus.whiteKingsideCastle = false;
			boardStatus.whiteQueensideCastle = false;
			boardStatus.blackKingsideCastle = false;
			boardStatus.blackQueensideCastle = false;
		}
		else {
			boardStatus.whiteKingsideCastle = fenArray[2].indexOf('K') != -1;
			boardStatus.whiteQueensideCastle = fenArray[2].indexOf('Q') != -1;
			boardStatus.blackKingsideCastle = fenArray[2].indexOf('k') != -1;
			boardStatus.blackQueensideCastle = fenArray[2].indexOf('q') != -1;
		}

		if (fenArray[3] == '-') {
			boardStatus.enpassant = null;
		}
		else {
			boardStatus.enpassant = fenArray[3];
		}

		boardStatus.halfmoves = parseInt(fenArray[4]);

		boardStatus.fullmoves = parseInt(fenArray[5]);

		let engine = new Engine_Class({
			fen: fen,
			map: map,
			status: boardStatus,
		});

		engine.status.activeKing = boardStatus.whiteActive ? whiteKingLocation : blackKingLocation;
		engine.status.inactiveKing = boardStatus.whiteActive ? blackKingLocation : whiteKingLocation;

		Engine.Generate_Indexable_Data(engine);

		return engine;
	};
	self.Generate_Indexable_Data = function(engine) {
		engine.pins = [];
		engine.threats = [];
		engine.attacks = [];
		engine.checking_pieces = [];
		engine.active_pieces = [];
		engine.inactive_pieces = [];
		engine.attackers = [];
		engine.defenders = [];

		for (let location=0;location<engine.map.length;location++) {
			if (engine.map[location] == Pieces.empty) continue;

			let move_list = Pieces.All_Possible_Moves(
				engine,
				location,
				true,	////	we want to ignore potential checks here,
							//	because the game would already be won if they kill the king
			);

			let isActive = Pieces.isWhite(engine.map[location]) == engine.status.whiteActive;
			let attacks_and_threats, attackers_and_defenders;

			if (isActive) {
				attacks_and_threats = engine.attacks;
				attackers_and_defenders = engine.attackers;
				engine.active_pieces.push(location);
			}
			else {
				attacks_and_threats = engine.threats;
				attackers_and_defenders = engine.defenders;
				engine.inactive_pieces.push(location);
			}

			if (!isActive && move_list.indexOf(engine.status.activeKing) != -1) {
				engine.checking_pieces.push(location);
					// add this piece to the checking pieces list
			}

			attackers_and_defenders[
				engine.map[location]
			] = move_list.slice();

				////	only inactive pieces can make threats
				//	active pieces have the opportunity to move from a threat
				//	active pieces can perform attacks, which is different from a threat

			for (let j=0;j<move_list.length;j++) {
				if (attacks_and_threats.indexOf(move_list[j]) == -1)
					attacks_and_threats.push(move_list[j]);
			}

			if (isActive) continue;

				//// if the inactive piece is a slidy piece,
				// then it can create pins, so we must check for pins

			let type = Pieces.dereference(engine.map[location] % 16);

			if (type == 'Q' || type == 'R' || type == 'B') {
				for (let j=0;j<move_list.length;j++) {
					if (
						engine.map[move_list[j]] != Pieces.empty &&
						Pieces.isWhite(engine.map[location]) !=
							Pieces.isWhite(engine.map[move_list[j]])
					) {
						let pin_list = Pieces.Pin_List(engine, location, move_list[j]);

							// check if the active king is on its slide direction
						if (
							pin_list.length != 0 &&
							Pieces.dereference(
								engine.map[
									pin_list[
										pin_list.length - 1
									]
								] % 16
							) == 'K'
						) {
							engine.pins.push(pin_list);
						}
					}
				}
			}
		}
	};

	self.Square_Color = function(location) {
		if ((Math.floor(location / 8) + location) % 2 == 1)
			return true;	// true for white
		return false;	// false for black
	};


	self.Clone_Status = function(engine) {
		return clone_status(engine.status);
	};
	self.Clone = function(source_engine) {
		let _cloned_map = source_engine.map.slice();

		let status = clone_status(source_engine.status);

		let new_engine = new Engine_Class({
			map: _cloned_map,
			status: status,
		});

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
	};

	self.Make_Move = function(engine, move) {
		commitMoveToEngine(engine, move);
	};
	self.Undo_Move = function(engine, move) {
		reverseMoveToEngine(engine, move);
	};


	self.Create_Board = function(fen, no_eval) {
		_gameOver = false;
		_lastBoard = fen;

		Style.clean();

		Canvas.Initate(document.getElementById('board'));

		current_engine = self.Engine_From_Fen(fen);

		Canvas.Draw();

		Report.status('ready to play');

		if (_runAiTest)
			runAiAgainstItself();
		else if (current_engine.status.whiteActive != Client.isWhite)
			launchAi(function() {});
		else if (!no_eval) Evaluation.create(current_engine);
	};

	self.Input_Move = function(move) {
		if (!Client.Is_Playing) return;
		if (_gameOver) return;

		act(move);
	};
} ();

const Openings = new function() {
	let self = this;

	let data = '';

	function response(input) {
		data = input;
	}

	function readTextFile(file) {
		fetch(file)
		  .then(response => response.text())
		  .then(text => response(text));
	}

	readTextFile('openings.txt');

	self.access = function(input) {
		return data.match(new RegExp(`^${input}(.*)`, 'gm'));
	};
} ();


const Evaluation = new function() {
	let self = this;

	let worker;

	self.create = function(input_engine) {
		if (typeof(worker) != 'undefined') {
			worker.postMessage(JSON.stringify({
				type: 400,
			}));
			worker = undefined;
		}

		worker = new Worker('evaluation.js');
		worker.postMessage = (worker.webkitPostMessage || worker.postMessage);

		worker.postMessage(JSON.stringify({
			type: 100,
			data: input_engine,
		}));
		worker.addEventListener('message', function(event) {
			let input = JSON.parse(event.data);

			let data = input.data,
					type = input.type;

			if (type == 0) {
				Report.evaluation(data);
			}
			else if (type == 1) {
				Report.numOfLines(`${data.numOfLines} lines evaulated<br />Depth of ${data.depth}`);
				Report.timeCounter(`${data.time}ms`);
			}

			else if (type == 210) {
				self.depth = data;
			}
			else if (type == 211) {
				self.lines = data;
				// console.log('new send');
				// for (let i=0;i<data.length;i++) {
				// 	console.log(data[i].eval, data[i].move.source, data[i].dest);
				// }
			}
			else if (type == 212) {
				self.moves = data;
			}
			else if (type == 213) {
				self.state = data;
			}

			else if (type == 666) {
				Canvas.Debug(data);
			}
		});
	};
	self.destroy = function(input_engine) {
		if (typeof(worker) != 'undefined') {
			worker.terminate();
		}

		worker = undefined;
	};
} ();

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
					if (attacks.indexOf(dest) != -1) {
						invalid_move = true;
						break;
					}
				}

				engine.map[square] = engine.map[dest];
				engine.map[dest] = temp;
				if (invalid_move) return true;
			}
			return engine.threats.indexOf(dest) != -1;
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
				if (pin_list.indexOf(dest) != -1) {
					return dest == pin_list[pin_list.length - 1];
				}
				else return true;
			}
		}

			// if the piece is pinned and the dest is not also a pinned tile
			// specifically from within the same pin source
		for (let i=0;i<engine.pins.length;i++) {
			if (engine.pins[i].indexOf(square) != -1) {
				return engine.pins[i].indexOf(dest) == -1;
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

			if (move.dest == Interface.squareFromXY(file, row)) {
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
						attack_list.indexOf(enpassant_location) != -1
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
					Engine.Is_Square_Attacked(engine, 4) &&
					Engine.Is_Square_Attacked(engine, 3) &&
					Engine.Is_Square_Attacked(engine, 2)
				) {
					tryToAddToList(engine, list, square, 2, find_attacks);
				}
			}
			if (engine.status.whiteKingsideCastle) {
				if (
					engine.map[5] == Pieces.empty &&
					engine.map[6] == Pieces.empty
				) if (
					Engine.Is_Square_Attacked(engine, 4) &&
					Engine.Is_Square_Attacked(engine, 5) &&
					Engine.Is_Square_Attacked(engine, 6)
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
					Engine.Is_Square_Attacked(engine, 60) &&
					Engine.Is_Square_Attacked(engine, 59) &&
					Engine.Is_Square_Attacked(engine, 58)
				) {
					tryToAddToList(engine, list, square, 58, find_attacks);
				}
			}
			if (engine.status.blackKingsideCastle) {
				if (
					engine.map[61] == Pieces.empty &&
					engine.map[62] == Pieces.empty
				) if (
					Engine.Is_Square_Attacked(engine, 60) &&
					Engine.Is_Square_Attacked(engine, 61) &&
					Engine.Is_Square_Attacked(engine, 62)
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
					tryToAddToList(engine, list, square, Interface.squareFromXY(file, 7 - row), find_attacks);
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

	self.Does_Move_Put_In_Check = checkIfMoveWillBeInCheck;

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


const Style = new function() {
	const self = this;
	const piecesAsset = 'sprites.svg';
	const spriteWidth = 45;
	const spritesImage = new Image();
	spritesImage.src = piecesAsset;

	let createdPieces = [];
	function clean() {
		for (let i=0;i<createdPieces.length;i++) {
			try {
				createdPieces[i].delete();
			} catch (e) {
				console.error(e);
			}
		}

		createdPieces = [];
	}
	function createSvg(x, y) {
		let crop = document.createElement('div');
		crop.style.height = spriteWidth + 'px';
		crop.style.width = spriteWidth + 'px';
		crop.style.overflow = 'hidden';

		let svg = document.createElement('img');
		svg.src = 'sprites.svg';
		svg.alt = 'Chess pieces';
		svg.style.height = (spriteWidth*2) + 'px';
		svg.style.width = (spriteWidth*6) + 'px';
		svg.style.margin = `-${y}px 0 0 -${x}px`;

		crop.appendChild(svg);
		createdPieces.push(crop);

		return crop;
	}

	function makePiece(type) {
		let resultImage;

		switch (type) {
			case 'k':
				resultImage = createSvg(0, spriteWidth);
				break;
			case 'q':
				resultImage = createSvg(spriteWidth, spriteWidth);
				break;
			case 'b':
				resultImage = createSvg(2 * spriteWidth, spriteWidth);
				break;
			case 'n':
				resultImage = createSvg(3 * spriteWidth, spriteWidth);
				break;
			case 'r':
				resultImage = createSvg(4 * spriteWidth, spriteWidth);
				break;
			case 'p':
				resultImage = createSvg(5 * spriteWidth, spriteWidth);
				break;
			case 'K':
				resultImage = createSvg(0, 0);
				break;
			case 'Q':
				resultImage = createSvg(spriteWidth, 0);
				break;
			case 'B':
				resultImage = createSvg(2 * spriteWidth, 0);
				break;
			case 'N':
				resultImage = createSvg(3 * spriteWidth, 0);
				break;
			case 'R':
				resultImage = createSvg(4 * spriteWidth, 0);
				break;
			case 'P':
				resultImage = createSvg(5 * spriteWidth, 0);
				break;
			default:
				resultImage = createSvg(0, 0);
		}

		return resultImage;
	}

	self.dark = '#387b3e';
	self.light = '#c5e8c8';
	self.white = '#fff';
	self.black = '#000';
	self.highlight = '#cce662';
	self.secondaryHighlight = '#e67a62';
	self.threatsHighlight = '#7b35c2';
	self.attacksHighlight = '#c23594';

	self.moveHighlightColor = '#25232266';
	self.moveAttackHighlightColor = '#f00';
	self.secondaryMoveHighlightColor = '#0000007d';
	self.secondaryMoveAttackHighlightColor = '#dc5555';

	self.basicSize = 40;
	self.sprites = spritesImage;
	self.backgroundColor = '#252322';
	self.cardStyle = 'card-green';

	self.clean = function() {
		clean();
	};
	self.Make_Piece = function(type) {
		return makePiece(type);
	};
	self.pieceXOffset = function(type) {
		if (type % 16 == 0) return 0;																	// King
		if (type % 16 == 1) return spriteWidth;												// Queen
		if (type % 16 == 4 || type % 16 == 5) return spriteWidth * 2;	// Bishop
		if (type % 16 == 6 || type % 16 == 7) return spriteWidth * 3;	// Knight
		if (type % 16 == 2 || type % 16 == 3) return spriteWidth * 4;	// Rook
		return spriteWidth * 5;																				// Pawn
	};
	self.pieceYOffset = function(type) {
		return Pieces.isWhite(type) ? 0 : spriteWidth;
	};

	self.Beautify_String = function(move) {
		return `${Pieces.dereference(move.piece)}${String.fromCharCode(move.dest % 8 + 97)}${Math.floor(move.dest / 8) + 1}`;
	};
	self.Beautify_Move = function(move_num, move, extra_info) {
		let scale = 0.6;

		let container = document.createElement('div');

		let casing = document.createElement('div');
		casing.style.width = `${spriteWidth * scale}px`;
		casing.style.height = `${spriteWidth * scale}px`;
		casing.style.display = `inline-block`;
		casing.style.overflow = `hidden`;
		casing.style.transform = `translateY(${7 * scale}px)`;

		let img = document.createElement('img');
		img.src = 'sprites.svg';
		img.style.margin = `${-self.pieceYOffset(move.piece) * scale}px 0 0 ${-self.pieceXOffset(move.piece) * scale}px`;
		img.style.width = `${spriteWidth * 6 * scale}px`;

		casing.appendChild(img);

		let move_number = document.createElement('span');
		if (move_num != null)
			move_number.innerHTML = `${move_num}. `;

		let move_move = document.createElement('span');
		move_move.innerHTML = `${String.fromCharCode(move.dest % 8 + 97)}${Math.floor(move.dest / 8) + 1}`;
		if (extra_info) {
			move_move.innerHTML += extra_info;
		}

		container.appendChild(move_number);
		container.appendChild(casing);
		container.appendChild(move_move);

		return container;
	};
} ();

const Sounds = new function() {
	let self = this;

	let Types = {};
	let sheet, capture, slide, place;
	const measure = 18.39285;
	const interval = measure * 4;

	function sound(src) {
	  let sound = document.createElement('audio');
	  sound.src = src;
		sound.volume = .5;
	  sound.setAttribute('preload', 'auto');
	  sound.setAttribute('controls', 'none');
	  sound.style.display = 'none';
	  document.body.appendChild(sound);

		function refresh() {
			sound.currentTime = 0;
			setTimeout(function() {
				sound.play();
				setTimeout(function() {
					sound.pause();
				}, 10);
			}, 10);
		}

	  this.play = function(start, end){
			sound.play();
	  };
	  this.stop = function(){
	    sound.pause();
	  };
	}

	self.load = function() {
		sheet = new sound('sfx/sheet.mp3');
		capture = [new sound('sfx/capture.mp3'),new sound('sfx/capture2.mp3'),new sound('sfx/capture3.mp3')];
		slide = new sound('sfx/slide.mp3');
		place = [new sound('sfx/place.mp3'),new sound('sfx/place2.mp3'),new sound('sfx/place3.mp3'),new sound('sfx/place4.mp3')];

		Types['capture'] = 0;
		Types['slide'] = 1;
		Types['place'] = 2;
	};

	self.Play = function(type) {
		let index = Types[type];

		if (index == null) return;

		if (index == 0) {
			capture[Math.floor(Math.random() * 3)].play();
		}
		else if (index == 1) {
			slide.play();
		}
		else if (index == 2) {
			place[Math.floor(Math.random() * 4)].play();
		}
	};
} ();

const Boards = new function() {
	const self = this;

	self.check = '5Q2/7P/K6p/2k5/2r5/8/P7/2Q5 b - - 207 104';
	self.middleGameTest = '6nr/p2b1kpp/1pq1pp2/n2pP3/P1rP1P2/R1PB3P/4NBP1/Q4RK1 b - - 3 24';
	self.endgameTest = '7/3p2k1/8/3K4/8/8/2r5/5r2 w - - 3 50';
	self.deepEndgameTest = '3K4/3P2k1/8/8/8/8/2r5/5R2 w - - 3 50';
	self.regular = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
} ();


const Interface = new function() {
	let self = this;
	let loaded = false;

	function allowInteraction() {
		return true;
	}
	function handleRightClick(square) {
		if (!allowInteraction()) return;

		HighlightSquare(square);

		return false;
	}
	function handleClick(square) {
		if (!allowInteraction()) return;

		SelectSquare(square);

		return false;
	}

	self.squareFromXY = function(x, y) {
		if (_flipInput) return (y) * 8 + x;
		return (7 - y) * 8 + x;
	};
	self.xyFromSquare = function(square) {
		let x = square % 8;
		let y = 7 - Math.floor((square - x) / 8);
		return [x, y];
	};

	let allow_input = false;
	let master_kill_switch = false;
	let cur_handler;
	let mousedown = false;
	let touch_start_loc = new Array(2), last_touch_loc = new Array(2);

		//** Add the game event handler interactions */
	let __mousedown_time;
	let last_handler = null;
	let _flipInput = false;
	let current_interactions = new Array(8);
	const ___touchstart = function(e) {
		e.preventDefault();

		let x = Math.round(e.touches[0].clientX);
		let y = Math.round(e.touches[0].pageY);

		x = Canvas.inputScale(Math.round(e.touches[0].clientX - board.offsetLeft + window.scrollX));
		y = Canvas.inputScale(Math.round(e.touches[0].clientY - board.offsetTop + window.scrollY));

		mousedown = true;
		__mousedown_time = e.timeStamp;
		last_touch_loc[0] = x;
		last_touch_loc[1] = y;

		let square = Interface.squareFromXY(x, y);

		if (!self.Click(square)) return false;

		touch_start_loc[0] = x;
		touch_start_loc[1] = y;

		return false;
	};
	const ___touchmove = function(e) {
		e.preventDefault();
		let x = Math.round(e.touches[0].clientX);
		let y = Math.round(e.touches[0].pageY);

		last_touch_loc[0] = x;
		last_touch_loc[1] = y;

		if (Math.abs(x-touch_start_loc[0])<5 &&
				Math.abs(y-touch_start_loc[1])<5)
			return false;

		let square = Interface.squareFromXY(x, y);

		self.Mouse_Move(square);

		return false;
	};
	const ___touchend = function(e) {
		e.preventDefault();
		if (!mousedown) return false;

		let x = Math.round(last_touch_loc[0]);
		let y = Math.round(last_touch_loc[1]);

		let square = Interface.squareFromXY(x, y);

		if (e.timeStamp-__mousedown_time<170)	// if released quickly ...
			self.Release(square);

		touch_start_loc[0] = -1;
		touch_start_loc[1] = -1;
		mousedown = false;

		return false;
	};
	const ___touchcancel = function(e) {
		e.preventDefault();

		touch_start_loc[0] = -1;
		touch_start_loc[1] = -1;
		last_touch_loc[0] = -1;
		last_touch_loc[1] = -1;
		mousedown = false;
	};
	const ___mousedown = function(e) {
		const board = document.getElementById('board');
		let x = Canvas.inputScale(e.clientX - board.offsetLeft + window.scrollX),
			y = Canvas.inputScale(e.clientY - board.offsetTop + window.scrollY);

		if (e.target.tagName.match(/input|textarea|select/i)) {
			return;
		}

		mousedown = true;
		return false;
	};
	const ___mouseup = function(e) {
		if (e.which==3) return true;
		const board = document.getElementById('board');
		let x = Canvas.inputScale(e.clientX - board.offsetLeft + window.scrollX),
				y = Canvas.inputScale(e.clientY - board.offsetTop + window.scrollY);

		let square = Interface.squareFromXY(x, y);
		self.Release(square);
		if (!mousedown) return;

		mousedown = false;
		return false;
	};
	const ___contextmenu = function(e) {
		e.preventDefault();
		const board = document.getElementById('board');
		let x = Canvas.inputScale(e.clientX - board.offsetLeft + window.scrollX),
				y = Canvas.inputScale(e.clientY - board.offsetTop + window.scrollY);

		let square = Interface.squareFromXY(x, y);
		self.Right_Click(square);

		return false;
	};
	const ___mousemove = function(e) {
		const board = document.getElementById('board');
		let x = Canvas.inputScale(e.clientX - board.offsetLeft + window.scrollX),
				y = Canvas.inputScale(e.clientY - board.offsetTop + window.scrollY);

		if (!mousedown)
		{
			let square = Interface.squareFromXY(x, y);
			self.Mouse_Move(square);
			return;
		}

		return false;
	};
	const set_current_interactions = function(list) {
		for(let i=0;i<8;i++)
		{
			if (list[i]!=null)
				current_interactions[i] = list[i];
		}
	};
	const do_current_interaction = function(index, e) {
		current_interactions[index](e);
	};
	const reset_interations = function() {
		set_current_interactions([
			___touchstart,	___touchmove,	___touchend,		___touchcancel,
			___mousedown,		___mouseup,		___contextmenu,	___mousemove]);
	};
	reset_interations();

	let _lastClick;
	self.Click = function(square) {
		if (Engine.Current_Engine() == null) return;
		if (master_kill_switch) return;
		if (square < 0 || square > 63) return;
		if (_lastClick == square) return;
		_lastClick = square;

		if (_flipInput) square = Math.floor(square / 8) * 8 + 7 - (square % 8);

		Canvas.Highlight(square);

		Interface.Select_Square(square);
	};
	let _lastRelease;
	self.Release = function(square) {
		if (Engine.Current_Engine() == null) return;
		if (master_kill_switch) return;
		if (square < 0 || square > 63) return;
		if (_lastRelease == square) return;
		_lastRelease = square;

		if (_flipInput) square = Math.floor(square / 8) * 8 + 7 - (square % 8);

		Canvas.Highlight(square);

		Interface.Select_Square(square);
	};
	let _lastMouseMove;
	self.Mouse_Move = function(square) {
		if (Engine.Current_Engine() == null) return;
		if (master_kill_switch) return;
		if (square < 0 || square > 63) return;
		if (_lastMouseMove == square) return;
		_lastMouseMove = square;

		if (_flipInput) square = Math.floor(square / 8) * 8 + 7 - (square % 8);

		if (cur_handler==null) return;
		if (Engine.Is_Actable_Piece(Engine.Current_Engine(), square)) {
			if (!master_kill_switch) cur_handler.style.cursor = 'pointer';
		}
		else {
			cur_handler.style.cursor = '';
		}
	};
	let _lastRightClick;
	self.Right_Click = function(square) {
		if (Engine.Current_Engine() == null) return;
		if (master_kill_switch) return;
		if (square < 0 || square > 63) return;
		if (_lastRightClick == square) return;
		_lastRightClick = square;

		if (_flipInput) square = Math.floor(square / 8) * 8 + 7 - (square % 8);

		Canvas.Secondary_Highlight(square);
	};

	let selectedPiece = null, selectedSquare = null;
	self.Select_Square = function(square) {
		if (Engine.Current_Engine() == null) return;
		if (square == null) {
			selectedPiece = null;
			selectedSquare = null;
			return;
		}
		if (square < 0 || square > 63) return;

		Canvas.Show_Possible_Moves([]);

		let engine = Engine.Current_Engine();

		// handle when a piece is already selected
		if (selectedPiece != Pieces.empty) {

			let move = new Move_Class({
				source: selectedSquare,
				dest: square,
			});
			if (Pieces.Can_Move(engine, move)) {
				Engine.Input_Move(move);
				_lastClick = null;
				_lastRelease = null;
				_lastMouseMove = null;
				_lastRightClick = null;
			}
			else if (Engine.Is_Actable_Piece(engine, square)) {
				selectedPiece = engine.map[square];
				selectedSquare = square;

				Canvas.Show_Possible_Moves(Pieces.All_Possible_Moves(engine, square));

				return;
			}

			selectedPiece = Pieces.empty;
			selectedSquare = square;

			return;
		}

		selectedSquare = square;

		if (!Engine.Is_Actable_Piece(engine, square)) return;

		selectedPiece = engine.map[square];

		Canvas.Show_Possible_Moves(Pieces.All_Possible_Moves(engine, square));
	};

	self.Initate = function(board, fenBoard) {
		if (loaded) return;

		loaded = true;

		init(board, fenBoard);
	};

	self.Stop_Input = function() {
		master_kill_switch = true;
	};
	self.Allow_Input = function() {
		master_kill_switch = false;
	};

	self.Flip_Input = function(input) {
		_flipInput = input;
	}
	self.Set_Controls = function(handler) {
		if (last_handler!=null) {
			return; // bug ?
			last_handler.removeEventListener('touchstart touchmove touchend touchcancel mousedown mouseup contextmenu mousemove');
			last_handler = null;
		}
		last_handler = handler;
		window.onkeyup = function(e) {
			e = e || window.event;
			if (e.keyCode == '38') {
				// scroller.scrollBy(0,-TILESIZE,true);
			}
			else if (e.keyCode == '40') {
				// scroller.scrollBy(0,+TILESIZE,true);
			}
			else if (e.keyCode == '37') {
				// scroller.scrollBy(-TILESIZE,0,true);
			}
			else if (e.keyCode == '39') {
				// scroller.scrollBy(+TILESIZE,0,true);
			}
			else if (e.keyCode == '32') {
				// HUD_Actions.show();
			}
		};
		handler.addEventListener('touchstart', function(e) {
			do_current_interaction(0, e);
		});
		handler.addEventListener('touchmove', function(e) {
			do_current_interaction(1, e);
		});
		handler.addEventListener('touchend', function(e) {
			do_current_interaction(2, e);
		});
		handler.addEventListener('touchcancel', function(e) {
			do_current_interaction(3, e);
		});
		handler.addEventListener('mousedown', function(e) {
			do_current_interaction(4, e);
		});
		handler.addEventListener('mouseup', function(e) {
			do_current_interaction(5, e);
		});
		handler.addEventListener('contextmenu', function(e) {
			do_current_interaction(6, e);
		});
		handler.addEventListener('mousemove', function(e) {
			do_current_interaction(7, e);
		});

		cur_handler = handler;
	};

	self.Show_AI_Thinking_Icon = function(value) {
		if (Engine.Game_Over()) return;

		if (value) {
			Report.status('thinking...');
		}
		else {
			Report.status('decision made');
		}
	};
} ();

const Canvas = new function() {
	let self = this;

	const ORIGINAL_SIZE = 600;
	const MAXSIZE = 1100;
	let SIZE = ORIGINAL_SIZE;
	let loaded = false;
	self.inputScale = function(value) {
		return Math.floor(value / (SIZE / 8.0));
	};

	const Context = {
		bg: null,
		pieces: null,
		animation: null,
		hud: null,
	};

	let selectedTile = null
	let secondaryHighlight = [],
			threatsHighlights = [],
			attackHighlights = [];
	let possible_moves = [];
	let allow_render = true,
			animating = false;
	let flip_board = false;
	let _debugMode = false;


	function init(casing) {
		if (casing.id == null) return;

		function createContext(element) {
			let canvas = document.createElement('canvas');

			canvas.setAttribute('width', SIZE);
			canvas.setAttribute('height', SIZE);
			canvas.setAttribute('id', element.id + 'Display');
			canvas.setAttribute('class', 'w3-round');

			element.appendChild(canvas);

			if (typeof G_vmlCanvasManager!='undefined')
				canvas = G_vmlCanvasManager.initElement(canvas);

			let context = canvas.getContext('2d');

			context.width = SIZE;
			context.height = SIZE;
			context.source = canvas;
			context.name = element.id;

			return context;
		}

		function createCanvas(name) {
			let element = document.createElement('div');

			element.id = `${name}Canvas`;
			element.style.width = `${SIZE}px`;
			element.style.height = `${SIZE}px`;
			element.className = 'canvas';

			return element;
		}

		let background = createCanvas('background');
		let animation = createCanvas('animation');
		let pieces = createCanvas('pieces');
		let hud = createCanvas('hud');
		let inputHandler = createCanvas('inputHandler');

		Context.bg = createContext(background);
		Context.animation = createContext(animation);
		Context.pieces = createContext(pieces);
		Context.hud = createContext(hud);

		casing.appendChild(background);
		casing.appendChild(animation);
		casing.appendChild(pieces);
		casing.appendChild(hud);
		casing.appendChild(inputHandler);

		Interface.Set_Controls(inputHandler);

		document.getElementById('btn-replay').onclick = function() {
			Engine.Create_Board(Boards.regular);
		};
		document.getElementById('btn-flip-sides').onclick = function() {
			Canvas.Flip_Board(Client.isWhite);
			Client.isWhite = !Client.isWhite;

			if (Engine.Current_Engine().status.whiteActive != Client.isWhite) {
				// Engine.Compute_Ai();
			}
		};
		document.getElementById('btn-watch-ai').onclick = function() {
			if (Client.Is_Playing()) {
				Client.Stop_Playing();
				document.getElementById('btn-watch-ai').children[0].className = 'fa fa-gamepad portfolio-ease';
				document.getElementById('btn-watch-ai').children[1].innerHTML = 'Play';
			}
			else {
				Client.Start_Playing();
				document.getElementById('btn-watch-ai').children[0].className = 'fa fa-eye portfolio-ease';
				document.getElementById('btn-watch-ai').children[1].innerHTML = 'Watch AI';
			}
		};
		document.getElementById('btn-debug').onclick = function() {
			Canvas.Debug();
		};
	}

	self.Initate = function(casing) {
		if (loaded) return;

		loaded = true;

		init(casing);
	};

	function render(engine) {
		if (!allow_render) return;
		if (Engine.Current_Engine() == null) return;

		document.body.style.backgroundColor = Style.backgroundColor;
		document.getElementById('info-card1').className = `w3-card w3-round-large w3-padding w3-margin chess-${Style.cardStyle}`;
		document.getElementById('info-card2').className = `w3-card w3-round-large w3-padding w3-margin chess-${Style.cardStyle}`;

		const board = document.getElementById('board');
		let mobile_flow = window.innerWidth < MAXSIZE ? 1.6 : 2.8;
		SIZE = Math.min(MAXSIZE, Math.min(Math.floor(window.innerWidth / mobile_flow), window.innerHeight - 140));
		const BTN_SIZE = SIZE / 10;

		board.parentElement.style.height = `${SIZE}px`;
		board.parentElement.style.width = `${SIZE + BTN_SIZE * 4.2}px`;
		board.style.width = `${SIZE}px`;
		board.style.height = `${SIZE}px`;
		for (let i=0;i<board.children.length;i++) {
			board.children[i].style.width = `${SIZE}px`;
			board.children[i].style.height = `${SIZE}px`;
		}

		const boardEval = document.getElementById('board-eval');
		boardEval.style.width = `${BTN_SIZE}px`;

		document.getElementById('eval-text').style.fontSize = `${BTN_SIZE * 0.3}px`;

		if (window.innerWidth < MAXSIZE) {
			document.getElementById('cards-container').className = '';
			document.getElementById('cards-container').style.width = '100%';
		}
		else {
			document.getElementById('cards-container').style.width = `${window.innerWidth - SIZE * 1.6}px`;
			document.getElementById('cards-container').className = 'w3-right';
		}

		const boardBtns = document.getElementById('board-buttons');
		boardBtns.style.height = `${boardBtns.children.length * (BTN_SIZE * 1.2)}px`;
		boardBtns.style.top = `-30%`;
		for (let i=0;i<boardBtns.children.length;i++) {
			boardBtns.children[i].style.width = `${BTN_SIZE}px`;
			boardBtns.children[i].style.height = `${BTN_SIZE}px`;
			boardBtns.children[i].style.paddingTop = `${BTN_SIZE * 0.12}px`;
			boardBtns.children[i].style.fontSize = `${BTN_SIZE * 0.4}px`;
			if (i==0) continue;
			boardBtns.children[i].style.marginTop = `${BTN_SIZE * 0.2}px`;
		}

		Context.bg.canvas.width  = SIZE;
		Context.bg.canvas.height  = SIZE;
		Context.hud.canvas.width  = SIZE;
		Context.hud.canvas.height  = SIZE;
		Context.pieces.canvas.width  = SIZE;
		Context.pieces.canvas.height  = SIZE;

		Context.bg.clearRect(0, 0, SIZE, SIZE);
		Context.pieces.clearRect(0, 0, SIZE, SIZE);
		Canvas.Clear_Highlights();

		Context.bg.fillRect(0, 0, SIZE, SIZE);

		if (!animating) {
			Context.animation.canvas.width  = SIZE;
			Context.animation.canvas.height  = SIZE;
			Context.animation.clearRect(0, 0, SIZE, SIZE);
		}

		const TILESIZE = SIZE / 8;
		let x_start = 0;
		let x = 0, y = TILESIZE * 7, piece, tileIndex = 0;
		let y_increment = TILESIZE, x_increment = TILESIZE;

		if (flip_board) {
			x = y;
			y = 0;
			x_increment = -x_increment;
			y_increment = -y_increment;
			x_start = x;
		}

		for (let i=0;i<8;i++) {
			for (let j=0;j<8;j++) {
				Context.bg.fillStyle =
					(i + j) % 2 == 0 ? Style.dark : Style.light;
				Context.bg.fillRect(x, y, TILESIZE, TILESIZE);

				Context.bg.fillStyle = 'black';

				if (_debugMode) {
					Context.bg.fillText(`${tileIndex}`, x + 1, y + TILESIZE - 2);
				}

				piece = engine.map[tileIndex++];

				if (piece != Pieces.empty) {
					Context.pieces.drawImage(
						Style.sprites,
						0 + Style.pieceXOffset(Math.floor(piece)),
						0 + Style.pieceYOffset(Math.floor(piece)),
						45, 45,
						x + 5, y + 5,
						TILESIZE - 9, TILESIZE - 9,
					);
				}

				x += x_increment;

				if (tileIndex % 8 == 0) {
					y -= y_increment;
					x = x_start;
				}
			}
		}
	}
	function drawHighlight() {
		const TILESIZE = SIZE / 8;
		let square;

		Context.hud.save();

		if (flip_board) {
			Context.hud.translate(Context.hud.canvas.height, Context.hud.canvas.height);
			Context.hud.scale(-1, -1);
		}

		Context.hud.globalAlpha = .6;

		Context.hud.clearRect(0, 0, SIZE, SIZE);

		Context.hud.fillStyle = Style.secondaryHighlight;

		for (let i=0;i<secondaryHighlight.length;i++) {
			square = Interface.xyFromSquare(secondaryHighlight[i]);
			Context.hud.fillRect(
				TILESIZE * square[0], TILESIZE * square[1],
				TILESIZE, TILESIZE,
			);
		}

		if (_debugMode) {
			Context.hud.fillStyle = Style.threatsHighlight;

			for (let i=0;i<threatsHighlights.length;i++) {
				square = Interface.xyFromSquare(threatsHighlights[i]);
				Context.hud.fillRect(
					TILESIZE * square[0], TILESIZE * square[1],
					TILESIZE, TILESIZE,
				);
			}

			Context.hud.fillStyle = Style.attacksHighlight;

			for (let i=0;i<attackHighlights.length;i++) {
				square = Interface.xyFromSquare(attackHighlights[i]);
				Context.hud.fillRect(
					TILESIZE * square[0], TILESIZE * square[1],
					TILESIZE, TILESIZE,
				);
			}
		}

		if (selectedTile==null) {
			Context.hud.restore();
			return;
		}

		Context.hud.fillStyle = Style.highlight;

		square = Interface.xyFromSquare(selectedTile);
		Context.hud.fillRect(
			TILESIZE * square[0], TILESIZE * square[1],
			TILESIZE, TILESIZE,
		);

		let engine = Engine.Current_Engine();

		for (let i=0;i<possible_moves.length;i++) {
			square = Interface.xyFromSquare(possible_moves[i]);

			Context.hud.save();
			if (engine.map[possible_moves[i]] == Pieces.empty) {
				Context.hud.fillStyle = Style.moveHighlightColor;
			}
			else {
				Context.hud.fillStyle = Style.moveAttackHighlightColor;
			}
			Context.hud.beginPath();
			Context.hud.arc(
				square[0] * TILESIZE + TILESIZE * .5,
				square[1] * TILESIZE + TILESIZE * .5,
				TILESIZE / 5,
				0, 2 * Math.PI,
			);
			Context.hud.fill();
			Context.hud.filter = 'blur(4px)';
			if (engine.map[possible_moves[i]] == Pieces.empty) {
				Context.hud.fillStyle = Style.secondaryMoveHighlightColor;
			}
			else {
				Context.hud.fillStyle = Style.secondaryMoveAttackHighlightColor;
			}
			Context.hud.stroke();
			Context.hud.restore();
		}

		Context.hud.restore();
	}

	const fps = 60;
	const frames = fps / 4;
	const tpf = 1000 / fps;
	function recur_slide(piece, location, velocity, interval, TILESIZE, callback) {

		Context.hud.drawImage(
			Style.sprites,
			0 + Style.pieceXOffset(Math.floor(piece)),
			0 + Style.pieceYOffset(Math.floor(piece)),
			45, 45,
			location[0] + 5, location[1] + 5,
			TILESIZE - 9, TILESIZE - 9,
		);

		if (interval == 0) {
			callback();
			return;
		}

		setTimeout(function (){
			Context.hud.clearRect(location[0], location[1], TILESIZE, TILESIZE);

			location[0] += velocity[0];
			location[1] += velocity[1];

			recur_slide(
				piece,
				location,
				velocity,
				interval - 1,
				TILESIZE,
				callback,
			);
		}, tpf);
	}
	function recur_fade(piece, x, y, interval, TILESIZE) {
		if (interval == 0) {
			animating = false;
			Context.animation.clearRect(x, y, TILESIZE, TILESIZE);
			return;
		}

		Context.animation.globalAlpha = interval / frames;

		const growth = 30;

		Context.animation.drawImage(
			Style.sprites,
			0 + Style.pieceXOffset(Math.floor(piece)),
			0 + Style.pieceYOffset(Math.floor(piece)),
			45, 45,
			x + 5 + growth * (interval / frames - 1) / 2,
			y + 5 + growth * (interval / frames - 1) / 2,
			(TILESIZE - 9) + growth * (1 - interval / frames),
			(TILESIZE - 9) + growth * (1 - interval / frames),
		);

		Context.animation.globalAlpha = 1;

		setTimeout(function (){
			Context.animation.clearRect(x, y, TILESIZE, TILESIZE);

			recur_fade(
				piece,
				x, y,
				interval - 1,
				TILESIZE,
			);
		}, tpf);
	}

	function slide_piece(engine, move, callback) {
		let piece = engine.map[move.source];

		engine.map[move.source] = null;

		let tilesize = Math.min(
			MAXSIZE, Math.min(
				Math.floor(
					window.innerWidth / (window.innerWidth < MAXSIZE ? 1.6 : 2.8)
				), window.innerHeight - 140
			)
		) / 8;

		let xy_source = Interface.xyFromSquare(move.source);
		let xy_dest = Interface.xyFromSquare(move.dest);

		if (flip_board) {
			xy_source[0] = 7 - xy_source[0];
			xy_source[1] = 7 - xy_source[1];
			xy_dest[0] = 7 - xy_dest[0];
			xy_dest[1] = 7 - xy_dest[1];
		}

		let location = [xy_source[0] * tilesize, xy_source[1] * tilesize];

		let a = Math.abs(xy_source[0] - xy_dest[0]);
		let b = Math.abs(xy_source[1] - xy_dest[1]);

		let speed = [
			a * tilesize / frames,
			b * tilesize / frames,
		];

		let velocity = [
			xy_source[0] < xy_dest[0] ? speed[0] : -speed[0],
			xy_source[1] < xy_dest[1] ? speed[1] : -speed[1],
		];

		render(engine);

		allow_render = false;
		animating = true;

		Sounds.Play('slide');

		recur_slide(
			piece,
			location,
			velocity,
			frames,
			tilesize,
			function() {
				engine.map[move.source] = piece;

				allow_render = true;

				setTimeout(function() {
					Sounds.Play(engine.map[move.dest] == Pieces.empty ? 'place' : 'capture');

					remove_piece(engine, move);

					callback();
				}, 100);
			},
		);
	}
	function remove_piece(engine, move) {
		let piece = engine.map[move.dest];

		if (piece == Pieces.empty) return;

		let tilesize = Math.min(
			MAXSIZE, Math.min(
				Math.floor(
					window.innerWidth / (window.innerWidth < MAXSIZE ? 1.6 : 2.8)
				), window.innerHeight - 140
			)
		) / 8;

		let xy_dest = Interface.xyFromSquare(move.dest);

		if (flip_board) {
			xy_dest[0] = 7 - xy_dest[0];
			xy_dest[1] = 7 - xy_dest[1];
		}

		animating = true;

		recur_fade(
			piece,
			xy_dest[0] * tilesize,
			xy_dest[1] * tilesize,
			frames,
			tilesize,
		);
	}


	self.Highlight = function(square) {
		selectedTile = square;

		drawHighlight();
	};
	self.Secondary_Highlight = function(square) {
		for (let i=0;i<secondaryHighlight.length;i++) {
			if (secondaryHighlight[i]==square) {
				secondaryHighlight.splice(i, 1);

				drawHighlight();
				return;
			}
		}

		secondaryHighlight.push(square);

		drawHighlight();
	};
	self.Threats_Highlight = function(threats, attacks) {
		threatsHighlights = threats;
		attackHighlights = attacks;
	};
	self.Clear_Highlights = function() {
		selectedTile = null;
		secondaryHighlight = [];

		drawHighlight();
	};
	self.Show_Possible_Moves = function(list) {
		if (list == null) return;

		possible_moves = list.slice();

		drawHighlight();
	};
	self.Debug = function(engine) {
		if (engine != null) {
			_debugMode = true;
			drawHighlight();
			render(engine);
			return;
		}
		_debugMode = !_debugMode;

		drawHighlight();
		render(Engine.Current_Engine());
	};

	self.Slide_Piece = function(engine, move, callback) {
		if (!allow_render) return;

		slide_piece(engine, move, callback);
	};

	self.Flip_Board = function(input) {
		if (!input) input = false;

		flip_board = input;
		Interface.Flip_Input(input);

		if (input) {
			document.getElementById('board-eval').className = 'w3-black w3-round-large chess-eval';
			document.getElementById('eval-black').className = 'w3-white chess-eval';
		}
		else {
			document.getElementById('board-eval').className = 'w3-white w3-round-large chess-eval';
			document.getElementById('eval-black').className = 'w3-black chess-eval';
		}
		Report.flip_board(input);

		render(Engine.Current_Engine());
		drawHighlight();
	};
	self.Draw_Board = function(engine) {
		render(engine);
		drawHighlight();
	};
	self.Draw = function() {
		render(Engine.Current_Engine());
		drawHighlight();
	};
} ();

const Client = new function() {
	let self = this;

	let is_playing = true;

	self.isWhite = true;

	self.Stop_Playing = function() {
		is_playing = false;
		Engine.Run_Ai_Against_Itself();
	};
	self.Start_Playing = function() {
		is_playing = true;
		Engine.Play_Against_Ai();
	};
	self.Is_Playing = function() {
		return is_playing;
	};
} ();

const Report = new function() {
	const self = this;
	const status = document.getElementById('ai-status');
	const decision = document.getElementById('ai-decision');
	const timeCounter = document.getElementById('timeCounter');
	const numOfLines = document.getElementById('numOfLines');
	const eval_container = document.getElementById('eval-black');
	const eval_text = document.getElementById('eval-text');
	const state = document.getElementById('state');
	const info = document.getElementById('xtra-info');
	const fen = document.getElementById('fen');
	const lastMove = document.getElementById('lastMove');
	let prev_decision;
	let prev_lastMove;
	let flipped = false;
	let last_eval;

	self.flip_board = function(value) {
		flipped = value;
		draw_evaluate(last_eval);
	};

	function draw_evaluate(evaluation) {
		const MIDPOINT = 12;

		if (flipped) {
			evaluation = -evaluation;
			evaluation = Math.ceil(evaluation * 100) / 100;
		}
		else {
			evaluation = Math.floor(evaluation * 100) / 100;
		}

		eval_text.innerHTML = `${flipped ? -evaluation : evaluation}`;

		if (evaluation == 0) {
			eval_text.style.opacity = '0';
		}
		else  if (evaluation > 0) {
			eval_text.style.opacity = '1';
			eval_text.style.color = flipped ? Style.white : Style.black;
			eval_text.style.top = '0px';
		}
		else {
			eval_text.style.opacity = '1';
			eval_text.style.color = flipped ? Style.black : Style.white;
			eval_text.style.top = `-40px`;
		}

		evaluation = Math.min(2 * MIDPOINT, Math.max(0, -evaluation + MIDPOINT));

		eval_container.style.height = `${evaluation / MIDPOINT * 50}%`;
	}

	self.status = function(s) {
		status.innerHTML = s;
	};
	self.decision = function(div) {
		if (prev_decision) prev_decision.remove();
		decision.appendChild(div);
		prev_decision = div;
	};
	self.timeCounter = function(s) {
		timeCounter.innerHTML = s;
	};
	self.numOfLines = function(s) {
		numOfLines.innerHTML = s;
	};
	self.evaluation = function(evaluation) {
		last_eval = evaluation;
		draw_evaluate(evaluation);
	};
	self.state = function(s) {
		state.innerHTML = s;
	};
	self.info = function(s) {
		info.innerHTML = s;
	};
	self.fen = function(s) {
		fen.innerHTML = s;
	};
	self.lastMove = function(div) {
		if (prev_lastMove) prev_lastMove.remove();
		lastMove.appendChild(div);
		prev_lastMove = div;
	};

	self.popup = function(s) {
		console.error(s);
	};

	self.copyToClipboard = str => {
		try {
		  const el = document.createElement('textarea');
		  el.value = str;
		  document.body.appendChild(el);
		  el.select();
		  document.execCommand('copy');
		  document.body.removeChild(el);
			Report.popup('Copied!');
		} catch (e) {
			Report.popup('Could not copy');
		}
	};
} ();


window.onload = function() {
	Sounds.load();

	Engine.Create_Board(Boards.regular);
	// Engine.Create_Board(Boards.middleGameTest);
	// Engine.Create_Board(Boards.endgameTest);
};
window.addEventListener('resize', Canvas.Draw, false);
