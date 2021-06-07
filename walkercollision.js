let Vector = require( __dirname + '/vector.js');

class PlayerCollider {
	constructor() {
		this.playerPositions = [];
	}

	add(playerPositions) {
		this.playerPositions.push(playerPositions);
	}

}

module.exports = PlayerCollider;