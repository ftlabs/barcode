var queryLink;
var elements = [];
var inputIds = [
  'width',
  'height',
  'dateFrom',
  'timeFrom',
  'dateTo',
  'timeTo',
  'orientation',
  'fit',
  'order',
  'sort'
];

document.addEventListener("DOMContentLoaded", init);

function init(){
  queryLink	= document.getElementById('queryBuilderLink');
  elements = getElements(inputIds);
  addElementListeners(elements);
  updateUrlBuilderLink(elements);
}

function getElements(ids){
  var elements = {};
  for(var i = 0; i < ids.length; i++){
    var element = ids[i];
    if(element !== undefined){
      elements[element] = document.getElementById(element);
    }
  }
  return elements;
}

function addElementListeners(elements){
  for(var key in elements){
    if(elements.hasOwnProperty(key)){
      elements[key].addEventListener('change', updateUrlBuilderLink, false);
    }
  }
}

function updateUrlBuilderLink(){
  var widthVal = elements.width.value;
  var heightVal = elements.height.value;
  var dateFromVal = elements.dateFrom.value;
  var timeFromVal = elements.timeFrom.value + ':00';
  var dateToVal = elements.dateTo.value;
  var timeToVal = elements.timeTo.value + ':00';
  var orientationVal = elements.orientation.options[elements.orientation.selectedIndex].value;
  var fitVal = elements.fit.options[elements.fit.selectedIndex].value;
  var orderVal = elements.order.options[elements.order.selectedIndex].value;
  var sortVal = elements.sort.options[elements.sort.selectedIndex].value;

  var str = '/barcode?width=' + widthVal + '&height=' + heightVal + '&dateFrom=' + dateFromVal + '&timeFrom=' + timeFromVal  + '&dateTo=' + dateToVal + '&timeTo=' + timeToVal + '&orientation=' + orientationVal + '&fit=' + fitVal + '&order=' + orderVal + '&sort=' + sortVal;

  queryLink.href = str;
  queryLink.innerHTML = str;
}