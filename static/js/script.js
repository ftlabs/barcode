var queryLink	= document.getElementById('queryBuilderLink');
var width = document.getElementById('width');
var height = document.getElementById('height');
var dateFrom = document.getElementById('dateFrom');
var timeFrom = document.getElementById('timeFrom');
var dateTo = document.getElementById('dateTo');
var timeTo = document.getElementById('timeTo');
var orientation = document.getElementById('orientation');
var fit = document.getElementById('fit');
var order = document.getElementById('order');
var sort = document.getElementById('sort');

function init(){
  if(width !== undefined && height !== undefined && dateFrom !== undefined && timeFrom !== undefined && dateTo !== undefined && timeTo !== undefined && orientation !== undefined && fit !== undefined && order !== undefined && sort !== undefined){
    width.addEventListener('change', updateUrlBuilderLink, false);
    height.addEventListener('change', updateUrlBuilderLink, false);
    dateFrom.addEventListener('change', updateUrlBuilderLink, false);
    timeFrom.addEventListener('change', updateUrlBuilderLink, false);
    dateTo.addEventListener('change', updateUrlBuilderLink, false);
    timeTo.addEventListener('change', updateUrlBuilderLink, false);
    orientation.addEventListener('change', updateUrlBuilderLink, false);
    fit.addEventListener('change', updateUrlBuilderLink, false);
    order.addEventListener('change', updateUrlBuilderLink, false);
    sort.addEventListener('change', updateUrlBuilderLink, false);
    updateUrlBuilderLink();
  }
}

function updateUrlBuilderLink(){
  var widthVal = width.value;
  var heightVal = height.value;
  var dateFromVal = dateFrom.value;
  var timeFromVal = timeFrom.value + ':00';
  var dateToVal = dateTo.value;
  var timeToVal = timeTo.value + ':00';
  var orientationVal = orientation.options[orientation.selectedIndex].value;
  var fitVal = fit.options[fit.selectedIndex].value;
  var orderVal = order.options[order.selectedIndex].value;
  var sortVal = sort.options[sort.selectedIndex].value;

  var str = '/barcode?width=' + widthVal + '&height=' + heightVal + '&dateFrom=' + dateFromVal + '&timeFrom=' + timeFromVal  + '&dateTo=' + dateToVal + '&timeTo=' + timeToVal + '&orientation=' + orientationVal + '&fit=' + fitVal + '&order=' + orderVal + '&sort=' + sortVal;

  queryLink.href = str;
  queryLink.innerHTML = str;
}

init();