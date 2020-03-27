const fs = require('fs');
let path = require('path');
var dateTime = require('node-datetime');
const logger = require("../logger");
const config=require("./../config");
const common = require("./common");
const TRAVERSAL_ON = config.traversal;
const TRAVERSAL_FILENAME = config.traversalFilename;

exports.nodeTraversal= function (sessionId,request,actionStatus,eblActionStatus, fulfillmentText,contextStr,accOrCardNo)
{
    try{
        let queryResult=request.queryResult;
        logger.log('info',"nodeTraversal()> TRAVERSAL_ON = "+TRAVERSAL_ON,{logId: sessionId});
        if(TRAVERSAL_ON=='on'){
        let ipContext='{}';
        if(queryResult!=undefined){
            ipContext=queryResult.outputContexts;
        }
        let quickRepliesTitle='';
        let quickRepliesContent='';
        let fulfillmentContent='';
        if(fulfillmentText!=undefined&&fulfillmentText!=''){
           // logger.log('info',"nodeTraversal()> fulfillmentText= " + JSON.stringify(fulfillmentText), {logId: sessionId});
            fulfillmentText=JSON.parse(fulfillmentText);
            if(fulfillmentText[0]!=undefined&&fulfillmentText[0].text!=undefined){
                fulfillmentContent= fulfillmentText[0].text.text[0];
            }
            if(fulfillmentText[1]!=undefined && fulfillmentText[1].quickReplies!=undefined){
                quickRepliesTitle= fulfillmentText[1].quickReplies.title;
                quickRepliesContent= fulfillmentText[1].quickReplies.quickReplies;
            }
        }
        let source=request.originalDetectIntentRequest.source;
        logger.log('info',"nodeTraversal()> request= " + JSON.stringify(request), {logId: sessionId});
        
        logger.log('info',"nodeTraversal()> originalDetectIntentRequest= " + JSON.stringify(request.originalDetectIntentRequest), {logId: sessionId});
        logger.log('info',"nodeTraversal()> queryResult= " + JSON.stringify(queryResult), {logId: sessionId});
        //logger.log('info',"nodeTraversal()> actionStatus= " + actionStatus, {logId: sessionId});
        //logger.log('info',"nodeTraversal()> fulfillmentText= " + JSON.stringify(fulfillmentText), {logId: sessionId});
        logger.log('info',"nodeTraversal()> contextStr= " + contextStr, {logId: sessionId});
        //logger.log('info',"nodeTraversal()> eblActionStatus= " + eblActionStatus, {logId: sessionId});
        var dt = dateTime.create();
        
        var formattedDateTime = common.getDateInYYYYMMDDHHmmssSSS(sessionId);
        var formattedDate=dt.format('Ymd');
        if(contextStr==undefined)
        {
            contextStr='{}';
        }
        let opContext = JSON.parse(contextStr);
        let i=0;
        let outputContext='';
        let inputContext='';
        let contextName='';
        //let sessionVarID=0;
        
        for(i=0;i<opContext.length;i++){   
            logger.log('info',"nodeTraversal()> opContext[i].lifespanCount= " + opContext[i].lifespanCount, {logId: sessionId});    
           if(opContext[i].lifespanCount>=1)
            {
                contextName=opContext[i].name;
                outputContext+=contextName.substring(contextName.lastIndexOf("/") + 1)+',';
            }
            /*if(opContext[i].lifespanCount==100)
            {
                sessionVarID=i;
                logger.log('info',"nodeTraversal()> sessionVarID= " + sessionVarID, {logId: sessionId});
            }*/
        }
        for(i=0;i<ipContext.length;i++){ 
             if(ipContext[i].lifespanCount==undefined || ipContext[i].lifespanCount==0)
             {
                contextName=ipContext[i].name;
                if(contextName!=undefined){
                    inputContext+=contextName.substring(contextName.lastIndexOf("/") + 1)+',';
                }
             }
        }

        //logger.log('info',"nodeTraversal()> contextStr["+sessionVarID+"]= " + JSON.stringify(opContext[sessionVarID]), {logId: sessionId});
        let traversalString=sessionId+'|'+queryResult.intent.displayName+'|'+queryResult.queryText+'|'+common.GetParameterValueFromSessionVars('noOfTries', opContext, sessionId)+'|'+queryResult.action+'|'+actionStatus+'|'+eblActionStatus+'|'+inputContext+'|'+outputContext+'|'+fulfillmentContent.replace(/\n/g, " ")+'#'+quickRepliesTitle+'#'+quickRepliesContent+'|'+source+'|'+accOrCardNo;
        logger.log('info',"nodeTraversal()> traversalString= " + traversalString, {logId: sessionId});
        let traversalFile = path.join(TRAVERSAL_FILENAME+'-'+formattedDate+'.txt');
        fs.appendFile(traversalFile, '\n'+''+formattedDateTime+'|'+traversalString, function (err) {
            if (err) throw err;
        });
    }
    }
    catch(e){
        logger.log('error', e.stack, { logId: sessionId});
    } 

}