if (process.env.NODE_ENV !== 'production') require('dotenv').config();
const Slackbot = require('slackbots');
const scheduler = require('./scheduler');
const Utils = require('./utils');

const bot = new Slackbot({
    token: process.env.SLACK_TOKEN,
    name: 'barcode'
});

const botParams = {
	icon_url: 'https://www.ft.com/__origami/service/image/v2/images/raw/https%3A%2F%2Ftheearthorganization.org%2Fwp-content%2Fuploads%2F2016%2F04%2Fzebra.jpg?source=ftlabs-barcode',
	as_user: false
};

let pollInterval = null;

function init() {
	sendMessage();
	//Try to send a message on launch, and retry avery 15 minutes
	pollInterval = setInterval(sendMessage, Utils.minutesToMs(15));
}

function sendMessage() {
	if(scheduler.onSchedule()) {
		const channel = process.env.SLACK_CHANNEL;
		bot.postMessageToGroup(channel, `${process.env.APP_URL}?cacheBust=${new Date().getTime()}`, botParams);
	}
}

module.exports = {
	init
};
