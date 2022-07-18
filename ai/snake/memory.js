
export class Memory {
  /**
  * @param {number} maxMemory
  */
  constructor(maxMemory) {
    this.maxMemory = maxMemory;
    this.samples = new Array();
  }

  /**
  * @param {Array} sample
  */
  addSample(sample) {
    this.samples.push(sample);
    if (this.samples.length > this.maxMemory) {
      let [state,,, nextState] = this.samples.shift();
      state.dispose();
      nextState.dispose();
    }
  }

  /**
  * @param {number} nSamples
  * @returns {Array} Randomly selected samples
  */
  sample(nSamples) {
    let random = new Array(nSamples);

    for (let i = 0; i < nSamples; i++) {
      random[i] = this.samples[i];
    }

    return this.shuffle(random);
  }

  shuffle(array) {
    let currentIndex = array.length, randomIndex;

      // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex--);

        // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]
      ];
    }

    return array;
  }
}
