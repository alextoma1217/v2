class TileIdentifier {
	constructor(matrix, tileSize = 20) {
		this.matrix = matrix;
		this.tileSize = tileSize;
	}

	toIndex(pos) {
		return Math.floor(pos / this.tileSize);
	}

	toIndexRange(pos1, pos2) {
		const pMax = Math.ceil(pos2 / this.tileSize) * this.tileSize;
		const range= [];
		let pos = pos1;
		do {
			range.push(this.toIndex(pos));
			pos += this.tileSize;
		} 
		while (pos < pMax);
		return range;
	}

	getByIndex(indexX, indexY) {
		const tileType = this.matrix.get(indexX, indexY);
		if (tileType) {
			const y1 = indexY * this.tileSize;
			const y2 = y1 + this.tileSize;
			const x1 = indexX * this.tileSize;
			const x2 = x1 + this.tileSize;
			return {
				tileType,
				y1,
				y2,
				x1,
				x2,
			};
		}
	}

	tileTypeByPos(posX, posY) {
		return this.getByIndex(
			this.toIndex(posX),
			this.toIndex(posY));
	}

	tileTypeByRange(x1, x2, y1, y2) {
		const matches = [];
		this.toIndexRange(x1, x2).forEach(indexX => {
			this.toIndexRange(y1, y2).forEach(indexY => {
				const match = this.getByIndex(indexX, indexY);
				if (match) {
					matches.push(match);
				}
			});
		});

		return matches;
	}
}

class TileCollider {
	constructor(tileMatrix) {
	this.tiles = new TileIdentifier(tileMatrix);
	}


	setObjects(walker, match){
	walker.prompt = 'active';
	let room = walker.room;
	let seat = walker.seat;  				
	walker.seat = match.tileType.seat;
	walker.table = true;
	walker.room = match.tileType.room;
	}



	checkYWalker(walker) {

		if(walker.pos.y<10){
            walker.pos.y=10;
			return;
		}


		let y;
		if (walker.vel.y > 0) {
			y = walker.pos.y + walker.size.y;
		} 

		else if (walker.vel.y < 0) {
			y = walker.pos.y;
		} 
		else {
			return;
		}

		const matches = this.tiles.tileTypeByRange(
			walker.pos.x, walker.pos.x + walker.size.x, 
			y, y);
 // console.log('matchesXXXXXXXXXXXXXX');
	// 	console.log(matches);

		matches.forEach(match => {
			if (!match) {
			return;
			}


			 if (match.tileType.name === 'seat_in') {
			 	return;
			}






		
			if (match.tileType.name === 'seat') {

				
				this.setObjects(walker, match);
				return;

				// let room = walker.room;
				// let seat = walker.seat;

				// // console.log('seattat in Y');

				// // socket.emit('createGame', { username, room, seat, user_id });

				// walker.seat = match.tileType.seat;
				// walker.room = match.tileType.room;
				// return;
			}


		    if (match.tileType.name === 'table') {		    	

		    	 this.setObjects(walker, match);

		    	
				return;
			}

	
			if (walker.vel.y > 0) {

				if (walker.pos.y + walker.size.y > match.y1) {
					
					walker.pos.y = match.y1 - walker.size.y;
					walker.vel.y = 0;
					// walker.alreadyJumped = false;
				}
			} 
			else if (walker.vel.y < 0) {

				if (walker.pos.y < match.y2) {
					walker.pos.y = match.y2;
					walker.vel.y = 0;
				}
			}
		});
		
	}

	checkXWalker(walker) {
		if(walker.pos.x<10){
			walker.pos.x=10;
			return;
		}
		let x;
		if (walker.vel.x > 0) {
			x = walker.pos.x + walker.size.x;
		} 

		else if (walker.vel.x < 0) {
			x = walker.pos.x;
		} 
		else {
			return;
		}

		const matches = this.tiles.tileTypeByRange(
			x, x, 
			walker.pos.y, walker.pos.y + walker.size.y);

   //            console.log('matches');
			// console.log(matches);

		matches.forEach(match => {
			if (!match) {
			return;
			}
		  // console.log(match.tileType.name);


		 	 if (match.tileType.name === 'seat_in') {
			 	return;
			}



		
			if (match.tileType.name === 'seat') {

				// console.log("ddddddddddddddddd");

				this.setObjects(walker, match);
				return;
			}


					if (match.tileType.name === 'table') {

			        this.setObjects(walker, match);
				return;
			}



			if (walker.vel.x > 0) {
				if (walker.pos.x + walker.size.x > match.x1) {
					walker.pos.x = match.x1 - walker.size.x;
					walker.vel.x = 0;
				}
			} 
			else if (walker.vel.x < 0) {
				if (walker.pos.x < match.x2) {
					walker.pos.x = match.x2;
					walker.vel.x = 0;
				}
			}
		});
		
	}
}

module.exports = TileCollider;