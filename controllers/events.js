exports.No_MORE_TRIES = function (responseToUser) {
    let responseJson = {};    
    try{
        let followupEventInput = { "name": "No_MORE_TRIES" };
        responseJson.followupEventInput = followupEventInput;
    }catch(e){
        console.log(e);
    } 
    console.log('No_MORE_TRIES()> responseJson:'+JSON.stringify(responseJson));
    responseToUser.json(responseJson);
  }

  exports.ERROR = function (responseToUser,sessionId,queryResult,fulfillmentMessages,contextStr) {
    let responseJson = {};   
    let actionStatus='success';
    let eblActionStatus='error';
    try{
        let followupEventInput = { "name": "ERROR" };
        responseJson.followupEventInput = followupEventInput;
    }catch(e){
        actionStatus='error';
        console.log(e);
    } 
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr); 
    console.log('ERROR()> responseJson:'+JSON.stringify(responseJson));
    responseToUser.json(responseJson);
  }