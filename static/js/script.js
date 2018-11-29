var queryLink	= document.getElementById('queryBuilderLink');
var width = document.getElementById('width');
var height = document.getElementById('height');
var dateFrom = document.getElementById('dateFrom');
var dateTo = document.getElementById('dateTo');
var orientation = document.getElementById('orientation');
var fit = document.getElementById('fit');
var share = document.getElementById('share');

function init(){
  if(width !== undefined && height !== undefined && dateFrom !== undefined && dateTo !== undefined && orientation !== undefined && fit !== undefined && share !== undefined){
    width.addEventListener('change', updateUrlBuilderLink, false);
    height.addEventListener('change', updateUrlBuilderLink, false);
    dateFrom.addEventListener('change', updateUrlBuilderLink, false);
    dateTo.addEventListener('change', updateUrlBuilderLink, false);
    orientation.addEventListener('change', updateUrlBuilderLink, false);
    fit.addEventListener('change', updateUrlBuilderLink, false);
    share.addEventListener('change', updateUrlBuilderLink, false);
    updateUrlBuilderLink();
  }
}

function updateUrlBuilderLink(){
  var widthVal = width.value;
  var heightVal = height.value;
  var dateFromVal = dateFrom.value;
  var dateToVal = dateTo.value;
  var orientationVal = orientation.options[orientation.selectedIndex].value;
  var fitVal = fit.options[fit.selectedIndex].value;
  var shareVal = share.options[share.selectedIndex].value;
  var shareCheck = (shareVal) ? '&share=' + shareVal : '';

  var str = '/barcode?width=' + widthVal + '&height=' + heightVal + '&dateFrom=' + dateFromVal + '&dateTo=' + dateToVal + '&orientation=' + orientationVal + '&fit=' + fitVal + shareCheck;

  queryLink.href = str;
  queryLink.innerHTML = str;
}

init();