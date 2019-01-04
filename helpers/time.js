function getDatetimeRange(period, frequency, offset, past = true, iso = true){
	let currDate			= new Date().getTime();
	let originTime			= 0;
	let diffTime			= 0;
	let offsetFrequency		= Number(Number(frequency) + Number(offset));

	if(past === true){
		originTime = currDate - msDuration(period, offset);
		diffTime = currDate - msDuration(period, offsetFrequency);
	} else {
		originTime = currDate + msDuration(period, offset);
		diffTime = currDate + msDuration(period, offsetFrequency);
	}

	if(iso === true){
		return {
			first: new Date( originTime ).toISOString().split('.')[0] + "Z",
			next: new Date( diffTime ).toISOString().split('.')[0] + "Z",
			list: [],
		};
	} else {
		return {
			first: new Date( originTime ),
			next: new Date( diffTime ),
			list: [],
		};
	}
}

function msDuration(period, increment){
	let ms = 0;

	switch(period){
		case 'minutes':
			ms = increment * (60 * 1000);
			break;
		case 'hours':
			ms = increment * (60 * 60 * 1000);
			break;
		case 'days':
			ms = increment * (24 * 60 * 60 * 1000);
			break;
	}
	ms = Math.round(ms);
	return ms;
}

function getDateTimeToQueryTime(date, time = '00:00:00'){
	return `${date}T${time}Z`;
}

function today(){
	return date();
}

function yesterday() {
	return date(-1);
}

function date(offset = 0) {
	var now = new Date();
	
	if(offset && offset != 0){
		now.setDate(now.getDate() + offset);
	}

    var y = now.getFullYear();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    var mm = m < 10 ? '0' + m : m;
    var dd = d < 10 ? '0' + d : d;
    return `${y}-${mm}-${dd}`;
}

module.exports = {
	today,
	yesterday,
	getDatetimeRange,
	getDateTimeToQueryTime
};
