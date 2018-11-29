
function validateVars(input){
  const errors = [];
  input.forEach(item => {
    switch(item.type){
      case 'dimensions':
        if(typeof(item.value) !== 'number' && item.value % 1 != 0 && item.value > 10) {
          errors.push(`${item.name} needs to be a positive whole number greater than 10`);
        }
        break;
      case 'alpha':
        const alpha = /([a-zA-Z].*)/;
        if(!alpha.test(item.value)) {
          errors.push(`${item.name} needs to be just alpha (a-z) characters`);
        }
        break;
      case 'date':
        const datePattern = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
        if(!datePattern.test(item.value)) {
          errors.push(`${item.name} needs to be a date value in the yyyy-mm-dd format`);
        }
        break;
      case 'datePast':
        if(item.value > getCurrentDate()){
          errors.push(`${item.name} must be in the past`);
        }
        break;
      case 'greaterThan':
        if(item.value[0] < item.value[1]) {
          errors.push(`${item.name[0]} needs to be greater than ${item.name[1]}`);
        }
        break;
      case 'lessThan':
        if(item.value[0] > item.value[1]) {
          errors.push(`${item.name[0]} needs to be less than ${item.name[1]}`);
        }
        break;
      case 'notMatching':
        if(item.value[0] === item.value[1]) {
          errors.push(`${item.name[0]} cannot match ${item.name[1]}`);
        }
        break;
      case 'dateRangeLimit':
        if(dayDifference(item.value[0], item.value[1]) > 5){
          errors.push(`Date ranges cannot exceed 5 days (training wheels are on during beta)`);
        }
        break;
    }
    if('selection' in item && item.selection.indexOf(item.value) < 0){
      errors.push(`${item.name} needs to be one of the following values: ${item.selection.join(',')}`);
    }
  });
  return errors;
}

function getCurrentDate(){
  const x = new Date();
  const y = x.getFullYear().toString();
  const m = (x.getMonth() + 1).toString();
  const d = x.getDate().toString();
  (d.length == 1) && (d = '0' + d);
  (m.length == 1) && (m = '0' + m);
  return `${y}-${m}-${d}`;
}

function dayDifference(from, to){
  const one_day=1000*60*60*24;
  const date1 = new Date(from);
  const date2 = new Date(to);
  const date1_ms = date1.getTime();
  const date2_ms = date2.getTime();
  const difference_ms = date2_ms - date1_ms;
  return Math.round(difference_ms/one_day); 
}

module.exports = {
  validateVars
};

