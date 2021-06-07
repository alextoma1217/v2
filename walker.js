let Vector = require( __dirname + '/vector.js');

class WalkerClass {
	constructor(id, walkerNumber, username, user_id) {
		this.id = id;
		this.username = username;
		this.userid = user_id;		
		this.size = new Vector(14, 16);
		this.number = "" + Math.floor(50 * Math.random());
		this.vel = new Vector(0, 0);
		this.distance = 0;
		this.prompt = false;
		this.seat = null;
		this.room = null;
		this.table = null;
		this.state = true;
		this.num = walkerNumber;		
		this.message = '';
		this.max_width = 900;
		this.max_height = 460

		 let num = this.number % 4;
		 let plusOrMinus = Math.random() < 0.5 ? -1 : 1;	

		if (num === 0) {
			this.pos = new Vector(48, 280);
			this.direction = 1;
		} 
		else if (num === 1) {
			this.pos = new Vector(424, 280);
			this.direction = -1;
		} 
		else if (num === 2) {
			this.pos = new Vector(160, 232);
			this.direction = 1;
		} 
		else {
			this.pos = new Vector(288, 232);
			this.direction = -1;
		}
		
	}

	   randomInteger(min, max) {  
       let rand = min - 0.5 + Math.random() * (max - min + 1);
        return Math.round(rand);
       }



 	moveRight() {
 		if(this.pos.x>this.max_width - 16){
            this.pos.x = this.max_width - 17;
 			return;
 		}

 		this.vel.set(2, this.vel.y);
 		this.direction = 1;
 	}

 	moveLeft() {
 		this.vel.set(-2, this.vel.y);
 		this.direction = -1;
 	}

 	moveUp() {

 	 		this.vel.set(this.vel.x, -2);
 	 }

 	moveDown() {
 		if(this.pos.y> this.max_height - 80){
            this.pos.y = this.max_height - 81;
 			return;
 		}
  		this.vel.set(this.vel.x, +2);
 	}


 	cancelHorizontal() {
 		this.vel.set(0, this.vel.y);
 	}


 	cancelVertical() {
 		this.vel.set(this.vel.x, 0);
 	}


	updateX() {
		this.pos.x += this.vel.x;
		this.distance += Math.abs(this.vel.x);
	}

	updateY() {
		this.pos.y += this.vel.y;
		this.distance += Math.abs(this.vel.y);
	}

}

module.exports = WalkerClass;
