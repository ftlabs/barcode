'use strict';

// A thread-safe flag.
// If flag.isSetOnByMe() returns true it guarantees the flag was set to on and *you* set it (all as part of that one call)
// (rather than via an unlucky race condition with another thread).
// This is not super-safe, since another thread could always invoke flag.setToOff() and then re-run flag.isSetOnByMe()
// but that is not playing nice.

const OFF = 0;
const ON  = 1;

class MutexFlagClass {

	constructor () {
		// via https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/compareExchange
		// create a 1 byte array. 0 == false, 1 == true
		const buffer = new SharedArrayBuffer(1);
		const byteArray = new Uint8Array(buffer);
		byteArray[0] = OFF;
	}

	isOn() {
		return (byteArray[0] === ON);
	}

	setToOff() {
		byteArray[0] = OFF;
	}

	isSetOnByMe(){
		const prevState = Atomics.compareExchange(byteArray, 0, OFF, ON);
		return (prevState === OFF);
	}
}

module.exports = MutexFlagClass;
