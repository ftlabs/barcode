'use strict';
const crypto = require('crypto');

class ActionTimer {

	constructor (start = true) {
    this.hash = this.createHash();
    this.originTime = this.getTime();

    if(start){
      this.divider();
    }
  }

  createHash(){
    return crypto.createHash('md5').update(new Date().toString()).digest("hex").slice(-8);
  }

  getTime(){
    return new Date().getTime();
  }
  
	log (message) {
		console.log(this.hash, ':', (this.getTime() - this.originTime) + 'ms', '-', message);
  }

  divider(){
    console.log('-------------');
  }
  
}

module.exports = ActionTimer;
