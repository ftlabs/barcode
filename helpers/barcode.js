function todaysQueryString(){
	return createURLQueryString({
		width: 1024,
		height: 768,
		dateFrom: date(-1),
		timeFrom: '00:00:00',
		dateTo: date(),
		timeTo: '00:00:00',
		orientation: 'v',
		fit: 'fill',
		order: 'colour',
		sort: 'asc'
	});
}

function createURLQueryString(elements){
	const width = (elements.width) ? elements.width : 1024;
	const height = (elements.height) ? elements.height : 768;
	const dateFrom = (elements.dateFrom) ? elements.dateFrom : date(-1);
	const dateTo = (elements.dateTo) ? elements.dateTo : date();
	const timeFrom = (elements.timeFrom) ? elements.timeFrom : '00:00:00';
	const timeTo = (elements.timeTo) ? elements.timeTo : '00:00:00';
	const orientation = (elements.orientation) ? elements.orientation : 'v';
	const fit = (elements.fit) ? elements.fit : 'fill';
	const order = (elements.order) ? elements.order : 'colour';
	const sort = (elements.sort) ? elements.sort : 'asc';
	return `width=${width}&height=${height}&dateFrom=${dateFrom}&timeFrom=${timeFrom}&dateTo=${dateTo}&timeTo=${timeTo}&orientation=${orientation}&fit=${fit}&order=${order}&sort=${sort}`;
}

function date(offset = 0) {
	let now = new Date(); 
	if(offset && offset != 0){
		now.setDate(now.getDate() + offset);
	}
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const mm = m < 10 ? '0' + m : m;
    const dd = d < 10 ? '0' + d : d;
    return `${y}-${mm}-${dd}`;
}

module.exports = {
	todaysQueryString,
	createURLQueryString
};
