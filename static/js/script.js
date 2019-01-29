var queryLink;
var inputs = [];
var radios = [];
var inputIds = [
  'width',
  'height',
  'dateFrom',
  'timeFrom',
  'dateTo',
  'timeTo'
];
var radioNames = [
  'orientation',
  'fit',
  'order',
  'sort'
];

document.addEventListener("DOMContentLoaded", init);

function init(){
  queryLink	= document.getElementById('queryBuilderLink');

  inputs = getElements(inputIds);
  addInputListeners(inputs);
  radios = getElements(radioNames);
  addRadioListeners(radios);

  updateUrlBuilderLink(inputs, radios);
}

function getElements(ids){
  var elements = {};
  for(var i = 0; i < ids.length; i++){
    var element = ids[i];
    if(element !== undefined){
      elements[element] = document.getElementById(element);

      if(elements[element] === null){
        elements[element] = document.getElementsByName(element);
      }
    }
  }
  return elements;
}

function addInputListeners(inputs){
  for(var key in inputs){
    if(inputs.hasOwnProperty(key)){
      inputs[key].addEventListener('change', updateUrlBuilderLink, false);
    }
  }
}

function addRadioListeners(radios){
  for(var set in radios){
    for(var key in radios[set]){
      if(radios[set].hasOwnProperty(key)){
        radios[set][key].addEventListener('change', updateUrlBuilderLink, false);
      }
    }
  }
}

function updateUrlBuilderLink(){
  var widthVal = inputs.width.value;
  var heightVal = inputs.height.value;
  var dateFromVal = inputs.dateFrom.value;
  var timeFromVal = inputs.timeFrom.value + ':00';
  var dateToVal = inputs.dateTo.value;
  var timeToVal = inputs.timeTo.value + ':00';
  var orientationVal =  document.querySelector('input[name="orientation"]:checked').value;
  var fitVal = document.querySelector('input[name="fit"]:checked').value;
  var orderVal = document.querySelector('input[name="order"]:checked').value;
  var sortVal = document.querySelector('input[name="sort"]:checked').value;

  var str = '/barcode?width=' + widthVal + '&height=' + heightVal + '&dateFrom=' + dateFromVal + '&timeFrom=' + timeFromVal  + '&dateTo=' + dateToVal + '&timeTo=' + timeToVal + '&orientation=' + orientationVal + '&fit=' + fitVal + '&order=' + orderVal + '&sort=' + sortVal;

  queryLink.href = str;
  queryLink.innerHTML = str;
}