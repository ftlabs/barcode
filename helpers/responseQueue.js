const queue = [];
let queueIsProcessing = false;

function addItemToQueue(item) {
	queue.push(item);

	if(!queueIsProcessing) {
		processQueue();
	}
}

async function processQueue(queueId) {
	if(queue.length > 0 && !queueIsProcessing) {
		console.log(`${queue.length} items in the response queue`);

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