const fetchContent = require('../lib/fetchContent');

function getImagesFromDateRange(dateFrom, dateTo) {
  return fetchContent.getImagesFromDateRange(dateFrom, dateTo);
}

module.exports = {
	getImagesFromDateRange
};
