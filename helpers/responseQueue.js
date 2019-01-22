const queue = [];
let queueIsProcessing = false;

function addItemToQueue(item) {
	queue.push(item);

	if(!queueIsProcessing) {
		processQueue();
	}
}

async function processQueue() {
	if(queue.length > 0 && !queueIsProcessing) {
		console.log(`responseQueueLength=${queue.length}`);

		let currentItem = queue.shift();
		setQueueStatus(true);
		await currentItem.callback(currentItem.params, currentItem.finalFilepath, currentItem.hash, currentItem.res);

		setQueueStatus(false);
		processQueue();
	}
}

function setQueueStatus(status = true) {
	queueIsProcessing = status;
}


module.exports = {
	add: addItemToQueue
};
