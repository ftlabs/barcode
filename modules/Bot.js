const fs = require('fs');
const path = require('path');
const Slack = require('node-slack-upload');
const scheduler = require('../helpers/scheduler');
const Utils = require('../helpers/utils');

const token = Utils.processEnv('SLACK_TOKEN', {default: null});
const barcode = require('./Barcode');

let bot;
let pollInterval = null;

function init() {
	if(token === null) {
		return;
	}

	bot = new Slack(token);
	sendMessage();
	//Try to send a message on launch, and retry avery 15 minutes
	pollInterval = setInterval(sendMessage, Utils.minutesToMs(15));
}

async function sendMessage() {
	if(scheduler.onSchedule()) {
		const channel = Utils.processEnv('SLACK_CHANNEL', {default: null});
		if(channel === null) {
			return;
		}
		
		const fileName = await getTodaysFile();
		if(fileName === undefined) {
			clearInterval(pollInterval);
			return;
		}

		bot.uploadFile({
		    file: fs.createReadStream(path.join(__dirname,`../${Utils.processEnv('RESULT_FOLDER')}/output_${fileName}.jpg`)),
		    mimetype: 'image/jpeg',
        	filetype: 'jpg',
		    title: `Barcode::${fileName}`,
		    channels: channel
		}, function(err, data) {
		    if (err) {
		        console.error(`bot.sendMessage.fileUploadError=${err}`);
		    }
		});

	}
}

async function getTodaysFile() {
	const params = barcode.todaysParams();
	const hash = barcode.createHash(params);
	const filePath = `${process.env.RESULT_FOLDER}/output_${hash}.jpg`;

	if(fs.existsSync(path.join(__dirname,`../${filePath}`))) {
		return hash;
	} else {
		const generate = await barcode.generateAndSendBarcode(params, filePath, hash, null);
		return generate;
	}

	return undefined;
}

module.exports = {
	init
};
