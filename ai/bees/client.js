/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in Elijah Storm's Portfolio Project

import { Canvas } from '/ai/bees/canvas.js'
import {
  BeeTypes,
  CharacterClass,
  NormalBeeActor,
  HoneycombActor,
  EnemyWaspActor,
  GhostActor,
  EnemyAbstractHoneycombActor,
} from '/ai/bees/bees.js'
import { Flowers } from '/ai/bees/flowers.js'
;('use strict')

const FRAMES_PER_SECOND = 1
const TIME_PER_FRAME = 1000 / FRAMES_PER_SECOND
const STARTING_BEES = 24
const STARTING_ENEMIES = 6

class Program {
  constructor() {
    this.#bee_types[BeeTypes.Normal] = NormalBeeActor
    this.#bee_types[BeeTypes.Honeycomb] = HoneycombActor
    this.#bee_types[BeeTypes.FlyingUp] = EnemyWaspActor
    this.#bee_types[BeeTypes.Towards] = GhostActor
    this.#bee_types[BeeTypes.AbstractHoneycomb] = EnemyAbstractHoneycombActor

    const honeycombX = CharacterClass.middle_x()
    const honeycombY = CharacterClass.random_y()

    const ab_honeycombX = CharacterClass.random_right()
    const ab_honeycombY = CharacterClass.random_y()

    const DISTANCE_FROM_HONEYCOMB = 200

    NormalBeeActor.start_ai(this.#bees)

    this.#_hive = this.create_actor(BeeTypes.Honeycomb, honeycombX, honeycombY)
    // this.create_actor(BeeTypes.AbstractHoneycomb, ab_honeycombX, ab_honeycombY);

    for (let i = 0; i < STARTING_BEES; i++) {
      this.create_actor(
        BeeTypes.Normal,
        honeycombX +
          (Math.random() * DISTANCE_FROM_HONEYCOMB -
            DISTANCE_FROM_HONEYCOMB / 4),
        honeycombY +
          (Math.random() * DISTANCE_FROM_HONEYCOMB -
            DISTANCE_FROM_HONEYCOMB / 4),
        this.#bees
      )
    }

    for (let i = 0; i < STARTING_ENEMIES; i++) {
      this.create_actor(
        BeeTypes.FlyingUp,
        Math.random() < 0.5
          ? CharacterClass.random_right()
          : CharacterClass.random_left(),
        CharacterClass.random_y(),
        this.#enemies
      )
    }

    this.create_actor(
      BeeTypes.Towards,
      CharacterClass.middle_y(),
      CharacterClass.middle_y(),
      this.#other_actors
    )

    this.start()

    this.#flowers = new Flowers()
  }

  static generation = 0

  #bee_types = {}
  create_actor = (type, x, y, list) => {
    const actor = new this.#bee_types[type](x, y, this)

    if (list != null) {
      list.push(actor)
    }

    return actor
  }

  #bees = []
  get_bees = () => {
    return this.#bees
  }
  #enemies = []
  get_enemies = () => {
    return this.#enemies
  }
  #other_actors = []
  get_other_actors = () => {
    return this.#other_actors
  }

  #flowers
  get_flowers = () => {
    return this.#flowers.actors
  }

  #_hive
  get_hive = () => {
    return this.#_hive
  }

  start = () => {
    if (this.#clock_ticker) return

    this.#clock_ticker = true

    this.#set_status('running')

    this.#reflow()
  }
  halt = () => {
    this.#clock_ticker = false

    this.#set_status('halted')
  }
  game_over = (status) => {
    this.#clock_ticker = false

    this.#set_status(status)

    Canvas.show_display()
    const haltBtn = document.getElementById('halt-canvas')
    const restart = function () {
      const container = document.getElementById('bees')

      while (container.children.length != 0) {
        container.children[0].remove()
      }

      Canvas.set_controls(new Program())

      haltBtn.className = haltBtn.className.replace('green', 'red')
      haltBtn.innerHTML = 'STOP'
    }

    haltBtn.className = haltBtn.className.replace('red', 'green')
    haltBtn.innerHTML = 'RESTART'

    haltBtn.onclick = restart

    setTimeout(restart, TIME_PER_FRAME * Canvas.HUD_Shown_Time)
  }
  #_status = 'loading'
  status = () => this.#_status
  #set_status = (input) => {
    Canvas.status(input)

    this.#_status = input
  }

  #clock_ticker = false
  #iteration = 0
  #reflow = () => {
    if (!this.#clock_ticker) return

    setTimeout(this.#run, TIME_PER_FRAME * 1.5)
  }
  #run = () => {
    if (!this.#clock_ticker) return

    Canvas.output(NormalBeeActor.ai.loss)
    Canvas.entity(this.#bees.length)

    if (this.#bees.length <= 0) {
      this.game_over('dead')

      return
    }
    if (this.#enemies.length <= 0) {
      this.game_over('win')

      return
    }

    this.#iteration++

    if (this.#iteration == 2 || this.#iteration == 9) {
      this.create_actor(
        BeeTypes.Towards,
        CharacterClass.middle_y(),
        CharacterClass.middle_y(),
        this.#other_actors
      )
    }

    this.#enemies.forEach((bee) => bee.run())
    this.#other_actors.forEach((bee) => bee.run())
    this.#bees.forEach((bee) => bee.run())

    this.#flowers.run()

    this.#reflow()
  }

  ready = () => {
    Canvas.open()
    Canvas.entity(0)
    Canvas.output(NormalBeeActor.ai.loss)
    Canvas.generation(++Program.generation)

    this.start()
  }
}

window.onload = function () {
  Canvas.set_controls(new Program())

  Canvas.open()
}
