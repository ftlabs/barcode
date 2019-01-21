const queue = [];
let queueIsProcessing = false;

function addItemToQueue(item) {
	queue.push(item);

	if(!queueIsProcessing) {
		processQueue();
	}
}

function removeItemFromQueue(id = 0) {
	queue.splice(id,1);
	setQueueStatus(false);
}

async function processQueue(queueId = 0) {
	if(queue.length > 0 && !queueIsProcessing) {
		console.log(`${queue.length} items in the response queue`);
		
		let currentItem = queue[queueId];
		setQueueStatus();
		const exec = await currentItem.exec(currentItem.params, currentItem.finalFilepath, currentItem.hash, currentItem.res);
		removeItemFromQueue(queueId);
		processQueue();
	}
}

function setQueueStatus(status = true) {
	queueIsProcessing = status;
}


module.exports = {
	add: addItemToQueue
};