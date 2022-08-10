/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in Elijah Storm's Portfolio Project

import '/portfolio/portfolio.data.js'
import { CinematicBackground } from '/portfolio/display/main.js'
import { CharacterClass, ActorClass, NormalBeeActor } from '/ai/bees/bees.js'
import { Flowers } from '/ai/bees/flowers.js'

const CINEMATIC_BACKGROUND = new CinematicBackground()

function validateEmail(email) {
  // /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
}
function CONTACT() {
  const err = (msg) => {
    document.getElementById('contact-error').style.display = 'block'
    document.getElementById('contact-error').innerHTML = msg
  }
  let name, body, sender

  name = document.getElementById('contact-name').value
  sender = document.getElementById('contact-email').value
  body = document.getElementById('contact-message').value

  if (name == '' || body == '' || sender == '') {
    err('Make sure to fill all forms')
    return
  }
  if (name.length > 100 || body.length > 1500) {
    err('Your messge is too long')
    return
  }

  err('')
  document.getElementById('contact-error').style.display = 'none'

  //   socket.emit('email', {
  //     email: sender,
  //     name: name,
  //     body: body,
  //   })
}

var title_box_alert = function (updated) {
  var old = document.title
  this.time = 1000
  var kill = false
  var self = this
  var toggle = true
  this.stop = function () {
    kill = true
  }
  var refresh_fnc = function () {
    if (kill) {
      document.title = old
      return
    }
    if (toggle) {
      document.title = updated
      toggle = false
    } else {
      document.title = old
      toggle = true
    }
    setTimeout(refresh_fnc, self.time)
  }
  refresh_fnc()
}
var LOADED = false
var onFinishedLoadingList = []
function onFinishedLoading(fnc) {
  if (onFinishedLoadingList == null) return
  onFinishedLoadingList.push(fnc)
}
window.onload = function () {
  LOADED = true

  for (var i in onFinishedLoadingList) {
    onFinishedLoadingList[i]()
  }
  onFinishedLoadingList = null
}

// NormalBeeActor.dialog_options = {
// 	idle: true,
// };
const eunbyeul = new NormalBeeActor(
  CharacterClass.random_x(),
  CharacterClass.random_y()
)
const doungdoungei = new NormalBeeActor(
  CharacterClass.random_x(),
  CharacterClass.random_y()
)
// const kimchi = new NormalBeeActor(
// 	CharacterClass.random_x(),
// 	CharacterClass.random_y(),
// );

NormalBeeActor.start_ai()

const quotes = [
  {
    quote: "Don't worry, be happy.",
    person: 'Bobby McFerrin',
  },
  {
    quote: 'Hakuna Matata… means no worries!',
    person: 'Elton John and Tim Rice',
  },
  {
    quote: 'I smile because I have no idea what is going on.',
    person: 'Unknown',
  },
  {
    quote: 'There is only one happiness in this life, to love and be loved.',
    person: 'George Sand',
  },
  {
    quote:
      'Blessed are they who can laugh at themselves for they shall never cease to be amused.',
    person: 'Unknown',
  },
  {
    quote: 'Hope is the only thing stronger than fear.',
    person: 'Suzanne Collins',
  },
  {
    quote: 'The poorest man is he whose only wealth is money.',
    person: 'Unknown',
  },
  {
    quote: 'The most simple things can bring the most happiness.',
    person: 'Izabella Scorupco',
  },
  {
    quote:
      "Now and then it's good to pause in our pursuit of happiness and just be happy.",
    person: 'Guillaume Apollinaire',
  },
  {
    quote: "Don't cry because it is over, smile because it happened.",
    person: 'Dr. Seuss',
  },
  {
    quote:
      'For every minute you are angry you lose sixty seconds of happiness.',
    person: 'Ralph Waldo Emerson',
  },
  {
    quote: 'Happiness is a warm puppy.',
    person: 'Charles Schulz',
  },
  {
    quote: 'Sanity and happiness are an impossible combination.',
    person: 'Mark Twain',
  },
  {
    quote:
      "If it weren't for the mistakes I've made, I wouldn't be where I am today.",
    person: 'Unknown',
  },
  {
    quote: 'Celebrate every tiny victory.',
    person: 'Unknown',
  },
  {
    quote: 'If you cannot do great things, do small things in a great way.',
    person: 'Napoleon Hill',
  },
  {
    quote:
      "If you think nobody cares if you're alive, try missing a couple of car payments.",
    person: 'Unknown',
  },
  {
    quote:
      "There's nothing that can help you understand your beliefs more than trying to explain them to an inquisitive child.",
    person: 'Frank A. Clark',
  },
  {
    quote: 'Whatever you are, be a good one.',
    person: 'Abraham Lincoln',
  },
  {
    quote: 'Winning is not everything, but wanting to win is.',
    person: 'Vince Lombardi',
  },
  {
    quote: 'Wherever you go, go with all your heart.',
    person: 'Confucius',
  },
  {
    quote: 'Just keep swimming, just keep swimming.',
    person: 'Dory, Finding Nemo',
  },
  {
    quote: "It always seems impossible until it's done.",
    person: 'Nelson Mandela',
  },
  {
    quote:
      'Be faithful in small things because it is in them that your strength lies.',
    person: 'Mother Teresa',
  },
  {
    quote: 'Life is either a great adventure or nothing.',
    person: 'Helen Keller',
  },
  {
    quote: "If you're not part of the solution, be part of the problem!",
    person: 'Unknown',
  },
  {
    quote: 'The first five days after the weekend are always the hardest.',
    person: 'Unknown',
  },
  {
    quote:
      'Just when the caterpillar thought her life was over, she began to fly.',
    person: 'Barbara Haines Howett',
  },
]

const beeConverse = (iteration = 0) => {
  const bee = Math.random() > 0.5 ? eunbyeul : doungdoungei

  const quote = quotes[Math.floor(quotes.length * Math.random())]
  bee.speech =
    quote.person == 'Unknown' ? quote.quote : `${quote.quote} - ${quote.person}`

  setTimeout(() => {
    bee.speech = null

    setTimeout(
      () => beeConverse(Math.min(iteration + 1, 10)),
      Math.random() * 5000 * iteration + 5000
    )
  }, 5000)
}

setTimeout(beeConverse, 5000)

const flowers = []
const bees = [eunbyeul, doungdoungei]
const flower_types = ['tulip', 'windmill', 'sunflower', 'trumpet']

document.body.onscroll = () => {
  bees.forEach((bee) => {
    bee.__window_offset = {
      x: window.scrollX,
      y: window.scrollY,
    }
  })
  CINEMATIC_BACKGROUND.update_camera()
}

bees.forEach((bee) => {
  bee.onclick = () => {
    window.location = '/ai/bees'
  }
  bee.sight_distance = 1000
})

const chase_flowers = (bee) => {
  return () => {
    const target = bee.best_untargeted_flower(flowers)

    if (target == null) {
      bee.search()
      return
    }

    bee.chase(target)
  }
}
const search_function = (bee) => bee.search

window.addEventListener('click', (e) => {
  let offsetX = 15
  let offsetY = 85

  if (window.innerWidth < 600) {
    offsetX = 20
    offsetY = 60
  }

  const flower = new Flower(
    flower_types[Math.floor(Math.random() * flower_types.length)],
    e.clientX - offsetX,
    e.clientY - offsetY,
    flowers
  )
  flower.__movement_slide_off = true
  flower.__window_offset = {
    x: window.scrollX,
    y: window.scrollY,
  }
  flower.move()
})

setInterval(() => {
  let act_function = search_function

  if (flowers.length != 0) {
    act_function = chase_flowers
  }

  bees.forEach((bee) => {
    bee.act = act_function(bee)

    setTimeout(() => {
      bee.run()
    }, Math.random() * bees.length * 1000)
  })

  flowers.forEach((f) => f.run())
}, bees.length * 1500)

function timestamp() {
  var str = ''
  for (var i in arguments) {
    str += arguments[i] + ' '
  }
  console.log(new Date().toLocaleTimeString(), '->', str)
}

document
  .querySelectorAll('input, textarea, .w3-button, button')
  .forEach((el) => {
    if (el.onclick != null) return
    el.onclick = (e) => e.stopImmediatePropagation()
  })

document.getElementById('send-message-btn').onclick = function (e) {
  CONTACT()
  e.stopImmediatePropagation()
}

class Flower extends ActorClass {
  constructor(type, x, y, list) {
    super(`flower-${type}`, x, y)

    this.#list = list
    list.push(this)
  }

  #list

  act = () => {
    this.life -= bees.length * 2
  }

  pollen = 0

  death_action = () => {
    this.#list.splice(this.#list.indexOf(this), 1)
  }
}
