import { Vector } from '/ai/vector.js'

;('use strict')

const DEFAULT_WEIGHTS = {
  sep: 0.5,
  ali: 0.3,
  coh: 0.3,
  tgt: 1.0,
  avd: 1.5,
}

export class Ai {
  constructor(boids) {
    this.#_boids = boids

    if (document.getElementById('board-container') == null) return
    // this.#controller = new Controller(this);
  }

  #_boids = []

  dispose = () => {
    // this.#controller.dispose();
  }
  // #controller;
  #weights = {
    sep: DEFAULT_WEIGHTS.sep,
    ali: DEFAULT_WEIGHTS.ali,
    coh: DEFAULT_WEIGHTS.coh,
    tgt: DEFAULT_WEIGHTS.tgt,
    avd: DEFAULT_WEIGHTS.avd,
  }
  set weights(opts) {
    this.#weights.sep = opts.sep || DEFAULT_WEIGHTS.sep
    this.#weights.ali = opts.ali || DEFAULT_WEIGHTS.ali
    this.#weights.coh = opts.coh || DEFAULT_WEIGHTS.coh
    this.#weights.tgt = opts.tgt || DEFAULT_WEIGHTS.tgt
    this.#weights.avd = opts.avd || DEFAULT_WEIGHTS.avd
  }
  get weights() {
    return this.#weights
  }

  static createVector = (x, y) => {
    return new Vector(x, y)
  }
  vector = (x, y) => Ai.createVector(x, y)
  static VectorType = Vector

  #_loss = 0
  get loss() {
    return this.#_loss
  }
  set loss(value) {
    this.#_loss = value
  }

  get boids() {
    return this.#_boids
  }

  flock = (actor, boids = this.boids, target = null, enemies = []) => {
    const sep = this.separate(actor, boids) // Separation
    const ali = this.align(actor, boids) // Alignment
    const coh = this.cohesion(actor, boids) // Cohesion
    const tgt = this.target(actor, target) // Target
    const avd = this.avoid(actor, enemies) // Avoid

    if (target == null) {
      tgt.mult(0.3)
    }

    return {
      sep: sep.mult(this.#weights.sep),
      ali: ali.mult(this.#weights.ali),
      coh: coh.mult(this.#weights.coh),
      tgt: tgt.mult(this.#weights.tgt),
      avd: avd.mult(this.#weights.avd),
    }
  }

  // Separation
  // Method checks for nearby boids and steers away
  separate = function (actor, boids = this.boids) {
    let desiredseparation = 25.0
    let steer = Ai.createVector(0, 0)
    let count = 0
    // For every boid in the system, check if it's too close
    for (let i = 0; i < boids.length; i++) {
      let d = actor.position.dist(boids[i].position)
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if (d > 0 && d < desiredseparation) {
        // Calculate vector pointing away from neighbor
        let diff = actor.position.sub(boids[i].position)
        diff.normalize()
        diff.div(d) // Weight by distance
        steer.add(diff)
        count++ // Keep track of how many
      }
    }
    // Average -- divide by how many
    if (count > 0) {
      steer.div(count)
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize()
      steer.mult(actor.maxspeed)
      steer.sub(actor.velocity)
      steer.limit(actor.maxforce)
    }
    return steer
  }

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  align = function (actor, boids = this.boids) {
    let sum = Ai.createVector(0, 0)

    boids.forEach((boid) => sum.add(boid.velocity))

    sum.div(boids.length)
    sum.normalize()
    sum.mult(actor.maxspeed)

    let steer = sum.sub(actor.velocity)
    steer.limit(actor.maxforce)

    return steer
  }

  // Cohesion
  // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
  cohesion = function (actor, boids = this.boids) {
    let sum = Ai.createVector(0, 0)

    boids.forEach((boid) => sum.add(boid.position))

    sum.div(boids.length)

    return actor.seek(sum)
  }

  // Target
  // Push bee towards it's target location, otherwise
  // average the center of the screen, to have the bees avoids walls
  target = function (actor, target) {
    return actor.seek(
      target == null
        ? Ai.createVector(window.innerWidth / 2, window.innerHeight / 2)
        : target.position.clone()
    )
  }

  // Avoid
  // Flees enemies
  avoid = function (actor, enemies) {
    const angle = actor.find_flee_angle(enemies)

    return actor.seek(
      Ai.createVector(
        actor.x + actor.sight_distance * Math.cos(angle),
        actor.y + actor.sight_distance * Math.sin(angle)
      )
    )
  }
}

class Controller {
  constructor(ai) {
    this.ai = ai || new Ai([])

    const debug_controllers = document.createElement('div')
    debug_controllers.id = 'debug-controller'
    debug_controllers.style.fontSize = 'x-small'
    debug_controllers.className = 'w3-row'

    const data_holder = document.createElement('div')
    data_holder.style.display = 'none'

    const create_data_element = (name, initial_data) => {
      const element = document.createElement('input')
      element.id = `debug-ai-${name}-data`
      element.type = 'number'
      element.value = initial_data
      this.#values[name] = initial_data
      return element
    }
    const create_interaction_element = (name) => {
      const initial_data = DEFAULT_WEIGHTS[name]

      const data_value = create_data_element(name, initial_data)
      data_holder.appendChild(data_value)

      const element = document.createElement('div')
      element.className = `w3-card w3-cell ease hover-show w3-hover-white w3-round w3-padding w3-margin`
      element.style.margin = 'auto'
      element.id = `debug-ai-${name}-data`

      const button_up = document.createElement('div')
      button_up.style.width = '100%'
      button_up.className = 'w3-button ease w3-hover-green w3-round w3-blue'
      button_up.onclick = () => {
        data_value.value =
          parseFloat(data_value.value) + Controller.MIN_INCREMENT
        number_display.innerHTML = data_value.value
        this.#values[name] = parseFloat(data_value.value)
        number_display.innerHTML = parseInt(10 * data_value.value) / 10
        this.update()
      }

      const title = document.createElement('div')
      title.style.textTransform = 'uppercase'
      title.style.width = '100%'
      title.innerHTML = name

      const number_display = document.createElement('div')
      number_display.style.width = '100%'
      number_display.innerHTML = data_value.value

      const arrow_up = document.createElement('i')
      arrow_up.className = 'fa fa-arrow-up'
      button_up.appendChild(arrow_up)

      const button_down = document.createElement('div')
      button_down.style.width = '100%'
      button_down.className = 'w3-button ease w3-hover-green w3-round w3-red'
      button_down.onclick = () => {
        data_value.value =
          parseFloat(data_value.value) - Controller.MIN_INCREMENT
        number_display.innerHTML = data_value.value
        this.#values[name] = parseFloat(data_value.value)
        number_display.innerHTML = parseInt(10 * data_value.value) / 10
        this.update()
      }

      const arrow_down = document.createElement('i')
      arrow_down.className = 'fa fa-arrow-down'
      button_down.appendChild(arrow_down)

      element.appendChild(button_up)
      element.appendChild(number_display)
      element.appendChild(button_down)

      return element
    }

    debug_controllers.appendChild(data_holder)

    for (const label in DEFAULT_WEIGHTS) {
      debug_controllers.appendChild(create_interaction_element(label))
    }

    document.getElementById('board-container').appendChild(debug_controllers)

    this.#container_display = debug_controllers
  }

  static MIN_INCREMENT = 0.1

  ai

  #container_display

  #values = {}

  update = () => {
    this.ai.weights = this.#values
  }

  dispose = () => {
    this.#container_display.remove()
    this.#values = null
  }
}
