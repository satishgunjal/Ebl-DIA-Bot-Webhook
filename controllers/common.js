'use strict';
const logger = require("./../logger");


exports.GetSessionVarsFromOutputContext = function (outputContexts, sessionId){
  let result = null;   
try{
    let outputContextsCount = outputContexts.length;
    
    let nameArray = null;
    let contextName = null;
    for(let i = 0; i < outputContextsCount; i++) {
        nameArray = outputContexts[i].name.split('/');
        contextName =  nameArray[nameArray.length -1];
        //logger.log('info',"GetSessionVarsFromOutputContext()> contextName= " + contextName, {logId: sessionId});
        if(contextName === 'session_vars'){
            //logger.log('info',"GetSessionVarsFromOutputContext()> Reading paramter values from context(" + contextName+")", {logId: sessionId});
            result = outputContexts[i].parameters;            
            break;
        }
    }
}catch(e){
  logger.log('error', e.stack, { logId: sessionId});
}   
//logger.log('info','GetSessionVarsFromOutputContext()> ' + parameterName + '= ' + result, {logId: sessionId});
return result;
}

/**
   * Read parameter values from 'session_vars' context only
   * @param {string} parameterName > to read value from contexts
   * @param {array} outputContexts > it contains the session_vars contexts
   */
  exports.GetParameterValueFromSessionVars = function (parameterName, outputContexts, sessionId){
    let result = null;   
  try{
      let outputContextsCount = outputContexts.length;
      //logger.log('info',"GetParameterValueFromSessionVars()> Retreiving the value of = " + parameterName, {logId: sessionId});
      //logger.log('info',"GetParameterValueFromSessionVars()> outputContextsCount= " + outputContextsCount, {logId: sessionId});

      let nameArray = null;
      let contextName = null;
      for(let i = 0; i < outputContextsCount; i++) {
          nameArray = outputContexts[i].name.split('/');
          contextName =  nameArray[nameArray.length -1];
          //logger.log('info',"GetParameterValueFromSessionVars()> contextName= " + contextName, {logId: sessionId});
          if(contextName === 'session_vars'){
              //logger.log('info',"GetParameterValueFromSessionVars()> Reading paramter values from context(" + contextName+")", {logId: sessionId});
              result = outputContexts[i].parameters[parameterName];            
              break;
          }
      }
  }catch(e){
    logger.log('error', e.stack, { logId: sessionId});
  }   
  //logger.log('info','GetParameterValueFromSessionVars()> ' + parameterName + '= ' + result, {logId: sessionId});
  return result;
}
/**
 * NOT IN USE
 * Reset all the output context except 'session_vars'
 * @param {*} outputContexts > it contains the session_vars contexts
 */
exports.ResetAllOutputContext = function(outputContexts, noOfTries, sessionId){
    let result = null;   
  try{
      let outputContextsCount = outputContexts.length;
      logger.log('info',"ResetAllOutputContext()> outputContextsCount= " + outputContextsCount, {logId: sessionId}); 

      let nameArray = null;
      let contextName = null;
      let projectId = getProjectId(outputContexts);
      let sessionId = getSessionId(outputContexts);
      let contextStr = "";
      let session_vars = 'projects/'+ projectId +'/agent/sessions/'+ sessionId +'/contexts/session_vars';
        
      for(let i = 0; i < outputContextsCount; i++) {
          nameArray = outputContexts[i].name.split('/');
          contextName =  nameArray[nameArray.length -1];
          logger.log('info',"ResetAllOutputContext()> contextName= " + contextName);
          if(contextName != 'session_vars'){
            contextName = 'projects/'+ projectId +'/agent/sessions/'+ sessionId +'/contexts/'+ contextName;
            logger.log('info',"ResetAllOutputContext()> contextName= " + contextName);
            //resetting the context lifespan to 0
            contextStr = contextStr + '{"name":"' + contextName + '","lifespanCount":0,"parameters":{}},';
            logger.log('info',"ResetAllOutputContext()> contextName = " + contextName, {logId: sessionId});
          }else{
            logger.log('info',"ResetAllOutputContext()> Ignoring " + contextName, {logId: sessionId});
          }
      }
      result = '[' + contextStr + '{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries+'}}]';            

  }catch(e){
    logger.log('error', e.stack, { logId: sessionId});
  }   
  logger.log('info','ResetAllOutputContext()> result= ' + result, {logId: sessionId});   
  return result;
}

/**
 * NOT IN USE
 * Reset all the output context in case user exhaust no of tries
 * @param {*} outputContexts > it contains the session_vars contexts
 */
exports.ResetAllOutputContextAndKeepInputContext = function(outputContexts, sessionId){
    let result = null;   
  try{
      let outputContextsCount = outputContexts.length;
      logger.log('info',"ResetAllOutputContext()> outputContextsCount= " + outputContextsCount, {logId: sessionId}); 

      let nameArray = null;
      let contextName = null;
      let projectId = getProjectId(outputContexts);
      let sessionId = getSessionId(outputContexts);
      let contextStr = "";
      let session_vars = 'projects/'+ projectId +'/agent/sessions/'+ sessionId +'/contexts/session_vars';
        
      for(let i = 0; i < outputContextsCount; i++) {
          nameArray = outputContexts[i].name.split('/');
          contextName =  nameArray[nameArray.length -1];
          logger.log('info',"ResetAllOutputContext()> contextName= " + contextName, {logId: sessionId});
          if(contextName != 'session_vars'){
            contextName = 'projects/'+ projectId +'/agent/sessions/'+ sessionId +'/contexts/'+ contextName;
            logger.log('info',"ResetAllOutputContext()> contextName= " + contextName, {logId: sessionId});
            //resetting the context lifespan to 0
            contextStr = contextStr + '{"name":"' + contextName + '","lifespanCount":0,"parameters":{}},';
            logger.log('info',"ResetAllOutputContext()> contextName = " + contextName, {logId: sessionId});
          }else{
            logger.log('info',"ResetAllOutputContext()> Ignoring " + contextName, {logId: sessionId});
          }
      }
      result = '[' + contextStr + '{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ 3 +'}}]';            

  }catch(e){
    logger.log('error', e.stack, { logId: sessionId});
  }   
  logger.log('info','ResetAllOutputContext()> result= ' + result, {logId: sessionId});   
  return result;
}

  //Ref https://dialogflow.com/docs/reference/v1-v2-migration-guide-fulfillment#contexts_and_sessions
exports.getProjectId = function(outputContexts, sessionId){
    try{
        let nameArray = outputContexts[0].name.split('/');
        //logger.log('info','getProjectId()> projectId= '+ nameArray[1], {logId: sessionId});
        return nameArray[1];
    }catch(e){
      logger.log('error', e.stack, { logId: sessionId});
    } 
}

//Ref https://dialogflow.com/docs/reference/v1-v2-migration-guide-fulfillment#contexts_and_sessions
exports.getSessionId = function(outputContexts){
  let sessionId = null;
    try{
        let nameArray = outputContexts[0].name.split('/');
        sessionId = nameArray[4]
        //logger.log('info','getSessionId()> sessionId= '+ sessionId, {logId: sessionId});
        return sessionId;
    }catch(e){
      logger.log('error', e.stack, { logId: sessionId});
    } 
}

exports.getDateInDdMmYyFormat = function(sessionId){
  try{
    var d = new Date();
    var mm = d.getMonth() + 1;
    var dd = d.getDate();
    var yy = d.getFullYear();
    return dd + "/" + mm + "/"+ yy;
  }catch(e){
    logger.log('error', e.stack, { logId: sessionId});
  } 
}

exports.getDateInYYYYMMDDHHmmssSSS = function(sessionId){
  try{
    //changed
    var moment = require('moment');
    
    var today = new Date();
    return moment(today).format("YYYYMMDDHHmmssSSS");
  }catch(e){
    logger.log('error', e.stack, { logId: sessionId});
  } 
}

exports.getDateInYYMMDDHHmmssSSSS = function(sessionId){
  try{
    //changed
    var moment = require('moment');
    
    var today = new Date();
    return moment(today).format("YYMMDDHHmmssSSS");
  }catch(e){
    logger.log('error', e.stack, { logId: sessionId});
  } 
}