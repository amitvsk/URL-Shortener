const isValidReqBody = function(value){
    if(Object.keys(value).length == 0) {return false}  
    else return true;
  }
  
  const isValid = function(value) {
      if(typeof (value) == "undefined" || typeof (value) == null) {return false}
      if(typeof (value).trim().length == 0){ return false}
      if(typeof (value) == "string" && (value).trim().length > 0) {return true}
  }
  
  module.exports = {isValidReqBody,isValid}