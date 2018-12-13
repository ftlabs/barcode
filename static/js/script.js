var queryLink	= document.getElementById('queryBuilderLink');
var width = document.getElementById('width');
var height = document.getElementById('height');
var dateFrom = document.getElementById('dateFrom');
var dateTo = document.getElementById('dateTo');
var timeFrom = document.getElementById('timeFrom');
var timeTo = document.getElementById('timeTo');
var orientation = document.getElementById('orientation');
var fit = document.getElementById('fit');

function init(){
  if(width !== undefined && height !== undefined && dateFrom !== undefined && dateTo !== undefined && timeFrom !== undefined && timeTo !== undefined && orientation !== undefined && fit !== undefined){
    width.addEventListener('change', updateUrlBuilderLink, false);
    height.addEventListener('change', updateUrlBuilderLink, false);
    dateFrom.addEventListener('change', updateUrlBuilderLink, false);
    dateTo.addEventListener('change', updateUrlBuilderLink, false);
    timeFrom.addEventListener('change', updateUrlBuilderLink, false);
    timeTo.addEventListener('change', updateUrlBuilderLink, false);
    orientation.addEventListener('change', updateUrlBuilderLink, false);
    fit.addEventListener('change', updateUrlBuilderLink, false);
    updateUrlBuilderLink();
  }
}

function updateUrlBuilderLink(){
  var widthVal = width.value;
  var heightVal = height.value;
  var dateFromVal = dateFrom.value;
  var dateToVal = dateTo.value;
  var timeFromVal = timeFrom.value;
  var timeToVal = timeTo.value;
  var orientationVal = orientation.options[orientation.selectedIndex].value;
  var fitVal = fit.options[fit.selectedIndex].value;

  var str = '/barcode?width=' + widthVal + '&height=' + heightVal + '&dateFrom=' + dateFromVal + '&dateTo=' + dateToVal + '&timeFrom=' + timeFromVal + '&timeTo=' + timeToVal + '&orientation=' + orientationVal + '&fit=' + fitVal;

  queryLink.href = str;
  queryLink.innerHTML = str;
}

init();