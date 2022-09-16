'use strict'

export const Canvas = new (function () {
  let self = this

  self.HUD_Shown_Time = 3

  const open_helper_info = () => {
    const help = document.getElementById('help-dialog')
    const main = document.getElementById('main-card-fade-away')

    if (!infomation_card_shown) {
      help.style.transform = 'scale(1)'
      help.style.opacity = 1
      infomation_card_shown = true
      hide_main_card()
      main.style.visibility = 'hidden'
    } else {
      help.style.transform = 'scale(2)'
      help.style.opacity = 0
      infomation_card_shown = false
      main.style.visibility = 'visible'
    }
  }

  let idleTimeout,
    is_shown = false,
    infomation_card_shown = false

  function interaction() {
    window.clearTimeout(idleTimeout)

    start_idle_delay()

    show_main_card()
  }
  this.show_display = () => {
    interaction()
  }
  function start_idle_delay(i = self.HUD_Shown_Time) {
    if (i <= 0) {
      hide_main_card()
      return
    }

    document.getElementById('hiding-card-timer').innerHTML = `${i}secs`

    idleTimeout = setTimeout(() => {
      start_idle_delay(i - 1)
    }, 1000)
  }
  function show_main_card() {
    if (infomation_card_shown || is_shown) return

    is_shown = true
    document.getElementById('main-card-fade-away').style.transform = 'scale(1)'
    document.getElementById('main-card-fade-away').style.opacity = 1
    document.getElementById('halt-canvas').style.transform =
      'scale(1)translateY(0px)'
    document.getElementById('halt-canvas').style.opacity = 1
  }
  function hide_main_card() {
    if (!is_shown) return

    is_shown = false
    document.getElementById('main-card-fade-away').style.transform = 'scale(2)'
    document.getElementById('main-card-fade-away').style.opacity = 0
    document.getElementById('halt-canvas').style.transform =
      'scale(2)translateY(100px)'
    document.getElementById('halt-canvas').style.opacity = 0
  }

  self.load = function (text) {
    document.getElementById('loader').style.display = 'inline-block'
    document.getElementById('board-container').style.display = 'none'
    document.getElementById('loader-status').innerHTML = text
  }
  self.open = function () {
    document.getElementById('loader').style.display = 'none'
    document.getElementById('board-container').style.display = 'inline-block'
  }

  self.set_controls = function (controls_input) {
    document.getElementById('info-button').onclick = function () {
      open_helper_info()
    }
    document.getElementById('info-exit-button').onclick = function () {
      open_helper_info()
    }
    interaction()

    const haltBtn = document.getElementById('halt-canvas')
    const halt_fnc = () => {
      if (haltBtn.className.includes('green')) {
        controls_input.start()
        haltBtn.className = haltBtn.className.replace('green', 'red')
        haltBtn.innerHTML = 'STOP'
      } else {
        controls_input.halt()
        haltBtn.className = haltBtn.className.replace('red', 'green')
        haltBtn.innerHTML = 'RESTART'
      }
    }
    haltBtn.onclick = halt_fnc

    document.addEventListener('mousemove', (e) => {
      interaction()
    })
    document.addEventListener('click', (e) => {
      interaction()
    })
    document.addEventListener(
      'keydown',
      (e) => {
        interaction()
        // e.preventDefault();
        // return controls_input.input(e.code, true);
      },
      false
    )
    document.addEventListener(
      'keyup',
      (e) => {
        interaction()
        if (e.code == 'Space') {
          halt_fnc()
        }
        // e.preventDefault();
        // return controls_input.input(e.code, false);
      },
      false
    )

    controls_input.ready()
  }

  const outputDialog = document.getElementById('output-text')
  const generationDialog = document.getElementById('generation-text')
  const statusDialog = document.getElementById('status-text')
  const entityDialog = document.getElementById('entity-text')
  self.output = function (str) {
    outputDialog.innerHTML = str
  }
  self.generation = function (str) {
    generationDialog.innerHTML = str
  }
  self.status = function (str) {
    statusDialog.innerHTML = str
  }
  self.entity = function (str) {
    entityDialog.innerHTML = str
  }
})()
