const qAccessFlag = new( require('./mutexFlag') );
const queue = [];

function addItemToQueue(item) {
	queue.push(item);
	processQueue();
}

async function processQueue() {
	if( qAccessFlag.isSetOnByMe() ) {
		console.log(`responseQueueLength=${queue.length}`);
		if(queue.length > 0){
			const currentItem = queue.shift();
			await currentItem.callback(currentItem.params, currentItem.finalFilepath, currentItem.hash, currentItem.res);
			qAccessFlag.setToOff();
			processQueue();
		} else {
			qAccessFlag.setToOff();
		}
	}
}

module.exports = {
	add: addItemToQueue
};
