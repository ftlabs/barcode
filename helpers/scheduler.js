const { processEnv } = require('./utils');
let lastSentUpdate = 0;
const schedule = processEnv('SCHEDULE', {default: '' } ).split(',');

function canSend() {
	const checkTime = new Date().getHours();
	const isScheduled = schedule.find(time => {
		return parseInt(time) === checkTime;
	});
	
	if(isScheduled && lastSentUpdate !== checkTime) {
		lastSentUpdate = checkTime;
		return true;
	}

	return false;
}

module.exports = {
	onSchedule: canSend
}