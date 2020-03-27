'use strict';

const events = require("../controllers/events");
const ebl = require("../controllers/eblWebMethods");
const common = require("../controllers/common");
const logger = require("./../logger");

const traversal = require("../controllers/traversal");

exports.updateAccountServiceType = function(responseToUser, outputContexts, sessionId,queryResult) {
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let quickReplies =null;
    let contextStr = null;
    let session_vars = null;
    let title = null;
    try{
        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','updateAccountServiceType()>Existing noOfTries= '+ noOfTries, { logId: sessionId});
        noOfTries = 0;
        logger.log('info','updateAccountServiceType()> noOfTries reset to = '+ noOfTries, { logId: sessionId});

        let isAuthenticated= common.GetParameterValueFromSessionVars('isAccountAuthenticated', outputContexts, sessionId)
        logger.log('info','updateAccountServiceType()> isAuthenticated= '+ isAuthenticated, { logId: sessionId}); 

        let serviceType = common.GetParameterValueFromSessionVars('serviceType', outputContexts, sessionId)
        logger.log('info','updateAccountServiceType()> existing serviceType= '+ serviceType, { logId: sessionId});

        let accountInfo = common.GetParameterValueFromSessionVars('accountInfo', outputContexts, sessionId)
        logger.log('info','updateAccountServiceType()>accountInfo= ' + accountInfo, { logId: sessionId});
		
		let noOfAccounts = common.GetParameterValueFromSessionVars('noOfAccounts', outputContexts, sessionId)
        logger.log('info','updateAccountServiceType()>noOfAccounts= ' + noOfAccounts, { logId: sessionId});
        if(noOfAccounts == 'undefined' || noOfAccounts == '' || noOfAccounts == null){
            noOfAccounts = null;
        }
        
        session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        //update service type to 'ACCOUNT' and add in session_vars
        serviceType = 'ACCOUNT';

        //Need to check authentication flag in case user comming back after 'anything else' option
        //User can be authenticated for ACCOUNT serviceType (phoneCheck) or CARD serviceType (getBankAccountDetails)
        //If user selects ACCOUNT serviceType then user must be authenticated using getBankAccountDetails
        //If user selects CARD serviceType then user must be authenticated using phoneCheck        
        if(isAuthenticated == 'true' && noOfAccounts != null){ 
            let awaiting_mobile_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_mobile_number';
            //Since user is authenticated disabling the 'awaiting_mobile_number' context and only keeping 'awaiting_account_info_type' context
            contextStr = '[{"name":"' + awaiting_mobile_number + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +',"serviceType":"'+ serviceType +'"}}]';
            logger.log('info','updateAccountServiceType()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});  
            title = 'Okay! What information may I help you with?';
            quickReplies = ['"Account Balance"', '"Last 5 Transactions"', '"Mobile Recharge"'];
            fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] '; 
            
        }else{            
            let text= "I can surely help you with that. But first I need to check your identity";               
            let text1= "Could you please provide your registered 11 digit mobile number with EBL?";               
            fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"text": {"text":["'+ text1 +'"]},"platform": "FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"text": {"text":["'+text1+'"]},"platform": "VIBER"}]';                     

            //Since user is not authenticated yet disabling the 'awaiting_anything_else_choice' context
            let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
            contextStr = '[{"name":"' + awaiting_anything_else_choice + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +',"serviceType":"'+ serviceType +'"}}]';
            logger.log('info','updateAccountServiceType()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});    
        }        
        logger.log('info','updateAccountServiceType()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});
       
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
        
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
    }    
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,''); 
    logger.log('info','updateAccountServiceType()> Response:'+JSON.stringify(responseJson), { logId: sessionId});
    responseToUser.json(responseJson);
}

exports.verifyMobileNumberAndGetOtp = async function (responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages = null;
    try{
        let session_vars = null;
        let text = "Error";
        
        let accountInfo= null;
        let noOfAccounts= 0;

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','account.verifyMobileNumberAndGetOtp()>Existing noOfTries= '+ noOfTries, { logId: sessionId});

        let mobileNumber = common.GetParameterValueFromSessionVars('mobileNumber', outputContexts, sessionId)
        logger.log('info','account.verifyMobileNumberAndGetOtp()>mobileNumber= ' + mobileNumber, { logId: sessionId}); 

        let serviceType = common.GetParameterValueFromSessionVars('serviceType', outputContexts, sessionId)
        logger.log('info','account.verifyMobileNumberAndGetOtp()> serviceType= '+ serviceType, { logId: sessionId});

        let result = await ebl.getBankAccountDetails(mobileNumber,common.getSessionId(outputContexts))
        logger.log('info','account.verifyMobileNumberAndGetOtp()> result: '+ JSON.stringify(result), { logId: sessionId});
        session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
           
        if(result == 'timeout'){
            //EBL webmethod timedout 
                    
            noOfTries = noOfTries + 1;
            logger.log('info','account.verifyMobileNumberAndGetOtp()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});
            logger.log('info','account.verifyMobileNumberAndGetOtp()> EBL webmethod timedout, asking user to enter again', { logId: sessionId});
            actionStatus='timeout';
            eblActionStatus='timeout';
             if(noOfTries < 3){
                //User still has tries left. Enabling 'awaiting_mobile_number' context and 
                //disabling the 'awaiting_otp' context                 
                let awaiting_mobile_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_mobile_number';
                let awaiting_otp = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_otp';
                contextStr = '[{"name":"' + awaiting_mobile_number + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_otp + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','account.verifyMobileNumberAndGetOtp()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});
           
                text = 'Sorry, it seems that there is an issue which is causing a delay. Please enter your 11 digit mobile number again';
                fulfillmentMessages = '[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"text": {"text": ["'+ text +'"]},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';                    
                
                
                //traversal.nodeTraversal(sessionId,queryResult,'timeout',fulfillmentMessages,contextStr);       


            }else{ 
                //no more tries left
                events.No_MORE_TRIES(responseToUser);
                return;
            }   
        }else {
            actionStatus='success';
            let isSuccess = result.QRYRESULT.ISSUCCESS;
            logger.log('info','account.verifyMobileNumberAndGetOtp()>ISSUCCESS val= ' + isSuccess, { logId: sessionId});             
            if(isSuccess == 'Y'){
                accountInfo = result.QRYRESULT.ACCOUNTINFO;
                noOfAccounts = accountInfo.length;
                logger.log('info','account.verifyMobileNumberAndGetOtp()>noOfAccounts= ' + noOfAccounts, { logId: sessionId});
                logger.log('info','account.verifyMobileNumberAndGetOtp()>ACCOUNTINFO val= ' + JSON.stringify(accountInfo), { logId: sessionId});

                if(noOfAccounts == 0){
                    noOfTries = 0;
                    logger.log('info','account.verifyMobileNumberAndGetOtp()> noOfTries reset to = '+ noOfTries, { logId: sessionId});

                    text="Sorry, it seems you dont have any active account with us";
                    let title="Is there anything else I can help you with?";
                    let quickReplies = ['"Yes"','"No"'];
                    fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]';  
                    //Since user has  no active account disabling the 'awaiting_otp' context and only keeping 'awaiting_anything_else_choice' context
                    let awaiting_otp = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_otp';
                    contextStr = '[{"name":"' + awaiting_otp + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'"}}]';
                    logger.log('info','account.verifyMobileNumberAndGetOtp()> ResetAllOutputContext - contextStr= '+ contextStr, { logId: sessionId});
                    //traversal.nodeTraversal(sessionId,queryResult,'success',fulfillmentMessages,contextStr);
                    eblActionStatus='success';
                }else{ 
                    //Since user has active accounts. generate new OTP
                    result = await ebl.botOtp(mobileNumber, serviceType,common.getSessionId(outputContexts))
                    logger.log('info','account.verifyMobileNumberAndGetOtp()> botOtp result= '+ JSON.stringify(result), { logId: sessionId});
                    if(result == 'timeout'){
                        //EBL webmethod timedout    
                        eblActionStatus='timeout';
                        actionStatus='timeout';       
                        noOfTries = noOfTries + 1;
                        logger.log('info','account.verifyMobileNumberAndGetOtp()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});

                        if(noOfTries < 3){
                            //User still has tries left. Enabling 'awaiting_mobile_number' context and 
                            //disabling the 'awaiting_otp' context                 
                            let awaiting_mobile_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_mobile_number';
                            let awaiting_otp = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_otp';
                            contextStr = '[{"name":"' + awaiting_mobile_number + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_otp + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                            logger.log('info','account.verifyMobileNumberAndGetOtp()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});

                            text = 'Sorry, it seems that there is an issue which is causing a delay. Please enter your 11 digit mobile number';
                            fulfillmentMessages = '[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"text": {"text": ["'+ text +'"]},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';                    
                
                            logger.log('info','account.verifyMobileNumberAndGetOtp()> EBL webmethod timedout, asking user to enter again', { logId: sessionId});
                        }else{ 
                            //no more tries left
                            events.No_MORE_TRIES(responseToUser);
                            return;
                        } 
            
                    }else{
                        let errorCode = result.BototpResult.ERROR_CODE;
                        logger.log('info','account.verifyMobileNumberAndGetOtp()> botOtp errorCode= ' + errorCode, { logId: sessionId});
                        if(errorCode == '0000' || errorCode == '000'){
                            let isValidMobileNumber = "yes";
                            let otp = result.BototpResult.OTP;
                            logger.log('info','account.verifyMobileNumberAndGetOtp()>otp= ' + otp, { logId: sessionId});
                            let otpTimestamp= new Date().getTime();
                            
                            noOfTries = 0;
                            logger.log('info','account.verifyMobileNumberAndGetOtp()> noOfTries reset to = '+ noOfTries, { logId: sessionId});      
                            
                            //continue with 'awaiting_otp' context            
                            contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries + ', "accountInfo":'+ JSON.stringify(accountInfo) +', "noOfAccounts":'+ noOfAccounts +' , "mobileNumber":"'+ mobileNumber +'", "isValidMobileNumber":"'+ isValidMobileNumber +'", "otp":"'+ otp +'", "otpTimestamp":"'+ otpTimestamp +'"}}]';
                            logger.log('info','account.verifyMobileNumberAndGetOtp()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});
                            text = 'Please enter the OTP(one time password) you have received to confirm your identity.';  
                            fulfillmentMessages = '[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"text": {"text": ["'+ text +'"]},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';                    
                            //traversal.nodeTraversal(sessionId,queryResult,'error',fulfillmentMessages,contextStr);
                            eblActionStatus='success';
                        }else{
                            ////OTP request failed            
                            events.ERROR(responseToUser,sessionId,queryResult,fulfillmentMessages,contextStr);
                            return;                             
                        }  
                    }                     
                }
                
            }else{
                ////get account details failed                 
                events.ERROR(responseToUser,sessionId,queryResult,fulfillmentMessages,contextStr);
                return;
            }
        }  
        traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr);      
        logger.log('info','account.verifyMobileNumberAndGetOtp()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        events.ERROR(responseToUser,sessionId,queryResult,fulfillmentMessages,contextStr);
    }  
    logger.log('info','account.verifyMobileNumberAndGetOtp()> Response:'+JSON.stringify(responseJson), { logId: sessionId});
    responseToUser.json(responseJson);
}

exports.getBankAccountBalance = function (responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    try{
        let text = "Error";
        
        let quickReplies = [];
        let title = null;
        let accountInfo= null;
        let noOfAccounts= 0;
        let account_number = null;

		let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','getBankAccountBalance()>Existing noOfTries= '+ noOfTries, { logId: sessionId});

        let mobileNumber = common.GetParameterValueFromSessionVars('mobileNumber', outputContexts, sessionId)
        logger.log('info','getBankAccountBalance()>mobileNumber= ' + mobileNumber, { logId: sessionId});
		
		accountInfo = common.GetParameterValueFromSessionVars('accountInfo', outputContexts, sessionId)
        logger.log('info','getBankAccountBalance()>accountInfo= ' + JSON.stringify(accountInfo), { logId: sessionId});
		
		noOfAccounts = common.GetParameterValueFromSessionVars('noOfAccounts', outputContexts, sessionId)
        logger.log('info','getBankAccountBalance()>noOfAccounts= ' + noOfAccounts, { logId: sessionId});
        
        noOfTries = 0;
        logger.log('info','getBankAccountBalance()> noOfTries reset to = '+ noOfTries, { logId: sessionId});  
        
        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
       
		if (noOfAccounts == 1){ 
			text= "Your Account Number: <account_number>,\\n Current Balance: BDT <current_balance>,\\n Available Balance: BDT <available_balance>,\\n Account Currency: <currency>.";               
			account_number = accountInfo[0]["CUSTACCTNO"].toString();
			let current_balance = accountInfo[0]["CURRENT_BALANCE"].toString();
			let available_balance = accountInfo[0]["ACY_AVL_BAL"].toString();
			let currency = accountInfo[0]["CURRENCY"].toString();
			text = text.replace("<account_number>", account_number.substring(0, 4) + "****" +account_number.substring(account_number.length - 4, account_number.length));
			text = text.replace("<current_balance>", current_balance);
			text = text.replace("<available_balance>", available_balance);
            text = text.replace("<currency>", currency); 
            
            let title="May I help you with anything else?";
            let quickReplies = ['"Yes"','"No"'];
            fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]'; 
           
			//Since user has   one account disabling the 'awaiting_account_number' context and only keeping 'awaiting_anything_else_choice' context
			let awaiting_account_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_account_number';
			let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
			contextStr = '[{"name":"' + awaiting_account_number + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_anything_else_choice + '", "lifespanCount":1, "parameters":{}}, {"name":"' + session_vars +'", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]'; 
            
            //sessionId|action|intent|input|fulfillment|contextString
           // traversal.nodeTraversal(sessionId,queryResult,'success',fulfillmentMessages,contextStr);
            logger.log('info','getBankAccountBalance()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});
		}else{
            let i = 0;  
            let accountList='';           
			for(i=0; i< noOfAccounts; i++){
				account_number = accountInfo[i]["CUSTACCTNO"].toString();
				logger.log('info','getBankAccountBalance()>i= '+ i + ", account_number > = " + account_number);
				account_number = account_number.substring(0, 4) + "****" +account_number.substring(account_number.length - 4, account_number.length)
                quickReplies.push('"'+ account_number +'"');
                accountList+='\\n'+(i+1)+'. '+account_number;
			}
            logger.log('info','getBankAccountBalance()>quickReplies= ' + quickReplies, { logId: sessionId});
            title = "Please type serial number of account number you wish to see information of. For example to see first account's information type 1 "+accountList;
            fulfillmentMessages = '[{"text": {"text": ["'+ title +'"]},"platform": "VIBER"},{"text": {"text": ["'+ title +'"]},"platform": "FACEBOOK"}] ';        
            //Since user has multiple accounts disabling the 'awaiting_anything_else_choice' context and only keeping 'awaiting_account_number' context
			let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
			let awaiting_account_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_account_number';
        
            contextStr = '[{"name":"' + awaiting_anything_else_choice + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_account_number + '", "lifespanCount":1, "parameters":{}}, {"name":"' + session_vars +'", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]'; 
            
            //sessionId|action|intent|input|fulfillment|contextString
           

            logger.log('info','getBankAccountBalance()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});
		}       
        logger.log('info','getBankAccountBalance()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
        
           
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId}, { logId: sessionId});
       actionStatus='error';
           
    } 
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');       
    logger.log('info','getBankAccountBalance()> Response:'+JSON.stringify(responseJson), { logId: sessionId});
    responseToUser.json(responseJson);
}

exports.getBankAccountLast5Txn = async function (responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    let account_number= "";
    try{
        let text = "Error";
        let isSuccess= null;
        let transactionHistory= null;
        let session_vars = null;
        
        let quickReplies = [];
        let title = null;
        let accountInfo= null;
        let noOfAccounts= 0;
        

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','getBankAccountLast5Txn()>Existing noOfTries= '+ noOfTries, { logId: sessionId});

        let mobileNumber = common.GetParameterValueFromSessionVars('mobileNumber', outputContexts, sessionId)
        logger.log('info','getBankAccountLast5Txn()>mobileNumber= ' + mobileNumber, { logId: sessionId});

        accountInfo = common.GetParameterValueFromSessionVars('accountInfo', outputContexts, sessionId)
        logger.log('info','getBankAccountLast5Txn()>accountInfo= ' + JSON.stringify(accountInfo), { logId: sessionId});
		
		noOfAccounts = common.GetParameterValueFromSessionVars('noOfAccounts', outputContexts, sessionId)
        logger.log('info','getBankAccountLast5Txn()>noOfAccounts= ' + noOfAccounts, { logId: sessionId});

        account_number=accountInfo[0].CUSTACCTNO;
        logger.log('info','getBankAccountLast5Txn()>account_number= ' + account_number, { logId: sessionId});

        let result = await ebl.getBankAccountLast5Txn(account_number, common.getSessionId(outputContexts))
        logger.log('info','getBankAccountLast5Txn()> result: '+ JSON.stringify(result), { logId: sessionId});     

        session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        
        if(result == 'timeout'){
            //EBL webmethod timedout  
            actionStatus='timeout';
            eblActionStatus='timeout';         
            noOfTries = noOfTries + 1;
            logger.log('info','getBankAccountLast5Txn()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});
            logger.log('info','getBankAccountLast5Txn()> EBL webmethod timedout, asking user to enter again', { logId: sessionId});
            
             if(noOfTries < 3){
                //User still has tries left. Enabling 'awaiting_account_info_type' context and 
                //disabling the 'awaiting_account_number' context and 'awaiting_anything_else_choice' context                 
                let awaiting_account_info_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_account_info_type';
                let awaiting_account_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_account_number';
                let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
                contextStr = '[{"name":"' + awaiting_account_info_type + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_account_number + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_anything_else_choice + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','getBankAccountLast5Txn()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});
           
                text = 'Sorry, it seems that there is an issue which is causing a delay';
                title = 'What information may I help you with?';
                quickReplies = ['"Account Balance"', '"Last 5 Transactions"', '"Mobile Recharge"'];
                fulfillmentMessages = '[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"text": {"text": ["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';                    
               // traversal.nodeTraversal(sessionId,queryResult,'timeout',fulfillmentMessages,contextStr);
             
            }else{ 
                //no more tries left
                events.No_MORE_TRIES(responseToUser);
                return;
            }
        } else {
            actionStatus='success';
           
            isSuccess = result.QRYRESULT.ISSUCCESS;
            logger.log('info','getBankAccountLast5Txn()>ISSUCCESS val= ' + isSuccess, { logId: sessionId});
            if(isSuccess == 'Y'){ 
                eblActionStatus='success';               
                //add 'transactionHistory' in session_vars
                transactionHistory = result.QRYRESULT.TRNHISTORY;
                logger.log('info','getBankAccountLast5Txn()>transactionHistory val= ' + JSON.stringify(transactionHistory), { logId: sessionId});
                logger.log('info','getBankAccountLast5Txn()>transactionHistory length= ' + transactionHistory.length, { logId: sessionId});
                
                noOfTries = 0;
                logger.log('info','getBankAccountLast5Txn()> noOfTries reset to = '+ noOfTries, { logId: sessionId});
                // if(userProvidedAccountNumber!=undefined && accountInfo[userProvidedAccountNumber-1]!=undefined){
                //     userProvidedAccountNumber=accountInfo[userProvidedAccountNumber-1]["CUSTACCTNO"];
                // }
                if (noOfAccounts == 1){                     
                    account_number = accountInfo[0]["CUSTACCTNO"].toString();
                    logger.log('info','getBankAccountLast5Txn()>account_number = ' + account_number, { logId: sessionId});           
                    let i = 0;
                    text="Your last 5 transaction details are: ";
                    for(i=0; i< transactionHistory.length; i++){
                        if(transactionHistory[i]["CODDRCR"] == 'C'){
                            text = text +  "\\n\\n"+(i+1)+". "+ transactionHistory[i]["TXNAMOUNT"] + " credit on "+  transactionHistory[i]["TXNDATE"] + " , "+transactionHistory[i]["DESCRIPTION"];
                        }else{
                            text = text +  "\\n\\n"+(i+1)+". "+ transactionHistory[i]["TXNAMOUNT"] + " debit on "+  transactionHistory[i]["TXNDATE"]+" , "+transactionHistory[i]["DESCRIPTION"];
                        }                
                    }
                   // text = text.slice(0, -2);                         
                    logger.log('info','getBankAccountLast5Txn()>text= ' + text, { logId: sessionId});
                   // traversal.nodeTraversal(sessionId+'|{"awaiting_account_number":"'+awaiting_account_number+'"}|'+text);

                    contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +', "transactionHistory":'+ JSON.stringify(transactionHistory) +'}}]';
                    logger.log('info','getBankAccountLast5Txn()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});
                    let title="May I help you with anything else?";
                    let quickReplies = ['"Yes"','"No"'];
                    fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]'; 
                    //fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"text": {"text":["'+ text1 +'"]},"platform": "FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"text": {"text":["'+ text1 +'"]},"platform": "VIBER"}]';                               
                }else{
                    let i = 0;              
                    let accountList='';  
                    for(i=0; i< noOfAccounts; i++){
                        account_number = accountInfo[i]["CUSTACCTNO"].toString();
                        logger.log('info','getBankAccountLast5Txn()>i= '+ i + ", account_number > = " + account_number, { logId: sessionId});
                        account_number = account_number.substring(0, 4) + "****" +account_number.substring(account_number.length - 4, account_number.length)
                        quickReplies.push('"'+ account_number +'"');
                        accountList+='\\n'+(i+1)+'. '+account_number;
                    }
                    logger.log('info','getBankAccountLast5Txn()>quickReplies= ' + quickReplies, { logId: sessionId});
                    title = "You have multiple accounts with EBL. Which account account’s last 5 transactions do you want to view now? "+accountList;
                    // fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';        
                    fulfillmentMessages='[{"text": {"text": ["'+ title +'"]},"platform": "VIBER"},{"text": {"text": ["'+ title +'"]},"platform": "FACEBOOK"}] '; 
                    //Since user has multiple accounts disabling the 'awaiting_anything_else_choice' context and only keeping 'awaiting_account_number' context
                    let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
                    let awaiting_account_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_account_number';
                    contextStr = '[{"name":"' + awaiting_anything_else_choice + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_account_number + '", "lifespanCount":1, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +', "transactionHistory":'+ JSON.stringify(transactionHistory) +'}}]';
                    logger.log('info','getBankAccountLast5Txn()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});
                }
               
            }else{
                ////get last 5 txn failed                 
                events.ERROR(responseToUser,sessionId,queryResult,fulfillmentMessages,contextStr);
                return;
            } 
        }                   
        logger.log('info','getBankAccountLast5Txn()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
         actionStatus='error';  
    } 
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,account_number);       
    logger.log('info','getBankAccountLast5Txn()> Response:'+JSON.stringify(responseJson), { logId: sessionId});
    responseToUser.json(responseJson);
}

exports.getBalanceAndLast5TxnByAccountNumber = function (responseToUser, outputContexts, sessionId,queryResult ) {
    try{
        //Request type is updated from dialogflow. Ref. Intent: UserSelectsAccountBalance and UserSelectsAccountLast5Txn
        let request_type = common.GetParameterValueFromSessionVars('request_type', outputContexts, sessionId)
        logger.log('info','getBalanceAndLast5TxnByAccountNumber()>request_type= ' + request_type, { logId: sessionId});
        if(request_type == 'BALANCE'){
            getBalanceByAccountNumber (responseToUser, outputContexts, sessionId,queryResult);
        }else{
            getLast5TxnByAccountNumber (responseToUser, outputContexts, sessionId,queryResult);
        }
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
    }
}

function getBalanceByAccountNumber (responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages = null;
    try{
        let session_vars = null;
        let text = "Error";
        
        let accountInfo= null;
        let noOfAccounts= 0;

        //used to increase the tries in getting account balance fails
        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null){
            noOfTries = 0;
        }
        logger.log('info','getBalanceByAccountNumber()>Existing value of noOfTries= '+ noOfTries, { logId: sessionId});

        let userProvidedAccountNumber = common.GetParameterValueFromSessionVars('userProvidedAccountNumber', outputContexts, sessionId)
        userProvidedAccountNumber=userProvidedAccountNumber.replace(/ /g,'');
        logger.log('info','getBalanceByAccountNumber()>userProvidedAccountNumber= ' + userProvidedAccountNumber, { logId: sessionId}); 

        let mobileNumber = common.GetParameterValueFromSessionVars('mobileNumber', outputContexts, sessionId)
        logger.log('info','getBalanceByAccountNumber()>mobileNumber= ' + mobileNumber, { logId: sessionId});

        accountInfo = common.GetParameterValueFromSessionVars('accountInfo', outputContexts, sessionId)
        logger.log('info','getBalanceByAccountNumber()>accountInfo= ' + accountInfo, { logId: sessionId});

        noOfAccounts = common.GetParameterValueFromSessionVars('noOfAccounts', outputContexts, sessionId)
        logger.log('info','getBalanceByAccountNumber()>noOfAccounts= ' + noOfAccounts, { logId: sessionId});

        session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
                       
        let i = 0;
        let account_number = null;
        let account_number_hashed = null;
        let current_balance = null;
        let available_balance = null;
        let currency = null;
        let isAccountNumberMatching = false;
        let title = null;
        let quickReplies = [];
        if(accountInfo[userProvidedAccountNumber-1]!=undefined){
            userProvidedAccountNumber=accountInfo[userProvidedAccountNumber-1]["CUSTACCTNO"].toString();
        }
        for(i=0; i< noOfAccounts; i++){
            account_number = accountInfo[i]["CUSTACCTNO"].toString();
            account_number_hashed = account_number.substring(0, 4) + "****" +account_number.substring(account_number.length - 4, account_number.length);
            //mathcing plain full, hashed full or last 4 digits of account number
            
            if(userProvidedAccountNumber == account_number || userProvidedAccountNumber == account_number_hashed || userProvidedAccountNumber == account_number.substring(account_number.length - 4, account_number.length))
            {
                isAccountNumberMatching = true;
                logger.log('info','getBalanceByAccountNumber()>Account number is matching>  ' + account_number, { logId: sessionId});
                current_balance = accountInfo[i]["CURRENT_BALANCE"];
                available_balance = accountInfo[i]["ACY_AVL_BAL"];
                currency = accountInfo[i]["CURRENCY"];

                text= "Your Account Number: <account_number>,\\n Current Balance: BDT <current_balance>,\\n Available Balance: BDT <available_balance>,\\n Account Currency: <currency>";               
        
                text = text.replace("<account_number>", account_number.substring(0, 4) + "****" +account_number.substring(account_number.length - 4, account_number.length));
                text = text.replace("<current_balance>", current_balance);
                text = text.replace("<available_balance>", available_balance);
                text = text.replace("<currency>", currency);
                title="May I help you with anything else?";
                quickReplies = ['"Yes"','"No"'];
                fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]';                               
                
                noOfTries = 0;
                logger.log('info','getBalanceByAccountNumber()> noOfTries reset to = '+ noOfTries, { logId: sessionId});
                contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';

                //sessionId|action|intent|input|fulfillment|contextString
                // traversal.nodeTraversal(sessionId,queryResult,'success',text,contextStr);

                logger.log('info','getBalanceByAccountNumber()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});                  
                break;   
            }                
        }
        logger.log('info','getBalanceByAccountNumber()> isAccountNumberMatching = '+ isAccountNumberMatching, { logId: sessionId});
        if(isAccountNumberMatching == false){
            ////Account number is NOT  matching   
            noOfTries = noOfTries + 1;
            logger.log('info','getBalanceByAccountNumber()> Account number is NOT  matching, incremented noOfTries to = '+ noOfTries, { logId: sessionId}); 
            if(noOfTries < 3){
                logger.log('info','getBalanceByAccountNumber()>User still has tries left, asking user to try again.', { logId: sessionId});
                let i = 0;    
                let accountList='';            
                for(i=0; i< noOfAccounts; i++){
                    account_number = accountInfo[i]["CUSTACCTNO"].toString();
                    logger.log('info','getBalanceByAccountNumber()>i= '+ i + ", account_number > = " + account_number);
                    account_number = account_number.substring(0, 4) + "****" +account_number.substring(account_number.length - 4, account_number.length)
                    quickReplies.push('"'+ account_number +'"');
                    accountList+='\\n'+(i+1)+'. '+account_number;
                }
                logger.log('info','getBalanceByAccountNumber()>quickReplies= ' + quickReplies, { logId: sessionId});
                title = "Sorry, account number is not matching. Please select or enter last four digits of account number" + accountList;
                // fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';        
                fulfillmentMessages='[{"text": {"text": ["'+ title +'"]},"platform": "VIBER"},{"text": {"text": ["'+ title +'"]},"platform": "FACEBOOK"}] ';         
                //enabling 'awaiting_account_number' context and disabling the 'awaiting_anything_else_choice' context
                let awaiting_account_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_account_number';
                let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
                contextStr = '[{"name":"' + awaiting_account_number + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_anything_else_choice + '","lifespanCount":0,"parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','getBalanceByAccountNumber()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});                                      
            }
            else 
            {   //no more tries left
                events.No_MORE_TRIES(responseToUser);
                return;   
            }   
        }
                          
        logger.log('info','getBalanceByAccountNumber()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
    //sessionId|action|intent|input|fulfillment|contextString
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');
    logger.log('info','getBalanceByAccountNumber()> Response:'+JSON.stringify(responseJson), { logId: sessionId});
    responseToUser.json(responseJson);
}

async function getLast5TxnByAccountNumber (responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages = null;
    let account_number = null;
    try{
        let session_vars = null;
        let text = "";
        
        let accountInfo= null;
        let noOfAccounts= 0;

        //used to increase the tries in getting account balance fails
        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null){
            noOfTries = 0;
        }
        logger.log('info','getLast5TxnByAccountNumber()>Existing value of noOfTries= '+ noOfTries, { logId: sessionId});

        let userProvidedAccountNumber = common.GetParameterValueFromSessionVars('userProvidedAccountNumber', outputContexts, sessionId)
        userProvidedAccountNumber=userProvidedAccountNumber.replace(/ /g,'');
        logger.log('info','getLast5TxnByAccountNumber()>userProvidedAccountNumber= ' + userProvidedAccountNumber, { logId: sessionId});

        let mobileNumber = common.GetParameterValueFromSessionVars('mobileNumber', outputContexts, sessionId)
        logger.log('info','getLast5TxnByAccountNumber()>mobileNumber= ' + mobileNumber, { logId: sessionId});

        accountInfo = common.GetParameterValueFromSessionVars('accountInfo', outputContexts, sessionId)
        logger.log('info','getLast5TxnByAccountNumber()>accountInfo= ' + accountInfo, { logId: sessionId});

        noOfAccounts = common.GetParameterValueFromSessionVars('noOfAccounts', outputContexts, sessionId)
        logger.log('info','getLast5TxnByAccountNumber()>noOfAccounts= ' + noOfAccounts, { logId: sessionId});

        session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
                 
            let i = 0;
           
            let isAccountNumberMatching = false;
            let transactionHistory = null;
            let title= null;
            let quickReplies = [];
            if(accountInfo[userProvidedAccountNumber-1]!=undefined){
                userProvidedAccountNumber=accountInfo[userProvidedAccountNumber-1]["CUSTACCTNO"];
                logger.log('info','getLast5TxnByAccountNumber()>userProvidedAccountNumber new = ' + userProvidedAccountNumber, { logId: sessionId}); 
            }
            for(i=0; i< noOfAccounts; i++){
                account_number = accountInfo[i]["CUSTACCTNO"].toString();
                account_number = account_number.substring(0, 4) + "****" +account_number.substring(account_number.length - 4, account_number.length);
                logger.log('info','getLast5TxnByAccountNumber()>account_number = ' + account_number, { logId: sessionId});

                //matching last 4 digit or hashed account number
                logger.log('info','getLast5TxnByAccountNumber()>userProvidedAccountNumber = ' + userProvidedAccountNumber, { logId: sessionId}); 
                
                if(userProvidedAccountNumber == account_number || userProvidedAccountNumber == account_number.substring(account_number.length - 4, account_number.length)||userProvidedAccountNumber==accountInfo[i]["CUSTACCTNO"].toString())
                {
                    isAccountNumberMatching = true;
                    account_number = accountInfo[i]["CUSTACCTNO"].toString();
                    logger.log('info','getLast5TxnByAccountNumber()>account_number = ' + account_number, { logId: sessionId}); 
                    transactionHistory = common.GetParameterValueFromSessionVars('transactionHistory', outputContexts, sessionId)
                    logger.log('info','getLast5TxnByAccountNumber()>transactionHistory= ' + JSON.stringify(transactionHistory), { logId: sessionId});
                    if(transactionHistory!=undefined && account_number == transactionHistory[0].NBRACCOUNT ){   
                        text="Your last 5 transaction details are: ";
                        logger.log('info','getLast5TxnByAccountNumber()> using transactionHistory from session ', { logId: sessionId}); 
                        for(i=0; i< transactionHistory.length; i++){
                            if(transactionHistory[i]["CODDRCR"] == 'C'){
                                text = text +"\\n\\n" +(i+1)+ ". "+ transactionHistory[i]["TXNAMOUNT"] + " credit on "+  transactionHistory[i]["TXNDATE"]+" , "+transactionHistory[i]["DESCRIPTION"];
                            }else{
                                text = text +"\\n\\n" +(i+1)+ ". "+ transactionHistory[i]["TXNAMOUNT"] + " debit on "+  transactionHistory[i]["TXNDATE"]+" , "+transactionHistory[i]["DESCRIPTION"];
                            }  
                            text = text +  " , \\n";              
                        }  
                        text = text.slice(0,-3); 
                    }
                    else{
                        let result = await ebl.getBankAccountLast5Txn(account_number, common.getSessionId(outputContexts))
                        logger.log('info','getLast5TxnByAccountNumber()> result: '+ JSON.stringify(result), { logId: sessionId}); 
                        if(result == 'timeout'){
                            //EBL webmethod timedout
                            eblActionStatus='timeout';
                            actionStatus='timeout';           
                            noOfTries = noOfTries + 1;
                            logger.log('info','getLast5TxnByAccountNumber()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});
                            logger.log('info','getLast5TxnByAccountNumber()> EBL webmethod timedout, asking user to enter again', { logId: sessionId});
                            
                             if(noOfTries < 3){
                                //User still has tries left. enabling 'awaiting_account_number' context and disabling the 'awaiting_anything_else_choice' context
                                let awaiting_account_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_account_number';
                                let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
                    
                                contextStr = '[{"name":"' + awaiting_account_number + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_anything_else_choice + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                                logger.log('info','getLast5TxnByAccountNumber()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});
                                          
                                for(i=0; i< noOfAccounts; i++){
                                    account_number = accountInfo[i]["CUSTACCTNO"].toString();
                                    logger.log('info','getLast5TxnByAccountNumber()>i= '+ i + ", account_number > = " + account_number);
                                    account_number = account_number.substring(0, 4) + "****" +account_number.substring(account_number.length - 4, account_number.length)
                                    quickReplies.push('"'+ account_number +'"');
                                }
                                logger.log('info','getBalanceByAccountNumber()>quickReplies= ' + quickReplies, { logId: sessionId});
                                title = "Sorry, it seems that there is an issue which is causing a delay. Please select or enter last four digits of account number"
                                fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';        
                            }else{ 
                                //no more tries left
                                events.No_MORE_TRIES(responseToUser);
                                return;
                            }
                        } else {     
                            let isSuccess = result.QRYRESULT.ISSUCCESS;
                            logger.log('info','getLast5TxnByAccountNumber()>ISSUCCESS val= ' + isSuccess, { logId: sessionId});
                            if(isSuccess == 'Y'){     
                                eblActionStatus='success';           
                                //add 'transactionHistory' in session_vars
                                transactionHistory = result.QRYRESULT.TRNHISTORY;
                                logger.log('info','getLast5TxnByAccountNumber()>transactionHistory val= ' + JSON.stringify(transactionHistory), { logId: sessionId});
                                logger.log('info','getLast5TxnByAccountNumber()>transactionHistory length= ' + transactionHistory.length, { logId: sessionId});
                                
                                noOfTries = 0;
                                logger.log('info','getLast5TxnByAccountNumber()> noOfTries reset to = '+ noOfTries, { logId: sessionId});
                                let i = 0;
                                text="Your last 5 transaction details are: ";
                                for(i=0; i< transactionHistory.length; i++){
                                    if(transactionHistory[i]["CODDRCR"] == 'C'){
                                        text = text +  "\\n\\n"+(i+1)+". "+ transactionHistory[i]["TXNAMOUNT"] + " credit on "+  transactionHistory[i]["TXNDATE"] + " , "+transactionHistory[i]["DESCRIPTION"];
                                    }else{
                                        text = text +  "\\n\\n"+(i+1)+". "+ transactionHistory[i]["TXNAMOUNT"] + " debit on "+  transactionHistory[i]["TXNDATE"]+" , "+transactionHistory[i]["DESCRIPTION"];
                                    }                
                                }                        
                                logger.log('info','getLast5TxnByAccountNumber()>text= ' + text, { logId: sessionId});
                            }else{
                                ////get last 5 txn failed                 
                                events.ERROR(responseToUser,sessionId,queryResult,fulfillmentMessages,contextStr);
                                return;
                            } 
                        }  
                    }
                    logger.log('info','getLast5TxnByAccountNumber()>text= ' + text, { logId: sessionId});
                    title="May I help you with anything else?";
                    quickReplies = ['"Yes"','"No"'];
                    fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]'; 
                    noOfTries = 0;
                    logger.log('info','getLast5TxnByAccountNumber()> noOfTries reset to = '+ noOfTries, { logId: sessionId});
                    contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                    logger.log('info','getLast5TxnByAccountNumber()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});                   
                    break;                                          
                }              
            }
            logger.log('info','getLast5TxnByAccountNumber()> isAccountNumberMatching = '+ isAccountNumberMatching, { logId: sessionId});
            if(isAccountNumberMatching == false){
                ////Account number is NOT  matching   
                noOfTries = noOfTries + 1;
                logger.log('info','getLast5TxnByAccountNumber()> Account number is NOT  matching, incremented noOfTries to = '+ noOfTries, { logId: sessionId});  
                if(noOfTries < 3){
                    logger.log('info','getLast5TxnByAccountNumber()>User still has tries left, asking user to try again.', { logId: sessionId});                   
                    let i = 0; 
                    let accountList='';               
                    for(i=0; i< noOfAccounts; i++){
                        account_number = accountInfo[i]["CUSTACCTNO"].toString();
                        logger.log('info','getLast5TxnByAccountNumber()>i= '+ i + ", account_number > = " + account_number, { logId: sessionId});
                        account_number = account_number.substring(0, 4) + "****" +account_number.substring(account_number.length - 4, account_number.length)
                        quickReplies.push('"'+ account_number +'"');
                        accountList+='\\n'+(i+1)+'. '+account_number;
                    }
                    logger.log('info','getLast5TxnByAccountNumber()>quickReplies= ' + quickReplies, { logId: sessionId});
                    title = "Sorry, account number is not matching. Please select or enter last four digits of account number "+accountList;
                    //fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';        
                    fulfillmentMessages='[{"text": {"text": ["'+ title +'"]},"platform": "VIBER"},{"text": {"text": ["'+ title +'"]},"platform": "FACEBOOK"}] ';

                    //enabling 'awaiting_account_number' context and disabling the 'awaiting_anything_else_choice' context
                    let awaiting_account_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_account_number';
                    let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
                    contextStr = '[{"name":"' + awaiting_account_number + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_anything_else_choice + '","lifespanCount":0,"parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                    logger.log('info','getLast5TxnByAccountNumber()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});                                     
                }
                else 
                {   //no more tries left.
                    events.No_MORE_TRIES(responseToUser);
                    return;  
                }   
            }            
        logger.log('info','getLast5TxnByAccountNumber()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,account_number);
    logger.log('info','getLast5TxnByAccountNumber()> Response:'+JSON.stringify(responseJson), { logId: sessionId});
    responseToUser.json(responseJson);
}

/**
 * To get and display multiple account for mobile recharge
 */
exports.multipleAccounts = function (responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages=null;
    let actionStatus='success';
    let eblActionStatus='na';
    try{
        let quickReplies = [];        

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','multipleAccounts()>Existing noOfTries= '+ noOfTries, { logId: sessionId}); 

		let accountInfo = common.GetParameterValueFromSessionVars('accountInfo', outputContexts, sessionId)
        logger.log('info','multipleAccounts()>accountInfo= ' + accountInfo, { logId: sessionId});
		
		let noOfAccounts = common.GetParameterValueFromSessionVars('noOfAccounts', outputContexts, sessionId)
        logger.log('info','multipleAccounts()>noOfAccounts= ' + noOfAccounts, { logId: sessionId});

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
               
        let i = 0;    
        let j=0;
        let accountList='';
        let account_number = null;            
        for(i=0; i< noOfAccounts; i++){
            account_number = accountInfo[i]["CUSTACCTNO"].toString();
            logger.log('info','multipleAccounts()>i= '+ i + ", account_number > = " + account_number, { logId: sessionId});
            account_number = account_number.substring(0, 4) + "****" +account_number.substring(account_number.length - 4, account_number.length)
            //quickReplies.push('"'+ account_number +'"');
            if(accountInfo[i]["AC_CLASS_TYPE"].toString()=='S'||accountInfo[i]["AC_CLASS_TYPE"].toString()=='C'){
                accountList+='\\n'+(++j)+'. '+account_number;
            }
        }
        logger.log('info','multipleAccounts()>accountList= ' + accountList, { logId: sessionId});
        let title = "Please type in the serial number of the account number you wish to pay the mobile recharge bill from. For example to pay the bill from 1st account, type 1."+accountList;
        //fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';        
        //insert fulfillmentmessage 
        fulfillmentMessages = '[{"text": {"text":["'+ title+'"]},"platform": "FACEBOOK"},{"text": {"text":["'+title+'"]},"platform": "VIBER"}]';                     
        logger.log('info','multipleAccounts()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});
        //Since user has multiple accounts disabling the 'awaiting_anything_else_choice' context and enabling 'awaiting_account_number_for_mobile_recharge' context
        let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
        let awaiting_account_number_for_mobile_recharge = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_account_number_for_mobile_recharge';
        contextStr = '[{"name":"' + awaiting_anything_else_choice + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_account_number_for_mobile_recharge + '", "lifespanCount":1, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
        logger.log('info','multipleAccounts()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});
        
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    } 
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');
    logger.log('info','multipleAccounts()> Response:'+JSON.stringify(responseJson), { logId: sessionId});
    responseToUser.json(responseJson);   
}