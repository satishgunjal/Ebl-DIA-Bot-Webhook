'use strict';

const ebl = require("../controllers/eblWebMethods");
const events = require("../controllers/events");
const account = require("../controllers/account");
const card = require("../controllers/card");
const common = require("../controllers/common");
const logger = require("./../logger");
const config = require("./../config");

const traversal=require("../controllers/traversal");

let OTP_TIMEOUT_MS = config.ebl.otpTimeoutMs;

let sessionId = null;

exports.get_request = function (req, res) {
    res.send('This is NodeJs app, which contains the webhook code for EblDIA Google Dialogflow bot. Use this url in fullfilment section of Dialogflow');
    logger.log('info',"get_request()> Res to user= This is NodeJs app, which contains the webhook code for EblDIA Google Dialogflow bot. Use this url in fullfilment section of Dialogflow");
}


/** 
 * For V2 webhook response format please ref. https://dialogflow.com/docs/reference/v1-v2-migration-guide-fulfillment#webhook_responses
 */
exports.dialogflow_webhook_request = function (req, res) {
    let responseJson = {};
    try{
        sessionId= common.getSessionId(req.body.queryResult.outputContexts);

        logger.log('debug',"dialogflow_webhook_request()> req= " + JSON.stringify(req.body), {logId: sessionId});
        
        let intent = req.body.queryResult.intent;
        logger.log('info',"dialogflow_webhook_request()> intent= " + intent.displayName, {logId: sessionId});

        let queryText = req.body.queryResult.queryText;
        logger.log('info',"dialogflow_webhook_request()> queryText= " + JSON.stringify(queryText), {logId: sessionId});
        
        //logger.log('debug',"dialogflow_webhook_request()> queryResult= " + JSON.stringify(req.body.queryResult), {logId: sessionId});
        
        let action = req.body.queryResult.action; 
        logger.log('info',"dialogflow_webhook_request()> action= " + action, {logId: sessionId});
        
        //let parameters = req.body.queryResult.parameters;
        //logger.log('info',"dialogflow_webhook_request()> parameters= " + JSON.stringify(parameters), {logId: sessionId});
        
        let outputContexts = req.body.queryResult.outputContexts;
        let session_vars = common.GetSessionVarsFromOutputContext(outputContexts,sessionId);
        logger.log('info',"dialogflow_webhook_request()> session_vars= " + JSON.stringify(session_vars), {logId: sessionId});

        responseJson.fulfillmentText = 'Error in Nodejs code';
        if(action === 'resetNoOfTries'){ 
            resetNoOfTries (res, outputContexts,sessionId,req.body)
        }else if(action === 'increaseNoOfTries'){ 
            increaseNoOfTries (res, outputContexts,sessionId,req.body)
        }else if(action === 'updateAccountServiceType'){ 
            account.updateAccountServiceType (res, outputContexts, sessionId,req.body)
        }else if(action === 'updateCardServiceType'){ 
            card.updateCardServiceType (res, outputContexts, sessionId,req.body)
        }else if(action === 'verifyMobileNumberAndGetOtp'){ 
            verifyMobileNumberAndGetOtp (res, outputContexts,sessionId,req.body)
        }else if(action === 'verifyOtp'){ 
            verifyOtp (res, outputContexts,sessionId,req.body)
        }else if(action === 'getBankAccountBalance'){ 
            account.getBankAccountBalance (res, outputContexts, sessionId,req.body)
        }else if(action === 'getBankAccountLast5Txn'){ 
            account.getBankAccountLast5Txn (res, outputContexts, sessionId,req.body) 
        }else if(action === 'getBalanceAndLast5TxnByAccountNumber'){ 
            account.getBalanceAndLast5TxnByAccountNumber (res, outputContexts, sessionId,req.body) 
        }else if(action === 'getCreditCardNumbers'){ 
            card.getCreditCardNumbers (res, outputContexts, sessionId,req.body)
        }else if(action === 'verifyCreditCardNumber'){ 
            card.verifyCreditCardNumber (res, outputContexts, sessionId,req.body)
        }else if(action === 'getCreditCardNumbersForMobRecharge'){ 
            card.getCreditCardNumbersForMobRecharge(res, outputContexts, sessionId,req.body)
        }else if(action === 'verifyCreditCardNumberForMobRecharge'){ 
            card.verifyCreditCardNumberForMobRecharge (res, outputContexts, sessionId,req.body)
        }else if(action === 'getCreditCard_Last5Txn_Limit_Bal'){ 
            getCreditCard_Last5Txn_Limit_Bal(res, outputContexts, sessionId,req.body)
        }else if(action === 'getPrepaidCardNumbers'){ 
            card.getPrepaidCardNumbers (res, outputContexts, sessionId,req.body)
        }else if(action === 'getPrepaidCardNumbersForMobRecharge'){ 
            card.getPrepaidCardNumbersForMobRecharge (res, outputContexts, sessionId,req.body)
        }else if(action === 'verifyPrepaidCardNumber'){ 
            card.verifyPrepaidCardNumber (res, outputContexts, sessionId,req.body)
        }else if(action === 'verifyPrepaidCardNumberForMobRecharge'){ 
            card.verifyPrepaidCardNumberForMobRecharge (res, outputContexts, sessionId,req.body)
        }else if(action === 'getPrepaidCard_Bal_Last5Txn'){ 
            getPrepaidCard_Bal_Last5Txn(res, outputContexts,sessionId,req.body)
        }else if(action === 'mobileRecharge'){ 
            mobileRecharge(res, outputContexts,sessionId,req.body)
        }else if(action === 'mobileRechargeWithAcntNo'){ 
            mobileRechargeWithAcntNo(res, outputContexts,sessionId,req.body)
        }else if(action==='mobileRechargeAmount'){
            mobileRechargeAmount(res, outputContexts,sessionId,req.body)
        }else if(action==='previousMenu'){
            previousMenu(res, outputContexts,sessionId,req.body)
        }else if(action==='validateMobileRechargeAmount'){
            validateMobileRechargeAmount(res, outputContexts,sessionId,req.body)
        }else if(action === 'verifyOtpFallback'){ 
            verifyOtpFallback(res, outputContexts,sessionId,req.body)            
        }else if(action === 'checkGreetingMessage'){ 
            checkGreetingMessage(res, outputContexts,sessionId,req.body)            
        }else if(action === 'validateMobileRechargeAmount_Fallback'){ 
            mobileRechargeAmountFallback(res, outputContexts,sessionId,req.body)            
        }else if(action === 'reenterMobileRechargeAmount'){ 
            mobileRechargeAmountNotConfirmed(res, outputContexts,sessionId,req.body)            
        }else if(action === 'test'){ 
            test(res, outputContexts)            
        }else{
            //add warning message
            responseJson.fulfillmentText = 'Invalid choice, unable to process your request';  
            //sessionId|action|intent|querytext|fulfillment|contextString
            //traversal.nodeTraversal(sessionId+'|'+action+'|'+intent.displayName+'|'+queryText+'|'+responseJson.fulfillmentText+'|'+contextStr);          
            logger.log('info',"dialogflow_webhook_request-noMatch()> responseJson= " + JSON.stringify(responseJson), {logId: sessionId});                               
            res.json(responseJson); 
        }
    }
    catch(e){
        logger.log('error', e.stack, { logId: sessionId});
    } 
}

function mobileRechargeAmountNotConfirmed (responseToUser, outputContexts,sessionId,queryResult) {
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let contextStr = null;
    try{
        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)         
        logger.log('info','mobileRechargeAmountNotConfirmed()> Existing noOfTries= '+ noOfTries, {logId: sessionId});
        noOfTries = 0;
        logger.log('info','mobileRechargeAmountNotConfirmed()> noOfTries reset to = '+ noOfTries, {logId: sessionId});
        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+ sessionId +'/contexts/session_vars';
        contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
        let mobileRechargeType_from_session_vars = common.GetParameterValueFromSessionVars('mobileRechargeType', outputContexts, sessionId);
        logger.log('info','mobileRechargeAmountFallback()>mobileRechargeType_from_session_vars= '+ mobileRechargeType_from_session_vars, { logId: sessionId});
        
        let text=''   
        if(mobileRechargeType_from_session_vars=='prepaid'){
            text ='Enter the amount between BDT 10 and BDT 1000 you want to recharge.';
        }
        else{
            text='Enter the amount between BDT 50 and BDT 10000 you want to recharge.';
        }
        fulfillmentMessages='[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"text": {"text": ["'+ text +'"]},"platform": "FACEBOOK"}] ';    
        responseJson.fulfillmentMessages =JSON.parse(fulfillmentMessages);    
        logger.log('info','mobileRechargeAmountNotConfirmed()> contextStr= '+ contextStr, {logId: sessionId});
        
        //sessionId|action|intent|input|fulfillment|contextString
       // traversal.nodeTraversal(sessionId,queryResult,'success',responseJson.fulfillmentText,contextStr);
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        actionStatus='error';
        logger.log('error', e.stack, { logId: sessionId});
    } 
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,''); 
    logger.log('info','mobileRechargeAmountNotConfirmed()> Response:'+JSON.stringify(responseJson), {logId: sessionId});
    responseToUser.json(responseJson);
}


function mobileRechargeAmountFallback (responseToUser, outputContexts,sessionId,queryResult) {
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let contextStr = null;   
    try{
        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        //At the start of the chat reset 'noOfTries' value to numeric 0
        if(noOfTries == 'undefined' || noOfTries === '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','mobileRechargeAmountFallback()>Existing noOfTries= '+ noOfTries, {logId: sessionId});
        noOfTries = noOfTries + 1;
        logger.log('info','mobileRechargeAmountFallback()> incremented noOfTries to = '+ noOfTries, {logId: sessionId});
        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/session_vars';
        contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
        logger.log('info','mobileRechargeAmountFallback()> contextStr= '+ contextStr, {logId: sessionId});
        let mobileRechargeType_from_session_vars = common.GetParameterValueFromSessionVars('mobileRechargeType', outputContexts, sessionId);
        logger.log('info','mobileRechargeAmountFallback()>mobileRechargeType_from_session_vars= '+ mobileRechargeType_from_session_vars, { logId: sessionId});
        
        let text=''
             
        if(noOfTries < 3){  
            if(mobileRechargeType_from_session_vars=='prepaid'){
                text ='Enter the amount between BDT 10 and BDT 1000 you want to recharge.';
            }
            else{
                text='Enter the amount between BDT 50 and BDT 10000 you want to recharge.';
            }
            fulfillmentMessages='[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"text": {"text": ["'+ text +'"]},"platform": "FACEBOOK"}] ';    
            responseJson.fulfillmentMessages =JSON.parse(fulfillmentMessages); 
        }else{
            //no more tries;
            events.No_MORE_TRIES(responseToUser);
            return;            
        }
        //sessionId|action|intent|input|output|fulfillment|contextString
        //traversal.nodeTraversal(sessionId+'|'+action+'|'+intent.displayName+'|'+queryText+'|||'+contextStr);
       // traversal.nodeTraversal(sessionId,queryResult,'success',responseJson.fulfillmentText,contextStr);
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        actionStatus='error';
        logger.log('error', e.stack, { logId: sessionId});
    } 
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');  
    logger.log('info','mobileRechargeAmountFallback()> Response:'+JSON.stringify(responseJson), {logId: sessionId});
    responseToUser.json(responseJson);
}

async function checkGreetingMessage (responseToUser, outputContexts,sessionId,queryResult) {
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let contextStr = null;   
    let noOfTries=null;
    try{
        noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        //At the start of the chat reset 'noOfTries' value to numeric 0
        if(noOfTries == 'undefined' || noOfTries === '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','increaseNoOfTries()>Existing noOfTries= '+ noOfTries, {logId: sessionId});
        
        let result = await ebl.checkGreetingMessage(common.getSessionId(outputContexts))
        logger.log('info','checkGreetingMessage()> result: '+ JSON.stringify(result), { logId: sessionId});     
        let greetingMessage='';
        fulfillmentMessages='';
        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+ sessionId +'/contexts/session_vars';
        
        let welcomeMessage='Hello! I am DIA, your virtual assistant';
        let title='Please select a quick link below or type your question in the space provided ';
        let mainMenuQuickLink= ['"Banking Information"', '"General Services"','"FAQ"', '"Terms and Conditions"'];
        if(result!='timeout'){
            eblActionStatus='success'
            if(result.messageResult!=undefined && result.messageResult.GREETINGMESSAGE!=undefined && result.messageResult.GREETINGMESSAGE!='') {
                greetingMessage=result.messageResult.GREETINGMESSAGE.toString();
                fulfillmentMessages='[{"text": {"text":["'+ greetingMessage +'"]},"platform": "VIBER"},{"text": {"text":["'+ greetingMessage +'"]},"platform": "FACEBOOK"},{"text": {"text":["'+ welcomeMessage +'"]},"platform": "VIBER"},{"text": {"text":["'+ welcomeMessage +'"]},"platform": "FACEBOOK"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ mainMenuQuickLink +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ mainMenuQuickLink +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] '; 
            }
            else{
                fulfillmentMessages='[{"text": {"text":["'+ welcomeMessage +'"]},"platform": "VIBER"},{"text": {"text":["'+ welcomeMessage +'"]},"platform": "FACEBOOK"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ mainMenuQuickLink +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ mainMenuQuickLink +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';           
            }
        }
        else{
            //EBL webmethod timedout             
            actionStatus='timeout';
            eblActionStatus='timeout';          
            fulfillmentMessages='[{"text": {"text":["'+ welcomeMessage +'"]},"platform": "FACEBOOK"},{"text": {"text":["'+welcomeMessage+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ mainMenuQuickLink +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ mainMenuQuickLink +']},"platform":"FACEBOOK"}] ';                        
        }
        contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
        logger.log('info','mobileRechargeAmountFallback()> contextStr= '+ contextStr, {logId: sessionId});   
        responseJson.fulfillmentMessages = JSON.parse(fulfillmentMessages);        
        
    }catch(e){
        actionStatus='error'
        logger.log('error', e.stack, { logId: sessionId});
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,''); 
    logger.log('info','checkGreetingMessage()> Response:'+JSON.stringify(responseJson), {logId: sessionId});
    responseToUser.json(responseJson);
}

function verifyOtpFallback(responseToUser, outputContexts,sessionId,queryResult){
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let contextStr = null; 
    try{
        let user_provided_otp = common.GetParameterValueFromSessionVars('user_provided_otp', outputContexts, sessionId)
        logger.log('info','verifyOtp()> user_provided_otp= '+ user_provided_otp, { logId: sessionId});

        let otp_from_session_vars = common.GetParameterValueFromSessionVars('otp', outputContexts, sessionId)
        logger.log('info','verifyOtp()> otp_from_session_vars= '+ otp_from_session_vars, { logId: sessionId});

        let serviceType = common.GetParameterValueFromSessionVars('serviceType', outputContexts, sessionId)
        logger.log('info','verifyOtp()> serviceType= '+ serviceType, { logId: sessionId});

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+ sessionId +'/contexts/session_vars';
        contextStr='';
        let text='';
        fulfillmentMessages=''; 
        
        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        //At the start of the chat reset 'noOfTries' value to numeric 0
        if(noOfTries == 'undefined' || noOfTries === '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','increaseNoOfTries()>Existing noOfTries= '+ noOfTries, {logId: sessionId});
        
        let awaiting_otp = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_otp';
        let awaiting_account_info_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_account_info_type';
        let card_info_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/card_info_type';
        let awaiting_mobile_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_mobile_number';        
       // let isAuthenticated = false;
        if(otp_from_session_vars!=undefined){
            noOfTries = noOfTries + 1;
        logger.log('info','increaseNoOfTries()> incremented noOfTries to = '+ noOfTries, {logId: sessionId});
            contextStr = '[{"name":"' + awaiting_otp + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_account_info_type + '","lifespanCount":0,"parameters":{}},{"name":"' + card_info_type + '","lifespanCount":0,"parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
            logger.log('info','verifyOtpFallback()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});

            text = 'Please enter 6 digit valid OTP.';
            fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"}]';                    
        }
        else{
            contextStr = '[{"name":"' + awaiting_mobile_number + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_otp + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_account_info_type + '","lifespanCount":0,"parameters":{}},{"name":"' + card_info_type + '","lifespanCount":0,"parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
            logger.log('info','verifyOtpFallback()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});

            text = 'Sorry, Please enter your 11 digit mobile number again.';
            fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"}]';                     
        }        
        logger.log('info','verifyOtpFallback()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        actionStatus='error';
        logger.log('error', e.stack, { logId: sessionId});
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,''); 
    logger.log('info','verifyOtpFallback()> Response:'+JSON.stringify(responseJson), { logId: sessionId});
    responseToUser.json(responseJson);
}

function validateMobileRechargeAmount (responseToUser, outputContexts,sessionId,queryResult) {
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let contextStr = null; 
    try{
        
        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)         
        logger.log('info','validateMobileRechargeAmount()> Existing noOfTries= '+ noOfTries, {logId: sessionId});
        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+ sessionId +'/contexts/session_vars';
        let mobileRechargeAmount_from_session_vars = common.GetParameterValueFromSessionVars('mobileRechargeAmount', outputContexts, sessionId)
        logger.log('info','validateMobileRechargeAmount()> mobileRechargeAmount_from_session_vars= '+ mobileRechargeAmount_from_session_vars, { logId: sessionId});
        let mobileRechargeType_from_session_vars = common.GetParameterValueFromSessionVars('mobileRechargeType', outputContexts, sessionId);
        logger.log('info','mobileRechargeWithAcntNo()>mobileRechargeType_from_session_vars= '+ mobileRechargeType_from_session_vars, { logId: sessionId});
        let title = '';
        let text='';
        let quickReplies=[];
        fulfillmentMessages = '';
        contextStr='';
        let awaiting_mobile_recharge_amount='';
        let awaiting_mobile_recharge_amount_confirmation='';
        noOfTries = noOfTries + 1;
        logger.log('info','validateMobileRechargeAmount()> incrementing noOfTries= '+ noOfTries, {logId: sessionId});
        if((mobileRechargeType_from_session_vars=='prepaid'&&mobileRechargeAmount_from_session_vars<=1000&&mobileRechargeAmount_from_session_vars>=10)||
           (mobileRechargeType_from_session_vars=='postpaid'&&mobileRechargeAmount_from_session_vars<=10000&&mobileRechargeAmount_from_session_vars>=50)){
            noOfTries = 0;
            contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
            title='Do you confirm the amount BDT '+mobileRechargeAmount_from_session_vars;
            quickReplies = ['"Yes"', '"No"'];
            fulfillmentMessages='[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';          
        }
        else if(noOfTries < 3){
            if(mobileRechargeType_from_session_vars=='prepaid'){
                text='It seems you have provided invalid amount. Please enter an amount between BDT 10 and BDT 1000.'
            }
            else{
                text='It seems you have provided invalid amount. Please enter an amount between BDT 50 and BDT 10000.'
            }
            fulfillmentMessages='[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"text": {"text": ["'+ text +'"]},"platform": "FACEBOOK"}] ';
            awaiting_mobile_recharge_amount = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_mobile_recharge_amount';
            awaiting_mobile_recharge_amount_confirmation = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_mobile_recharge_amount_confirmation';
            contextStr = '[{"name":"' + awaiting_mobile_recharge_amount + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_mobile_recharge_amount_confirmation + '","lifespanCount":0,"parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';                
        }else{ 
            //no more tries left
            events.No_MORE_TRIES(responseToUser);
            return;
        }  
        
        responseJson.fulfillmentMessages =JSON.parse(fulfillmentMessages);
        logger.log('info','validateMobileRechargeAmount()> contextStr= '+ contextStr, {logId: sessionId});
        
        //sessionId|action|intent|input|fulfillment|contextString
       // traversal.nodeTraversal(sessionId,queryResult,'success',responseJson.fulfillmentText,contextStr);
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        actionStatus='error';
        logger.log('error', e.stack, { logId: sessionId});
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,''); 
    logger.log('info','validateMobileRechargeAmount()> Response:'+JSON.stringify(responseJson), {logId: sessionId});
    responseToUser.json(responseJson);
}

function previousMenu (responseToUser, outputContexts,sessionId,queryResult) {
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let contextStr = null; 
    try{
        
        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)         
        logger.log('info','previousMenu()> Existing noOfTries= '+ noOfTries, {logId: sessionId});
        noOfTries = 0;
        logger.log('info','previousMenu()> noOfTries reset to = '+ noOfTries, {logId: sessionId});
        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+ sessionId +'/contexts/session_vars';
        // let serviceType_from_session_vars = common.GetParameterValueFromSessionVars('serviceType', outputContexts, sessionId)
        // logger.log('info','previousMenu()> serviceType_from_session_vars= '+ serviceType_from_session_vars, { logId: sessionId});
        contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
        //We are resetting the 'noOfTries' variable value only
        //Blank fulfillment text will ensure that Dialogflow will use the response from Intent
        let title = 'Okay! What information may I help you with?';
        let quickReplies=[];
        let isTncAgreed_from_session_vars = common.GetParameterValueFromSessionVars('isTncAgreed', outputContexts, sessionId);
        logger.log('info','previousMenu()> isTncAgreed_from_session_vars = '+ isTncAgreed_from_session_vars, {logId: sessionId});
        if(isTncAgreed_from_session_vars!=undefined&&isTncAgreed_from_session_vars=='true'){
            quickReplies = ['"Card Information"', '"Account Information"', '"General Services"'];
        }
        else{
            quickReplies = ['"Banking Information"', '"General Services"', '"FAQ"'];
        }
        // if(serviceType_from_session_vars=='CARD'){
        //     quickReplies = ['"Credit Card"', '"Prepaid Card"', '"Mobile Recharge"'];
        // }
        // else{
        //     quickReplies = ['"Account Balance"', '"Last 5 Transactions"', '"Mobile Recharge"'];
        // }
        fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] '; 
            
        responseJson.fulfillmentMessages =JSON.parse(fulfillmentMessages);
        logger.log('info','previousMenu()> contextStr= '+ contextStr, {logId: sessionId});
        
        //sessionId|action|intent|input|fulfillment|contextString
       // traversal.nodeTraversal(sessionId,queryResult,'success',responseJson.fulfillmentText,contextStr);
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        actionStatus='error';
        logger.log('error', e.stack, { logId: sessionId});
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,''); 
    logger.log('info','previousMenu()> Response:'+JSON.stringify(responseJson), {logId: sessionId});
    responseToUser.json(responseJson);
}



function mobileRechargeAmount (responseToUser, outputContexts,sessionId,queryResult) {
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let contextStr = null; 
    try{
        
        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)         
        logger.log('info','mobileRechargeAmount()> Existing noOfTries= '+ noOfTries, {logId: sessionId});
        noOfTries = 0;
        logger.log('info','mobileRechargeAmount()> noOfTries reset to = '+ noOfTries, {logId: sessionId});
        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+ sessionId +'/contexts/session_vars';
        let mobileRechargeType_from_session_vars = common.GetParameterValueFromSessionVars('mobileRechargeType', outputContexts, sessionId)
        logger.log('info','mobileRechargeAmount()> mobileRechargeType_from_session_vars= '+ mobileRechargeType_from_session_vars, { logId: sessionId});
        contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
        //We are resetting the 'noOfTries' variable value only
        let text=''
        if(mobileRechargeType_from_session_vars=='prepaid'){
            text ='Enter the amount between BDT 10 and BDT 1000 you want to recharge.';
        }
        else{
            text='Enter the amount between BDT 50 and BDT 10000 you want to recharge.';
        }
        fulfillmentMessages='[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"text": {"text": ["'+ text +'"]},"platform": "FACEBOOK"}] ';    
        responseJson.fulfillmentMessages =JSON.parse(fulfillmentMessages);
        logger.log('info','mobileRechargeAmount()> contextStr= '+ contextStr, {logId: sessionId});
        
        //sessionId|action|intent|input|fulfillment|contextString
       // traversal.nodeTraversal(sessionId,queryResult,'success',responseJson.fulfillmentText,contextStr);
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        actionStatus='error';
        logger.log('error', e.stack, { logId: sessionId});
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,''); 
    logger.log('info','mobileRechargeAmount()> Response:'+JSON.stringify(responseJson), {logId: sessionId});
    responseToUser.json(responseJson);
}


/**
 * Reset 'noOfTries' value to 0 and update in 'session_vars' 
 * Blank fulfillment text will ensure that Dialogflow will use the response from Intent
 */
function resetNoOfTries (responseToUser, outputContexts,sessionId,queryResult) {
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let contextStr = null; 
    try{
        // let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)         
        // logger.log('info','resetNoOfTries()> Existing noOfTries= '+ noOfTries, {logId: sessionId});
        let noOfTries = 0;
        logger.log('info','resetNoOfTries()> noOfTries reset to = '+ noOfTries, {logId: sessionId});
        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+ sessionId +'/contexts/session_vars';
        
        contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
        
        //We are resetting the 'noOfTries' variable value only
        //Blank fulfillment text will ensure that Dialogflow will use the response from Intent
        responseJson.fulfillmentText = "";        
        logger.log('info','resetNoOfTries()> contextStr= '+ contextStr, {logId: sessionId});
        
        //sessionId|action|intent|input|fulfillment|contextString
       // traversal.nodeTraversal(sessionId,queryResult,'success',responseJson.fulfillmentText,contextStr);
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        actionStatus='error';
        logger.log('error', e.stack, { logId: sessionId});
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,''); 
    logger.log('info','resetNoOfTries()> Response:'+JSON.stringify(responseJson), {logId: sessionId});
    responseToUser.json(responseJson);
}

/**
 * Increase 'noOfTries' value by 1 and update in 'session_vars' 
 * If tries are less than 3 then, blank fulfillment text will ensure that Dialogflow will use the response from Intent
 * If tries are mre than 2 then , reset all output context lifespan to 0 except 'session_vars and show last message.
 * @param {*} responseToUser 
 * @param {*} outputContexts 
 */
function increaseNoOfTries (responseToUser, outputContexts,sessionId,queryResult) {
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let contextStr = null;     
    try{
        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        //At the start of the chat reset 'noOfTries' value to numeric 0
        if(noOfTries == 'undefined' || noOfTries === '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','increaseNoOfTries()>Existing noOfTries= '+ noOfTries, {logId: sessionId});
        noOfTries = noOfTries + 1;
        logger.log('info','increaseNoOfTries()> incremented noOfTries to = '+ noOfTries, {logId: sessionId});
        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/session_vars';
        contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
        logger.log('info','increaseNoOfTries()> contextStr= '+ contextStr, {logId: sessionId});
        //We are resetting the 'noOfTries' variable value only
        responseJson.fulfillmentText = "";        
        if(noOfTries < 3){  
            //Blank fulfillment text will ensure that Dialogflow will use the response from Intent
            responseJson.fulfillmentText = "";
        }else{
            //no more tries;
            events.No_MORE_TRIES(responseToUser);
            return;            
        }
        //sessionId|action|intent|input|output|fulfillment|contextString
        //traversal.nodeTraversal(sessionId+'|'+action+'|'+intent.displayName+'|'+queryText+'|||'+contextStr);
       // traversal.nodeTraversal(sessionId,queryResult,'success',responseJson.fulfillmentText,contextStr);
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        actionStatus='error';
        logger.log('error', e.stack, { logId: sessionId});
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,''); 
    logger.log('info','increaseNoOfTries()> Response:'+JSON.stringify(responseJson), {logId: sessionId});
    responseToUser.json(responseJson);
}

/**
 * First verify the mobile number. If its valid then generate OTP. If both the web method calls are successful then reset 'numberOfTries'
 * else increase the number of tries and ask user to try again
 * @param {*} responseToUser 
 * @param {*} outputContexts 
 */
function verifyMobileNumberAndGetOtp(responseToUser, outputContexts,sessionId,queryResult){
    try{
        let serviceType = common.GetParameterValueFromSessionVars('serviceType', outputContexts, sessionId)
        logger.log('info','verifyMobileNumberAndGetOtp()> serviceType= '+ serviceType, {logId: sessionId});

        if(serviceType == 'ACCOUNT'){
            account.verifyMobileNumberAndGetOtp(responseToUser, outputContexts, sessionId,queryResult);
        }else{
            card.verifyMobileNumberAndGetOtp(responseToUser, outputContexts, sessionId,queryResult);
        }        
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
    }  
}

/**
 * Verify OTP. If its matching and service type is'ACCOUNT' then reset lifespan of 'card_info_type' context to 0
 * If service type is 'CARD' then reset lifespan of 'awaiting_account_info_type' context to 0
 * If its not matching then increase the number of tries and ask user to try again
 * @param {*} responseToUser 
 * @param {*} outputContexts 
 */
async function verifyOtp(responseToUser, outputContexts,sessionId,queryResult){
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let contextStr = null;
    try{
        fulfillmentMessages = null;
        let text = "Error";
        let title = null;
        let quickReplies = null;
        let session_vars = null;

        //used to increase the tries in case otp check fails
        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','verifyOtp()>Existing noOfTries= '+ noOfTries, { logId: sessionId});

        let user_provided_otp = common.GetParameterValueFromSessionVars('user_provided_otp', outputContexts, sessionId)
        logger.log('info','verifyOtp()> user_provided_otp= '+ user_provided_otp, { logId: sessionId});

        let otp_from_session_vars = common.GetParameterValueFromSessionVars('otp', outputContexts, sessionId)
        logger.log('info','verifyOtp()> otp_from_session_vars= '+ otp_from_session_vars, { logId: sessionId});

        let serviceType = common.GetParameterValueFromSessionVars('serviceType', outputContexts, sessionId)
        logger.log('info','verifyOtp()> serviceType= '+ serviceType, { logId: sessionId});

        let otpTimestamp = common.GetParameterValueFromSessionVars('otpTimestamp', outputContexts, sessionId)
        logger.log('info','verifyOtp()> otpTimestamp= '+ otpTimestamp, { logId: sessionId});
        let milliSecondsSinceOtpGeneration= (new Date().getTime() - otpTimestamp);
        logger.log('info','verifyOtp()> milliSecondsSinceOtpGeneration= '+ milliSecondsSinceOtpGeneration, { logId: sessionId});
        logger.log('info','verifyOtp()> from config file OTP_TIMEOUT_MS= '+ OTP_TIMEOUT_MS, { logId: sessionId});

        session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+ sessionId +'/contexts/session_vars';
          
        let isAuthenticated = false;
        if(otp_from_session_vars!=undefined){
            if(milliSecondsSinceOtpGeneration > OTP_TIMEOUT_MS){          
                noOfTries = noOfTries + 1;
                logger.log('info','verifyOtp()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});

                if(noOfTries < 3){
                    //User still has tries left.
                    let mobileNumber = common.GetParameterValueFromSessionVars('mobileNumber', outputContexts, sessionId)
                    logger.log('info','account.verifyMobileNumberAndGetOtp()>mobileNumber= ' + mobileNumber, { logId: sessionId}); 

                    let serviceType = common.GetParameterValueFromSessionVars('serviceType', outputContexts, sessionId)
                    logger.log('info','account.verifyMobileNumberAndGetOtp()> serviceType= '+ serviceType, { logId: sessionId});

                    logger.log('info','verifyOtp()> OTP time lapsed, generating new OTP', { logId: sessionId});
                    let result = await ebl.botOtp(mobileNumber, serviceType,common.getSessionId(outputContexts))
                    logger.log('info','verifyOtp()> botOtp result= '+ JSON.stringify(result), { logId: sessionId});

                    if(result == 'timeout'){  
                        actionStatus='timeout';
                        eblActionStatus='timeout';                        
                            //User still has tries left. Enabling 'awaiting_mobile_number' context and 
                            //disabling the 'awaiting_account_info_type' and card_info_type context                 
                            let awaiting_mobile_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_mobile_number';
                            let awaiting_account_info_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_account_info_type';
                            let awaiting_card_info_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_card_info_type';
                            contextStr = '[{"name":"' + awaiting_mobile_number + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_account_info_type + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_card_info_type + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                            logger.log('info','verifyOtp()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});

                            text = 'Sorry, it seems that there is an issue which is causing a delay. Please enter your 11 digit mobile number';
                            fulfillmentMessages = '[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"text": {"text": ["'+ text +'"]},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';                    
                
                            logger.log('info','verifyOtp()> EBL webmethod timedout, asking user to enter again', { logId: sessionId});
                                   
                    }else{
                        let errorCode = result.BototpResult.ERROR_CODE;
                        logger.log('info','verifyOtp()> botOtp errorCode= ' + errorCode, { logId: sessionId});
                        if(errorCode == '0000' || errorCode == '000'){
                            let isValidMobileNumber = "yes";
                            let otp = result.BototpResult.OTP;
                            logger.log('info','verifyOtp()>otp= ' + otp, { logId: sessionId});
                            let otpTimestamp= new Date().getTime();
                            
                            noOfTries = 0;
                            logger.log('info','verifyOtp()> noOfTries reset to = '+ noOfTries, { logId: sessionId});      
                             
                            //Enabling 'awaiting_otp' context and 
                            //disabling the 'awaiting_account_info_type' and card_info_type context                 
                            let awaiting_otp = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_otp';
                            let awaiting_account_info_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_account_info_type';
                            let awaiting_card_info_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_card_info_type';
                            contextStr = '[{"name":"' + awaiting_otp + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_account_info_type + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_card_info_type + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +', "isValidMobileNumber":"'+ isValidMobileNumber +'", "otp":"'+ otp +'", "otpTimestamp":"'+ otpTimestamp +'"}}]';
                            
                            logger.log('info','verifyOtp()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});
                            text = 'Last OTP has expired, please enter the new OTP(one time password) you have received to confirm your identity.';  
                            fulfillmentMessages = '[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"text": {"text": ["'+ text +'"]},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';                    
                            //traversal.nodeTraversal(sessionId,queryResult,'error',fulfillmentMessages,contextStr);
                           // eblActionStatus='success';
                        }else{
                            ////OTP request failed            
                            events.ERROR(responseToUser,sessionId,queryResult,fulfillmentMessages,contextStr);
                            return;                             
                        }  
                    }
                }else{ 
                    //no more tries left
                    events.No_MORE_TRIES(responseToUser);
                    return;
                } 
            }
            else if(user_provided_otp == otp_from_session_vars){
                //add this in session_vars
                isAuthenticated= true;
                logger.log('info','verifyOtp()> OTP check successful. isAuthenticated= '+ isAuthenticated, { logId: sessionId});
                noOfTries = 0;
                logger.log('info','verifyOtp()> noOfTries reset to = '+ noOfTries, { logId: sessionId});

                if(serviceType == 'ACCOUNT'){
                    //Since serviceType is 'ACCOUNT' removing the 'awaiting_card_info_type' context
                    let awaiting_card_info_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_card_info_type';
                    contextStr = '[{"name":"' + awaiting_card_info_type + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +' , "isAccountAuthenticated":"'+ isAuthenticated +'"}}]';
                    logger.log('info','verifyOtp()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});
                    
                    text = 'Thank you for validating your identity'; 
                    title = 'Okay! What information may I help you with?';
                    quickReplies = ['"Account Balance"', '"Last 5 Transactions"', '"Mobile Recharge"'];
                }else{
                    //Since serviceType is 'CARD' removing the 'awaiting_account_info_type' context
                    let awaiting_account_info_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_account_info_type';
                    contextStr = '[{"name":"' + awaiting_account_info_type + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +', "isCardAuthenticated":"'+ isAuthenticated +'"}}]';
                    logger.log('info','verifyOtp()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});

                    //Display only available options to the user
                    let clientIds = common.GetParameterValueFromSessionVars('clientIds', outputContexts, sessionId);

                    clientIds = clientIds + ''; //to avoid TypeError: clientIds.split is not a function
                    let clientIdsArray = clientIds.split(',');
                    let creditCardArray = [];
                    let prepaidCardArray = [];
                    clientIdsArray.forEach(function(element) {
                        if(element.substring(0,2) == 'CR'){
                            creditCardArray.push(clientIds.split(' ')[1])
                        }
                        if(element.substring(0,2) == 'PP'){
                            prepaidCardArray.push(clientIds.split(' ')[1])
                        }
                    });
                    logger.log('info','getCreditCardNumbers()>No of credit Cards= ' + creditCardArray.length, { logId: sessionId});
                    logger.log('info','getCreditCardNumbers()>No of prepaid Cards= ' + prepaidCardArray.length, { logId: sessionId});
                    
                    text = 'Thank you for validating your identity'; 
                    title = 'Okay! What information may I help you with?';
                    if(creditCardArray.length >=1 && prepaidCardArray.length >= 1){
                        quickReplies = ['"Credit Card"', '"Prepaid Card"', '"Mobile Recharge"'];
                    }else if(creditCardArray.length >=1){
                        quickReplies = ['"Credit Card"', '"Mobile Recharge"'];
                    }else if(prepaidCardArray.length >=1){
                        quickReplies = ['"Prepaid Card"', '"Mobile Recharge"'];
                    }else{
                        quickReplies = ['"Mobile Recharge"'];
                    }                
                }                         
                fulfillmentMessages = '[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"text": {"text": ["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';                    
            }else{
                ////OTP check failed            
                noOfTries = noOfTries + 1;
                logger.log('info','verifyOtp()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});           
                logger.log('info','verifyOtp()> OTP check failed, asking user to try again', { logId: sessionId});

                if(noOfTries < 3){
                    //User still has tries left. Enabling the input context(awaiting_otp) and 
                    //disabling the output context(card_info_type, awaiting_account_info_type)
                    
                    let awaiting_otp = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_otp';
                    let awaiting_account_info_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_account_info_type';
                    let card_info_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/card_info_type';
        
                    contextStr = '[{"name":"' + awaiting_otp + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_account_info_type + '","lifespanCount":0,"parameters":{}},{"name":"' + card_info_type + '","lifespanCount":0,"parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +', "isAuthenticated":"'+ isAuthenticated +'"}}]';
                    logger.log('info','verifyOtp()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});
        
                    text = 'Sorry, it seems OTP(one time password) is wrong. Please type it again.';
                    fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"}]';            
                    
                }else{ 
                    //no more tries left
                    events.No_MORE_TRIES(responseToUser);
                    return;
                }               
            }
        }
        else{
            let awaiting_otp = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_otp';
            let awaiting_account_info_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_account_info_type';
            let card_info_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/card_info_type';
            let awaiting_mobile_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_mobile_number';        
       
            contextStr = '[{"name":"' + awaiting_mobile_number + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_otp + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_account_info_type + '","lifespanCount":0,"parameters":{}},{"name":"' + card_info_type + '","lifespanCount":0,"parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
            logger.log('info','verifyOtp()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});

            text = 'Sorry, Please enter your 11 digit mobile number again.';
            fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"}]';                     
        }        
        logger.log('info','verifyOtp()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        actionStatus='error'
        logger.log('error', e.stack, { logId: sessionId});
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,''); 
    logger.log('info','verifyOtp()> Response:'+JSON.stringify(responseJson), { logId: sessionId});
    responseToUser.json(responseJson);
}

function getCreditCard_Last5Txn_Limit_Bal(responseToUser, outputContexts,sessionId,queryResult){
    try{
        let creditCardAssistanceType = common.GetParameterValueFromSessionVars('creditCardAssistanceType', outputContexts, sessionId);
        logger.log('info','getCreditCard_Last5Txn_Limit_Bal()>creditCardAssistanceType= '+ creditCardAssistanceType, { logId: sessionId});

        if(creditCardAssistanceType == 'last5txn'){
            card.getCreditCardLast5Txn(responseToUser, outputContexts, sessionId,queryResult);
        }else{
            card.getCreditCardBal(responseToUser, outputContexts, sessionId,queryResult);
        }        
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
    }  
}

function getPrepaidCard_Bal_Last5Txn(responseToUser, outputContexts,sessionId,queryResult){
    try{
        let prepaidCardAssistanceType = common.GetParameterValueFromSessionVars('prepaidCardAssistanceType', outputContexts, sessionId);
        logger.log('info','getPrepaidCard_Bal_Last5Txn()>prepaidCardAssistanceType= '+ prepaidCardAssistanceType, { logId: sessionId});

        if(prepaidCardAssistanceType == 'last5txn'){
            card.getPrepaidCardLast5Txn(responseToUser, outputContexts, sessionId,queryResult);
        }else{
            card.getPrepaidCardBal(responseToUser, outputContexts, sessionId,queryResult);
        }        
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
    }  
}
//mobile recharge web methods

async function mobileRecharge(responseToUser, outputContexts,sessionId,queryResult) {
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let contextStr = null;
    let accOrCardNo=null;
    try{
        fulfillmentMessages = null;
        let title = null;
        let quickReplies =[];

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','mobileRecharge()>Existing noOfTries= '+ noOfTries, { logId: sessionId}); 

        let serviceType = common.GetParameterValueFromSessionVars('serviceType', outputContexts, sessionId)
        logger.log('info','mobileRecharge()> serviceType= '+ serviceType, { logId: sessionId});       
		
		let accountInfo = common.GetParameterValueFromSessionVars('accountInfo', outputContexts, sessionId)
        logger.log('info','mobileRecharge()>accountInfo= ' + JSON.stringify(accountInfo), { logId: sessionId});
		
		let noOfAccounts = common.GetParameterValueFromSessionVars('noOfAccounts', outputContexts, sessionId)
        logger.log('info','mobileRecharge()>noOfAccounts= ' + noOfAccounts, { logId: sessionId});

        let cardType = common.GetParameterValueFromSessionVars('cardType', outputContexts, sessionId)
        logger.log('info','mobileRecharge()>cardType= ' + cardType, { logId: sessionId});

        let selectedCreditCardNumber = common.GetParameterValueFromSessionVars('selectedCreditCardNumber', outputContexts, sessionId);
        logger.log('info','mobileRecharge()>selectedCreditCardNumber= '+ selectedCreditCardNumber, { logId: sessionId});

        let selectedPrepaidCardNumber = common.GetParameterValueFromSessionVars('selectedPrepaidCardNumber', outputContexts, sessionId);
        logger.log('info','mobileRecharge()>selectedPrepaidCardNumber= '+ selectedPrepaidCardNumber, { logId: sessionId});

        let mobileRechargeType = common.GetParameterValueFromSessionVars('mobileRechargeType', outputContexts, sessionId);
        logger.log('info','mobileRecharge()>mobileRechargeType= '+ mobileRechargeType, { logId: sessionId});

        let mobileRechargeNumber = common.GetParameterValueFromSessionVars('mobileRechargeNumber', outputContexts, sessionId);
        logger.log('info','mobileRecharge()>mobileRechargeNumber= '+ mobileRechargeNumber, { logId: sessionId});

        let mobileNumber = common.GetParameterValueFromSessionVars('mobileNumber', outputContexts, sessionId);
        logger.log('info','mobileRecharge()>mobileNumber= '+ mobileNumber, { logId: sessionId});

        let mobileRechargeAmount = common.GetParameterValueFromSessionVars('mobileRechargeAmount', outputContexts, sessionId);
        logger.log('info','mobileRecharge()>mobileRechargeAmount= '+ mobileRechargeAmount, { logId: sessionId});    
        
        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/session_vars';
               
        let selectedAcntNoForMobRecharge = null;
              
                   
        let result = null;
        if(serviceType == 'ACCOUNT'){
            //If no of acnts are more than 1 and account number not yet selected then go to 'account.multipleAccounts'
            if (noOfAccounts > 1){ 
                account.multipleAccounts(responseToUser, outputContexts, sessionId,queryResult);
                return;                      
            }else{
                //if user has single account                  
                selectedAcntNoForMobRecharge = accountInfo[0]["CUSTACCTNO"].toString();
                accOrCardNo=selectedAcntNoForMobRecharge;
                logger.log('info','mobileRecharge()>User has single account, selectedAcntNoForMobRecharge = ' + selectedAcntNoForMobRecharge, { logId: sessionId});
            }  
            result = await ebl.mobileRechargeDia(selectedAcntNoForMobRecharge, mobileRechargePaymentType (serviceType, mobileRechargeType),mobileNumber , mobileRechargeAmount, mobileRechargeNumber,sessionId)
        }else{
            if(cardType == 'prepaid'){
                result =await ebl.mobileRechargeDia(selectedPrepaidCardNumber, mobileRechargePaymentType (serviceType, mobileRechargeType),mobileNumber , mobileRechargeAmount, mobileRechargeNumber, sessionId)
                accOrCardNo=selectedPrepaidCardNumber.substring(0, 4) + "****" +selectedPrepaidCardNumber.substring(selectedPrepaidCardNumber.length - 4, selectedPrepaidCardNumber.length);
            }else{
                result =await ebl.mobileRechargeDia(selectedCreditCardNumber, mobileRechargePaymentType (serviceType, mobileRechargeType),mobileNumber , mobileRechargeAmount, mobileRechargeNumber, sessionId)
                accOrCardNo=selectedCreditCardNumber.substring(0, 4) + "****" +selectedCreditCardNumber.substring(selectedCreditCardNumber.length - 4, selectedCreditCardNumber.length);
            }            
        }
        
        logger.log('info','mobileRecharge()> result: '+ JSON.stringify(result), { logId: sessionId});
        if(result == 'timeout'){
            //EBL webmethod timedout 
            actionStatus='timeout';
            eblActionStatus='timeout';  
            logger.log('info','mobileRecharge()> EBL webmethod timedout, user will get status via sms', { logId: sessionId});
            let text = 'Thanks for providing the inputs, we are processsing your request you will shortly recieve an sms';
            title="Is there anything else I can help you with?";
            quickReplies = ['"Yes"','"No"'];
            fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]';  
            noOfTries = 0;
            logger.log('info','mobileRecharge()> noOfTries reset to  = '+ noOfTries, { logId: sessionId});
            contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';             
/*
            logger.log('info','mobileRecharge()> EBL webmethod timedout, asking user to enter again', { logId: sessionId});       
            noOfTries = noOfTries + 1;
            logger.log('info','mobileRecharge()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});
            if(noOfTries < 3){
                logger.log('info','mobileRecharge()>User still has tries left, asking user to try again.', { logId: sessionId});
                title = 'Sorry, it seems there is some delay from backend. Do you confirm the amount BDT ' + mobileRechargeAmount;
                quickReplies = ['"Yes"', '"No"'];
                fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                    
                //disabling the context 'awaiting_anything_else_choice' and adding the context 'awaiting_mobile_recharge_amount_confirmation'
                let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_anything_else_choice';
                let awaiting_mobile_recharge_amount_confirmation = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_mobile_recharge_amount_confirmation';
                contextStr = '[{"name":"' + awaiting_anything_else_choice + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_mobile_recharge_amount_confirmation + '", "lifespanCount":1, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';                        
            
            }
            else 
            {   //no more tries left
                events.No_MORE_TRIES(responseToUser);
                return;   
            }*/
        }else{
            let isSuccess = result.MobileRechargeBillPaymentDiaRes.ISSUCCESS;
            logger.log('info','mobileRecharge()>ISSUCCESS val= ' + isSuccess, { logId: sessionId}); 
            let text='';
            if(isSuccess == 'Y'){
                eblActionStatus='success'
                let refNo = result.MobileRechargeBillPaymentDiaRes.EBL_REF_NO;
                let errorCode = result.MobileRechargeBillPaymentDiaRes.ERRCODE;
                logger.log('info','mobileRecharge()>refNo= ' + refNo, { logId: sessionId});
                logger.log('info','mobileRecharge()>errorCode= ' + errorCode, { logId: sessionId});
                text = 'Thanks for providing the inputs, your mobile recharge is successful';
                title="Is there anything else I can help you with?";
                quickReplies = ['"Yes"','"No"'];
                fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]';  
                noOfTries = 0;
                logger.log('info','mobileRecharge()> noOfTries reset to  = '+ noOfTries, { logId: sessionId});
                contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';             
            }else{
                ////get mobileRechargeDia failed                 
                // events.ERROR(responseToUser);
                // return;
                eblActionStatus='declined'
                text = 'Transaction declined.';
                title="Do you want to try again?";
                quickReplies = ['"Yes"','"No"'];
                fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]';  
                noOfTries = 0;
                logger.log('info','mobileRecharge()> noOfTries reset to  = '+ noOfTries, { logId: sessionId});
                // contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]'; 
                let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_anything_else_choice';
                let awaiting_mobile_recharge_retry = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_mobile_recharge_retry';
                contextStr = '[{"name":"' + awaiting_mobile_recharge_retry + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_anything_else_choice + '","lifespanCount":0,"parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';                                
                  
            }
        }        
        logger.log('info','mobileRecharge()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});  
        logger.log('info','mobileRecharge()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        actionStatus='error'
        logger.log('error', e.stack, { logId: sessionId});
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,accOrCardNo); 
    logger.log('info','mobileRecharge()> Response:'+JSON.stringify(responseJson), { logId: sessionId});
    responseToUser.json(responseJson);
}

async function mobileRechargeWithAcntNo(responseToUser, outputContexts,sessionId,queryResult) {
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let contextStr = null;
    let accOrCardNo=null;
    try{
        fulfillmentMessages = null;
        let title = null;
        let quickReplies = [];

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','mobileRechargeWithAcntNo()>Existing noOfTries= '+ noOfTries, { logId: sessionId});

        let serviceType = common.GetParameterValueFromSessionVars('serviceType', outputContexts, sessionId)
        logger.log('info','mobileRechargeWithAcntNo()> serviceType= '+ serviceType, { logId: sessionId});      
		
		let accountInfo = common.GetParameterValueFromSessionVars('accountInfo', outputContexts, sessionId)
        logger.log('info','mobileRechargeWithAcntNo()>accountInfo= ' + accountInfo, { logId: sessionId});
		
		let noOfAccounts = common.GetParameterValueFromSessionVars('noOfAccounts', outputContexts, sessionId)
        logger.log('info','mobileRechargeWithAcntNo()>noOfAccounts= ' + noOfAccounts, { logId: sessionId});

        let cardType = common.GetParameterValueFromSessionVars('cardType', outputContexts, sessionId)
        logger.log('info','mobileRechargeWithAcntNo()>cardType= ' + cardType, { logId: sessionId});

        let userProvidedAcntNoForRecharge = common.GetParameterValueFromSessionVars('userProvidedAcntNoForRecharge', outputContexts, sessionId)
        logger.log('info','mobileRechargeWithAcntNo()>userProvidedAcntNoForRecharge= ' + userProvidedAcntNoForRecharge, { logId: sessionId});

        let selectedCreditCardNumber = common.GetParameterValueFromSessionVars('selectedCreditCardNumber', outputContexts, sessionId);
        logger.log('info','mobileRechargeWithAcntNo()>selectedCreditCardNumber= '+ selectedCreditCardNumber, { logId: sessionId});

        let selectedPrepaidCardNumber = common.GetParameterValueFromSessionVars('selectedPrepaidCardNumber', outputContexts, sessionId);
        logger.log('info','mobileRechargeWithAcntNo()>selectedPrepaidCardNumber= '+ selectedPrepaidCardNumber, { logId: sessionId});

        let mobileRechargeType = common.GetParameterValueFromSessionVars('mobileRechargeType', outputContexts, sessionId);
        logger.log('info','mobileRechargeWithAcntNo()>mobileRechargeType= '+ mobileRechargeType, { logId: sessionId});

        let mobileRechargeNumber = common.GetParameterValueFromSessionVars('mobileRechargeNumber', outputContexts, sessionId);
        logger.log('info','mobileRechargeWithAcntNo()>mobileRechargeNumber= '+ mobileRechargeNumber, { logId: sessionId});

        let mobileRechargeAmount = common.GetParameterValueFromSessionVars('mobileRechargeAmount', outputContexts, sessionId);
        logger.log('info','mobileRechargeWithAcntNo()>mobileRechargeAmount= '+ mobileRechargeAmount, { logId: sessionId});    
        
        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/session_vars';
       
        let i = 0;
        let accountNumber_plain = null;
        let accountNumber_hashed = null;
        let isAccountNumberMatching = false;
        let selectedAcntNoForMobRecharge = null
        let accountListForMobileRecharge=[];
        let j=0;
        //creating new array accountListForMobileRecharge
        //this array is required, since original variable accountInfo has list of all accounts-savings,current etc..
        //accountListForMobileRecharge array will only contain savings and current accounts
        //since user will be selecting the serial number from account list containg only savings 
        //and current account
        //this serial number might not match with accountInfo serial number
        for(i=0; i< noOfAccounts; i++){
            if(accountInfo[i]["AC_CLASS_TYPE"].toString()=='S'||accountInfo[i]["AC_CLASS_TYPE"].toString()=='C'){
                accountListForMobileRecharge[j]=accountInfo[i];
                j++;
            }
        }
        logger.log('info','mobileRechargeWithAcntNo()> accountListForMobileRecharge = '+ JSON.stringify(accountListForMobileRecharge), { logId: sessionId});
        
        //Here we are checking for serial number and mapping with an account number
        //User can enter serial number or entire account number in masked or any other format
        //we are taking the user provided number and checking 
        //if the accountListForMobileRecharge array contains that object
        //for instance accountListForMobileRecharge[1]will have some value where as 
        //and it will assign acctual account number here
        //accountListForMobileRecharge[1234****1234] will be undefined so the 
        //variable will remain as is and contain account number
        if(accountListForMobileRecharge[userProvidedAcntNoForRecharge-1]!=undefined && accountListForMobileRecharge[userProvidedAcntNoForRecharge-1]["CUSTACCTNO"]!=undefined){
            logger.log('info','mobileRechargeWithAcntNo()> accountListForMobileRecharge[userProvidedAcntNoForRecharge-1] = '+ JSON.stringify(accountListForMobileRecharge[userProvidedAcntNoForRecharge-1]), { logId: sessionId});
            logger.log('info','mobileRechargeWithAcntNo()> accountListForMobileRecharge[userProvidedAcntNoForRecharge-1]["CUSTACCTNO"] = '+ accountListForMobileRecharge[userProvidedAcntNoForRecharge-1]["CUSTACCTNO"], { logId: sessionId});
            userProvidedAcntNoForRecharge=accountListForMobileRecharge[userProvidedAcntNoForRecharge-1]["CUSTACCTNO"].toString();
            
        }
        for(i=0; i< noOfAccounts; i++){
            accountNumber_plain = accountInfo[i]["CUSTACCTNO"].toString();
            accountNumber_hashed = accountNumber_plain.substring(0, 4) + "****" +accountNumber_plain.substring(accountNumber_plain.length - 4, accountNumber_plain.length);
            //mathcing plain full or hashed full last 4 digits of account number
            if(userProvidedAcntNoForRecharge == accountNumber_plain || userProvidedAcntNoForRecharge == accountNumber_hashed || userProvidedAcntNoForRecharge == accountNumber_plain.substring(accountNumber_plain.length - 4, accountNumber_plain.length))
            {
                isAccountNumberMatching = true;
                selectedAcntNoForMobRecharge = accountNumber_plain; 
                logger.log('info','mobileRechargeWithAcntNo()>Account number is matching. selectedAcntNoForMobRecharge=  ' + selectedAcntNoForMobRecharge, { logId: sessionId});                                              
                break;
            }              
        }
        logger.log('info','mobileRechargeWithAcntNo()> isAccountNumberMatching = '+ isAccountNumberMatching, { logId: sessionId});
        if(isAccountNumberMatching == false){
            ////Account number is NOT  matching   
            noOfTries = noOfTries + 1;
            logger.log('info','mobileRechargeWithAcntNo()> Account number is NOT  matching, incremented noOfTries to = '+ noOfTries, { logId: sessionId});  
            if(noOfTries < 3){
                logger.log('info','mobileRechargeWithAcntNo()>User still has tries left, asking user to try again.', { logId: sessionId});
                i = 0; 
                let j=0;      
                let account_number = null;   
                let accountList='';
                for(i=0; i< noOfAccounts; i++){
                    account_number = accountInfo[i]["CUSTACCTNO"].toString();
                    logger.log('info','mobileRechargeWithAcntNo()>i= '+ i + ", account_number > = " + account_number, { logId: sessionId});
                    account_number = account_number.substring(0, 4) + "****" +account_number.substring(account_number.length - 4, account_number.length)
                    //quickReplies.push('"'+ account_number +'"');
                    if(accountInfo[i]["AC_CLASS_TYPE"].toString()=='S'||accountInfo[i]["AC_CLASS_TYPE"].toString()=='C'){
                        accountList+='\\n'+(++j)+'. '+account_number;
                    }
                }
                logger.log('info','mobileRechargeWithAcntNo()>accountList= ' + accountList, { logId: sessionId});
                let title = "Sorry, account number is not matching. Please type in the serial number of the account number you wish to pay the mobile recharge bill from. For example to pay the bill from 1st account, type 1."+accountList;
                fulfillmentMessages = '[{"text": {"text":["'+ title+'"]},"platform": "FACEBOOK"},{"text": {"text":["'+title+'"]},"platform": "VIBER"}]';                     
               
                //enabling 'awaiting_account_number_for_mobile_recharge' context and disabling the 'awaiting_anything_else_choice' context
                let awaiting_account_number_for_mobile_recharge = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_account_number_for_mobile_recharge';
                let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_anything_else_choice';
                contextStr = '[{"name":"' + awaiting_account_number_for_mobile_recharge + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_anything_else_choice + '","lifespanCount":0,"parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';                                
               
            }
            else 
            {   //no more tries left
                events.No_MORE_TRIES(responseToUser);
                return;   
            }
        }
        else{
            let mobileNumber = common.GetParameterValueFromSessionVars('mobileNumber', outputContexts, sessionId);
            logger.log('info','mobileRecharge()>mobileNumber= '+ mobileNumber, { logId: sessionId});

            let result =await ebl.mobileRechargeDia(selectedAcntNoForMobRecharge, mobileRechargePaymentType (serviceType, mobileRechargeType),mobileNumber , mobileRechargeAmount, mobileRechargeNumber, sessionId)
            accOrCardNo=selectedAcntNoForMobRecharge;
            logger.log('info','mobileRechargeWithAcntNo()> result: '+ JSON.stringify(result), { logId: sessionId});
            if(result == 'timeout'){
                //EBL webmethod timedout   
                eblActionStatus='timeout';
                actionStatus='timeout';
                let text = 'Thanks for providing your input, we are processing your request, you will shortly receive an sms.';
                title="Is there anything else I can help you with?";
                quickReplies = ['"Yes"','"No"'];
                fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]';  
                noOfTries = 0;
                logger.log('info','mobileRechargeWithAcntNo()> noOfTries reset to  = '+ noOfTries, { logId: sessionId});
                contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';                             
            
            /* logger.log('info','mobileRechargeWithAcntNo()> EBL webmethod timedout, asking user to enter again', { logId: sessionId});        
                noOfTries = noOfTries + 1;
                logger.log('info','mobileRechargeWithAcntNo()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});
                //
                if(noOfTries < 3){
                    logger.log('info','mobileRechargeWithAcntNo()>User still has tries left, asking user to try again.', { logId: sessionId});
                    i = 0;       
                    let account_number = null;         
                    for(i=0; i< noOfAccounts; i++){
                        account_number = accountInfo[i]["CUSTACCTNO"].toString();
                        logger.log('info','mobileRechargeWithAcntNo()>i= '+ i + ", account_number > = " + account_number);
                        account_number = account_number.substring(0, 4) + "****" +account_number.substring(account_number.length - 4, account_number.length)
                        quickReplies.push('"'+ account_number +'"');
                    }
                    logger.log('info','mobileRechargeWithAcntNo()>quickReplies= ' + quickReplies, { logId: sessionId});
                    title = "Sorry, it seems there is some delay from backend. Please select or enter last four digits of account number"
                    fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';        
                    //enabling 'awaiting_account_number_for_mobile_recharge' context and disabling the 'awaiting_anything_else_choice' context
                    let awaiting_account_number_for_mobile_recharge = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_account_number_for_mobile_recharge';
                    let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_anything_else_choice';
                    contextStr = '[{"name":"' + awaiting_account_number_for_mobile_recharge + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_anything_else_choice + '","lifespanCount":0,"parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';                             
            
                }
                else 
                {   //no more tries left
                    events.No_MORE_TRIES(responseToUser);
                    return;   
                }*/
            }else{
                let isSuccess =  result.MobileRechargeBillPaymentDiaRes.ISSUCCESS;
                let text='';
                logger.log('info','mobileRechargeWithAcntNo()>ISSUCCESS val= ' + isSuccess, { logId: sessionId}); 
                if(isSuccess == 'Y'){
                    eblActionStatus='success'
                    let refNo = result.MobileRechargeBillPaymentDiaRes.EBL_REF_NO;
                    let errorCode = result.MobileRechargeBillPaymentDiaRes.ERRCODE;
                    logger.log('info','mobileRechargeWithAcntNo()>refNo= ' + refNo, { logId: sessionId});
                    logger.log('info','mobileRechargeWithAcntNo()>errorCode= ' + errorCode, { logId: sessionId});
                    text = 'Thanks for providing the inputs, your mobile recharge is successful';
                    title="Is there anything else I can help you with?";
                    quickReplies = ['"Yes"','"No"'];
                    fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]';  
                    noOfTries = 0;
                    logger.log('info','mobileRechargeWithAcntNo()> noOfTries reset to  = '+ noOfTries, { logId: sessionId});
                    contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';                             
                }else{
                    ////get mobileRechargeDia failed                 
                    // events.ERROR(responseToUser);
                    // return;
                    eblActionStatus='declined'
                    text = 'Transaction declined.';
                    title="Do you want to try again?";
                    quickReplies = ['"Yes"','"No"'];
                    fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]';  
                    noOfTries = 0;
                    logger.log('info','mobileRecharge()> noOfTries reset to  = '+ noOfTries, { logId: sessionId});
                    // contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]'; 
                    let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_anything_else_choice';
                    let awaiting_mobile_recharge_retry = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+sessionId+'/contexts/awaiting_mobile_recharge_retry';
                    contextStr = '[{"name":"' + awaiting_mobile_recharge_retry + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_anything_else_choice + '","lifespanCount":0,"parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';                                
                  
                }
            }  
        }      
        logger.log('info','mobileRechargeWithAcntNo()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});  
        logger.log('info','mobileRechargeWithAcntNo()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);    
    }catch(e){
        actionStatus='error'
        logger.log('error', e.stack, { logId: sessionId});
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,accOrCardNo); 
    logger.log('info','mobileRechargeWithAcntNo()> Response:'+JSON.stringify(responseJson), { logId: sessionId});
    responseToUser.json(responseJson);
}

function mobileRechargePaymentType (serviceType, mobileRechargeType) {
    let paymentType = null;
    
    try{
        if(serviceType == 'ACCOUNT' && mobileRechargeType == 'prepaid'){
            paymentType = 1;
        }else if(serviceType == 'ACCOUNT' && mobileRechargeType == 'postpaid'){
            paymentType = 2;
        }else if(serviceType == 'CARD' && mobileRechargeType == 'prepaid'){
            paymentType = 3;
        }else if(serviceType == 'CARD' && mobileRechargeType == 'postpaid'){
            paymentType = 4;
        }else{
            logger.log('info','mobileRechargePaymentType()> Unable to get mobile recharge payment type', { logId: sessionId});
        }
        // logger.log('info','mobileRechargeDia()> result: '+ JSON.stringify(result));
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
    }  
    logger.log('info','mobileRechargePaymentType()> paymentType= '+ paymentType, { logId: sessionId});
    return paymentType    
}


function test (responseToUser, outputContexts) {
    
    try{
        
        // let result =await ebl.getBankAccountDetails('mobileNumber')
        // logger.log('info','account.verifyMobileNumberAndGetOtp()> result: '+ JSON.stringify(result), { logId: sessionId});

        //let result =await ebl.botOtp('mobileNumber', 'serviceType')
        // logger.log('info','account.verifyMobileNumberAndGetOtp()> botOtp result= '+ JSON.stringify(result), { logId: sessionId});

        //let result =await ebl.getBankAccountLast5Txn('account_number')
        // logger.log('info','getBankAccountLast5Txn()> result: '+ JSON.stringify(result), { logId: sessionId});  

        //let result = ebl.phoneCheck('mobileNumber', 'serviceType')

        //let result =await ebl.cardBal('selectedCreditCardNumber', 'clientId', 'creditCardCurrency');
        // logger.log('info','getCreditCardBal()> cardBal result: '+ JSON.stringify(result), { logId: sessionId});

        //let result =await ebl.cardTransactions('selectedCreditCardNumber', 'creditCardCurrency');
        // logger.log('info','getCreditCardLast5Txn()> cardTransactions result: '+ JSON.stringify(result), { logId: sessionId});

        //let result =await ebl.mobileRechargeDia('accountNumber', 'paymentType', 'amount', 'phoneNumber')
        // logger.log('info','mobileRechargeDia()> result: '+ JSON.stringify(result), { logId: sessionId});
    }catch(e){
        logger.log('info',e);
    }  
}