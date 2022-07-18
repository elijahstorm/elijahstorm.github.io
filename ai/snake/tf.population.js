
class Agent {
	constructor(
		brain = new NeuralNetwork(
			null,
			new NeuralNetworkLayer(2),
			new NeuralNetworkLayer(2),
			new NeuralNetworkLayer(1)
		),
	) {
		this.brain = brain;
		this.isAlive = true;
		this.position = 0;
		this.score = 0;
	}

	dispose() {
		this.brain.dispose();
	}

	kill() {
		this.isAlive = false;
	}

	act(target) {
		const output = this.brain.predict([this.position, target])
			.dataSync();

		console.log('logging predict output:', output[0]);
		console.log(output);
		console.log('______________________________');
	}

	static fromParents(a, b) {
		return new Agent(NeuralNetwork.fromParents(a.brain, b.brain));
	}
}

class NeuralNetwork {
	constructor(weights, ...layers) {
		this.inputLayerSize = layers[0].size;
		this.layers = layers;

		this.weights = weights || layers
			.slice(0, layers.length - 1)
			.map((layer, index) => {
				const layerSizeNext = layers[index + 1].size;

				return tf.randomUniform([layer.size, layerSizeNext], -1, 1);
			});
	}

	dispose() {
		this.weights
			.forEach(w => w.dispose());
	}

	getWeights() {
		return this.weights
			.map(weights => weights.dataSync());
	}

	predict(input) {
		return tf.tidy(() => {
			const inputLayer = tf.tensor(input, [1, this.inputLayerSize]);

			return this.weights.reduce((layer, weights, index) => {
				const fn = this.layers[index].fn;
				const result = layer.matMul(weights);

				return result[fn]()
					.sub(tf.scalar(0.5));
			}, inputLayer);
		});
	}

	static get MUTATION_PROBABILITY() {
		return 0.05;
	}

	static fromParents(a, b) {
		const weightsA = a.getWeights();
		const weightsB = b.getWeights();
		const weightsC = new Float32Array(weightsA.length).fill()
			.map(_ => Math.random() * 2 - 1);

		const weights = new Array(weightsA.length).fill()
			.map((_, index) => {
				const a = weightsA[index];
				const b = weightsB[index];

				return new Float32Array(a.length).fill()
					.map((_, weightIndex) => {
						if (Math.random() < NeuralNetwork.MUTATION_PROBABILITY) {
							return Math.random() * 2 - 1;
						}

						return Math.random() < 0.5
							? a[weightIndex]
							: b[weightIndex];
					});
			})
			.map((arr, index) => tf.tensor(arr, a.weights[index].shape));

		return new NeuralNetwork(weights, ...a.layers);
	}
}

class NeuralNetworkLayer {
	constructor(size, fn = 'sigmoid') {
		this.fn = fn;
		this.size = size;
	}
}

export class Population {
	constructor(size) {
		this.agents = new Array(size).fill().map(_ => new Agent());
		this.generation = 0;
		this.size = size;
	}

	get isAlive() {
		return this.agents.some(a => a.isAlive);
	}

	dispose() {
		this.agents.forEach(a => a.dispose());
	}

	next() {
		const agents = this.agents;
		const parents = this.agents
			.sort((a, b) => b.score < a.score ? -1 : 1)
			.slice(0, 2);

		this.agents = this.agents.map(() => Agent.fromParents(...parents));

		agents.forEach(a => a.dispose());

		++this.generation;
	}

	act() {
		console.log('acting');

		this.agents.forEach((actor) => {
			agent.act();
		});
	}

	setAgentPosition(position) {
		this.agents.forEach((agent) => {
			agent.position = position;
		});
	}
}


window.addEventListener('beforeunload', () => {
	population.dispose();
});
