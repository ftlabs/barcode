const fetchContent = require('../lib/fetchContent');

function getImageIdsFromDateRange(dateFrom, dateTo, timeFrom, timeTo) {
  return fetchContent.getImageIdsFromDateRange(dateFrom, dateTo, timeFrom, timeTo);
}

module.exports = {
	getImageIdsFromDateRange
};
