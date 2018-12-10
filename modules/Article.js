const fetchContent = require('../lib/fetchContent');

function getImageIdsFromDateRange(dateFrom, dateTo) {
  return fetchContent.getImageIdsFromDateRange(dateFrom, dateTo);
}

module.exports = {
	getImageIdsFromDateRange
};
