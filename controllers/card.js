'use strict';

const events = require("../controllers/events");
const ebl = require("../controllers/eblWebMethods");
const common = require("../controllers/common");
const logger = require("./../logger");


const traversal=require("../controllers/traversal");

exports.updateCardServiceType = function(responseToUser, outputContexts, sessionId,queryResult) {
    let responseJson = {};
    let actionStatus='success';
    let eblActionStatus='na';
    let fulfillmentMessages =null;
    let contextStr = null;
    try{
        
        let quickReplies =null;
        
        let session_vars = null;
        let title = null;
       
        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','updateCardServiceType()>Existing noOfTries= '+ noOfTries, { logId: sessionId});  
        noOfTries = 0;
        logger.log('info','updateCardServiceType()> noOfTries reset to = '+ noOfTries, { logId: sessionId});  

        let isAuthenticated= common.GetParameterValueFromSessionVars('isCardAuthenticated', outputContexts, sessionId)
        logger.log('info','updateCardServiceType()> isAuthenticated= '+ isAuthenticated, { logId: sessionId});   

        let serviceType = common.GetParameterValueFromSessionVars('serviceType', outputContexts, sessionId)
        logger.log('info','updateCardServiceType()> serviceType= '+ serviceType, { logId: sessionId});  

        let accountInfo = common.GetParameterValueFromSessionVars('accountInfo', outputContexts, sessionId)
        logger.log('info','updateCardServiceType()>accountInfo= ' + accountInfo, { logId: sessionId});  
		
		let noOfAccounts = common.GetParameterValueFromSessionVars('noOfAccounts', outputContexts, sessionId)
        logger.log('info','updateCardServiceType()>noOfAccounts= ' + noOfAccounts, { logId: sessionId});  

        session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
           //update service type to 'CARD' and add in session_vars
           serviceType = 'CARD';

        //Need to check authentication flag in case user comming back after 'anything else' option
        //User can be authenticated for ACCOUNT serviceType (phoneCheck) or CARD serviceType (getBankAccountDetails)
        //If user selects ACCOUNT serviceType then user must be authenticated using getBankAccountDetails
        //If user selects CARD serviceType then user must be authenticated using phoneCheck
        let clientIds = common.GetParameterValueFromSessionVars('clientIds', outputContexts, sessionId)
        logger.log('info','updateCardServiceType()>clientIds= ' + noOfAccounts, { logId: sessionId});  
        if(clientIds == 'undefined' || clientIds == '' || clientIds == null){
            clientIds = null;
        }
        if(isAuthenticated == 'true' && clientIds != null){   
            let awaiting_mobile_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_mobile_number';
            //Since user is authenticated disabling the 'awaiting_mobile_number' context and only keeping 'awaiting_account_info_type' context
            contextStr = '[{"name":"' + awaiting_mobile_number + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +',"serviceType":"'+ serviceType +'"}}]';
            logger.log('info','updateCardServiceType()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});    
            
            title = 'Okay! What information may I help you with?';

            //Display only available options to the user
            clientIds = clientIds + ''; //to avoid TypeError: clientIds.split is not a function
            let clientIdsArray = clientIds.split(',');
            let creditCardArray = [];
            let prepaidCardArray = [];
            clientIdsArray.forEach(function(element) {
                if(element.substring(0,2) == 'CR'){
                    creditCardArray.push(clientIds.split(' ')[1])
                }
                if(element.substring(0,2) == 'CR'){
                    prepaidCardArray.push(clientIds.split(' ')[1])
                }
            });
            logger.log('info','updateCardServiceType()>No of credit Cards= ' + creditCardArray.length, { logId: sessionId});  
            logger.log('info','updateCardServiceType()>No of prepaid Cards= ' + prepaidCardArray.length, { logId: sessionId});  
            
            if(creditCardArray.length >=1 && prepaidCardArray.length >= 1){
                quickReplies = ['"Credit Card"', '"Prepaid Card"', '"Mobile Recharge"'];
            }else if(creditCardArray.length >=1){
                quickReplies = ['"Credit Card"', '"Mobile Recharge"'];
            }if(prepaidCardArray.length >=1){
                quickReplies = ['"Prepaid Card"', '"Mobile Recharge"'];
            }else{
                quickReplies = ['"Mobile Recharge"'];
            }      
            quickReplies = ['"Credit Card"', '"Prepaid Card"', '"Mobile Recharge"'];
            fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}] '; 
            
        }else{            
            let text= "I can surely help you with that. But first I need to check your identity";               
            let text1= "Could you please provide your registered 11 digit mobile number with EBL?";               
            fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"text": {"text":["'+ text1 +'"]},"platform": "FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"text": {"text":["'+text1+'"]},"platform": "VIBER"}]';                     

            //Since user is not authenticated yet disabling the 'awaiting_anything_else_choice' context
            let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
            contextStr = '[{"name":"' + awaiting_anything_else_choice + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +',"serviceType":"'+ serviceType +'"}}]';
            logger.log('info','updateCardServiceType()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});     
        }        
        logger.log('info','updateCardServiceType()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
        
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }     
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');  
    logger.log('info','updateCardServiceType()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}

/**
 * Call phoneCheck EBL webmethod to verify the mobile number and get the client ids.
 * Create a list of Credit Card, Prepaid Card and Debit Card
 */
exports.verifyMobileNumberAndGetOtp = async function (responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    try{
        let session_vars = null;
        let text = "Error";
        
        let clientIds= null;

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','card.verifyMobileNumberAndGetOtp()>Existing noOfTries= '+ noOfTries, { logId: sessionId});  

        let mobileNumber = common.GetParameterValueFromSessionVars('mobileNumber', outputContexts, sessionId)
        logger.log('info','card.verifyMobileNumberAndGetOtp()>mobileNumber= ' + mobileNumber, { logId: sessionId});  

        let serviceType = common.GetParameterValueFromSessionVars('serviceType', outputContexts, sessionId)
        logger.log('info','card.verifyMobileNumberAndGetOtp()> serviceType= '+ serviceType, { logId: sessionId});  

        let result =await ebl.phoneCheck(mobileNumber, serviceType, sessionId)
        
        logger.log('info','card.verifyMobileNumberAndGetOtp()> result: '+ JSON.stringify(result), { logId: sessionId});  
        session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
           
        if(result == 'timeout'){
            //EBL webmethod timedout  
            actionStatus='timeout';
            eblActionStatus='timeout';         
            noOfTries = noOfTries + 1;
            logger.log('info','card.verifyMobileNumberAndGetOtp()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});  
            logger.log('info','card.verifyMobileNumberAndGetOtp()> EBL webmethod timedout, asking user to enter again', { logId: sessionId});  
            
             if(noOfTries < 3){
                //User still has tries left. Enabling 'awaiting_mobile_number' context and 
                //disabling the 'awaiting_otp' context                 
                let awaiting_mobile_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_mobile_number';
                let awaiting_otp = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_otp';
                contextStr = '[{"name":"' + awaiting_mobile_number + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_otp + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','card.verifyMobileNumberAndGetOtp()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});             
                text = 'Sorry, it seems that there is an issue which is causing a delay. Please enter your 11 digit mobile number again';
                fulfillmentMessages = '[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"text": {"text": ["'+ text +'"]},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';                                       
            }else{ 
                //no more tries left
                logger.log('warn','card.verifyMobileNumberAndGetOtp()>tries exceeded, calling No_MORE_TRIES event', { logId: sessionId}); 
                events.No_MORE_TRIES(responseToUser);
                return;
            }   
        }else {
            actionStatus='success';
            let errorCode = result.PhonecheckResult.ERROR_CODE;
            logger.log('info','card.verifyMobileNumberAndGetOtp()>phoneCheck errorCode= ' + errorCode, { logId: sessionId});               
            if(errorCode == '0000'){

                clientIds = result.PhonecheckResult.CLIENT_ID;
                logger.log('info','card.verifyMobileNumberAndGetOtp()>phoneCheck clientIds= ' + clientIds, { logId: sessionId});  

                //Since user has active cards. generate new OTP
                result = await ebl.botOtp(mobileNumber, serviceType, sessionId);
                logger.log('info','card.verifyMobileNumberAndGetOtp()> botOtp result= '+ JSON.stringify(result), { logId: sessionId});  
                if(result == 'timeout'){
                    //EBL webmethod timedout  
                    actionStatus='timeout';
                    eblActionStatus='timeout';         
                    noOfTries = noOfTries + 1;
                    logger.log('info','card.verifyMobileNumberAndGetOtp()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});  

                    if(noOfTries < 3){
                        //User still has tries left. Enabling 'awaiting_mobile_number' context and 
                        //disabling the 'awaiting_otp'context                 
                        let awaiting_mobile_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_mobile_number';
                        let awaiting_otp = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_otp';
                        contextStr = '[{"name":"' + awaiting_mobile_number + '", "lifespanCount":1, "parameters":{}},{"name":"' + awaiting_otp + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                        logger.log('info','card.verifyMobileNumberAndGetOtp()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});  

                        text = 'Sorry, it seems that there is an issue which is causing a delay. Please enter your 11 digit mobile number';
                        fulfillmentMessages = '[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"text": {"text": ["'+ text +'"]},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';                    
            
                        logger.log('info','card.verifyMobileNumberAndGetOtp()> EBL webmethod timedout, asking user to enter again', { logId: sessionId});  
                    }else{ 
                        //no more tries left
                        logger.log('warn','card.verifyMobileNumberAndGetOtp()>tries exceeded, calling No_MORE_TRIES event', { logId: sessionId}); 
                        events.No_MORE_TRIES(responseToUser);
                        return;
                    }         
                }else{
                    let errorCode = result.BototpResult.ERROR_CODE;
                    logger.log('info','card.verifyMobileNumberAndGetOtp()> botOtp errorCode= ' + errorCode, { logId: sessionId});  
                    if(errorCode == '0000' || errorCode == '000'){
                        eblActionStatus='success';
                        let isValidMobileNumber = "yes";
                        let otp = result.BototpResult.OTP;
                        logger.log('info','card.verifyMobileNumberAndGetOtp()>otp= ' + otp, { logId: sessionId}); 
                        let otpTimestamp= new Date().getTime();

                        noOfTries = 0;
                        logger.log('info','card.verifyMobileNumberAndGetOtp()> noOfTries reset to = '+ noOfTries, { logId: sessionId});   
                                                
                        //continue with 'awaiting_otp' context            
                        contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries + ', "clientIds":"'+ clientIds +'", "mobileNumber":"'+ mobileNumber +'", "isValidMobileNumber":"'+ isValidMobileNumber +'", "otp":"'+ otp +'", "otpTimestamp":"'+ otpTimestamp +'"}}]';
                        logger.log('info','card.verifyMobileNumberAndGetOtp()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});  
                        text = 'Please enter the OTP(one time password) you have received to confirm your identity.';  
                        fulfillmentMessages = '[{"text": {"text": ["'+ text +'"]},"platform": "VIBER"},{"text": {"text": ["'+ text +'"]},"platform":"FACEBOOK"},{"text":{"text":[""]}}] ';                    
            
                    }else{
                        ////OTP request failed     
                        logger.log('warn','card.verifyMobileNumberAndGetOtp()> invalid error code, calling ERROR event', { logId: sessionId});        
                        events.ERROR(responseToUser,sessionId,queryResult,fulfillmentMessages,contextStr);
                        return;                             
                    }  
                }                 
            }else{
                ////get account details failed   
                logger.log('warn','card.verifyMobileNumberAndGetOtp()> invalid error code, calling ERROR event', { logId: sessionId});                     
                events.ERROR(responseToUser,sessionId,queryResult,fulfillmentMessages,contextStr);
                return;
            }
        }        
        logger.log('info','card.verifyMobileNumberAndGetOtp()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId}, { logId: sessionId});
        actionStatus='error';  
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');  
    logger.log('info','card.verifyMobileNumberAndGetOtp()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}

exports.getCreditCardNumbers = function(responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    try{
        
        let quickReplies = [];
        let title = null;

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','getCreditCardNumbers()>Existing noOfTries= '+ noOfTries, { logId: sessionId});  
        noOfTries = 0;
        logger.log('info','getCreditCardNumbers()> noOfTries reset to = '+ noOfTries, { logId: sessionId});   

        let clientIds = common.GetParameterValueFromSessionVars('clientIds', outputContexts, sessionId);

        clientIds = clientIds + ''; //to avoid TypeError: clientIds.split is not a function
        let clientIdsArray = clientIds.split(',');
        let creditCardArray = [];
        let creditCardTypeArray = [];
        
        let i;
        for (i = 0; i < clientIdsArray.length; i++) {
            if(clientIds.split(',')[i].substring(0,2) == 'CR'){
                creditCardArray.push(clientIds.split(',')[i].split(' ')[1])
                creditCardTypeArray.push(clientIds.split(',')[i].split(' ')[3])     
            }          
        }
        logger.log('info','getCreditCardNumbers()>creditCardArray= ' + creditCardArray, { logId: sessionId});   
        logger.log('info','getCreditCardNumbers()>creditCardTypeArray= ' + creditCardTypeArray, { logId: sessionId});  

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        logger.log('info','getCreditCardNumbers()> number of credit Cards = ' + creditCardArray.length, { logId: sessionId});   
        if(creditCardArray.length == 1){
            let selectedCreditCardNumber = creditCardArray[0];
            logger.log('info','getCreditCardNumbers()>selectedCreditCardNumber= ' + selectedCreditCardNumber, { logId: sessionId});  
            //desabling the context 'awaiting_credit_card_number'
            let awaiting_credit_card_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_credit_card_number';
            contextStr = '[{"name":"' + awaiting_credit_card_number + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +', "selectedCreditCardNumber":"'+ selectedCreditCardNumber +'"}}]';
            logger.log('info','getCreditCardNumbers()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});        
            title = 'Please select quick link below or type your question in the space provided';
            quickReplies = [ '"Limit"', '"Outstanding Balance"', '"Available Balance"', '"Last 5 Transactions"','"Mobile Recharge"'];
            fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                    
        }else{
            let cc_hashed= null;
            //title = "You have multple credit cards with EBL. Which card details do you want to view now?";
            //
            let creditCardList='';
            let i;
            for (i = 0; i < creditCardArray.length; i++) {
                logger.log('info','getCreditCardNumbers()>cc > = ' + creditCardArray[i], { logId: sessionId});  
				cc_hashed = creditCardArray[i].substring(0, 4) + "****" +creditCardArray[i].substring(creditCardArray[i].length - 4, creditCardArray[i].length)
                if(cc_hashed.trim().charAt(0)=='3'){
                    cc_hashed+=' Diners Club';
                }else if(cc_hashed.trim().charAt(0)=='4'){
                    cc_hashed+=' Visa';
                }else if(cc_hashed.trim().charAt(0)=='5'){
                    cc_hashed+=' Mastercard';
                }else if(cc_hashed.trim().charAt(0)=='6'){
                    cc_hashed+=' UnionPay';
                }
                quickReplies.push('"'+ cc_hashed + /*" " + creditCardTypeArray[i] + */'"');
                creditCardList+='\\n'+(i+1)+'. '+cc_hashed;
            }
            logger.log('info','getCreditCardNumbers()>quickReplies= ' + quickReplies, { logId: sessionId});  
            //desabling the context 'awaiting_credit_card_assistance'
            let awaiting_credit_card_assistance = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_credit_card_assistance';
            contextStr = '[{"name":"' + awaiting_credit_card_assistance + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
            logger.log('info','getCreditCardNumbers()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});    
            //fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                          
            title = "Please type serial number of card you wish to see information of. For example to see first card's information type 1 "+creditCardList;
            fulfillmentMessages = '[{"text": {"text": ["'+ title +'"]},"platform": "VIBER"},{"text": {"text": ["'+ title +'"]},"platform": "FACEBOOK"}] ';        
       }       
        logger.log('info','getCreditCardNumbers()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');
    
    logger.log('info','getCreditCardNumbers()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}

exports.getCreditCardNumbersForMobRecharge = function(responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    try{
        
        let quickReplies = [];
        let title = null;

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','getCreditCardNumbersForMobRecharge()>Existing noOfTries= '+ noOfTries, { logId: sessionId});  
        noOfTries = 0;
        logger.log('info','getCreditCardNumbersForMobRecharge()> noOfTries reset to = '+ noOfTries, { logId: sessionId});   

        let clientIds = common.GetParameterValueFromSessionVars('clientIds', outputContexts, sessionId);

        clientIds = clientIds + ''; //to avoid TypeError: clientIds.split is not a function
        let clientIdsArray = clientIds.split(',');
        let creditCardArray = [];
        let creditCardTypeArray = [];
        
        let i;
        for (i = 0; i < clientIdsArray.length; i++) {
            if(clientIds.split(',')[i].substring(0,2) == 'CR'){
                creditCardArray.push(clientIds.split(',')[i].split(' ')[1])
                creditCardTypeArray.push(clientIds.split(',')[i].split(' ')[3])     
            }          
        }
        logger.log('info','getCreditCardNumbersForMobRecharge()>creditCardArray= ' + creditCardArray, { logId: sessionId});   
        logger.log('info','getCreditCardNumbersForMobRecharge()>creditCardTypeArray= ' + creditCardTypeArray, { logId: sessionId});  

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        logger.log('info','getCreditCardNumbersForMobRecharge()> number of credit Cards = ' + creditCardArray.length, { logId: sessionId});   
        if(creditCardArray.length == 1){
            let selectedCreditCardNumber = creditCardArray[0];
            logger.log('info','getCreditCardNumbersForMobRecharge()>selectedCreditCardNumber= ' + selectedCreditCardNumber, { logId: sessionId});   
            //desabling the context 'awaiting_credit_card_number_for_mobile_recharge'
            let awaiting_credit_card_number_for_mobile_recharge = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_credit_card_number_for_mobile_recharge';
            contextStr = '[{"name":"' + awaiting_credit_card_number_for_mobile_recharge + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +', "selectedCreditCardNumber":"'+ selectedCreditCardNumber +'"}}]';
            logger.log('info','getCreditCardNumbersForMobRecharge()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});       
            title = 'Which type of mobile recharge would you like to perform';
            quickReplies = ['"Prepaid"', '"Postpaid"'];
            fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                    
        }else{
            let cc_hashed= null;
            //title = "You have multple credit cards with EBL. Which card details do you want to view now?";
            //
            let creditCardList='';
            let i;
            for (i = 0; i < creditCardArray.length; i++) {
                logger.log('info','getCreditCardNumbersForMobRecharge()>cc > = ' + creditCardArray[i], { logId: sessionId});  
				cc_hashed = creditCardArray[i].substring(0, 4) + "****" +creditCardArray[i].substring(creditCardArray[i].length - 4, creditCardArray[i].length)
                if(cc_hashed.trim().charAt(0)=='3'){
                    cc_hashed+=' Diners Club';
                }else if(cc_hashed.trim().charAt(0)=='4'){
                    cc_hashed+=' Visa';
                }else if(cc_hashed.trim().charAt(0)=='5'){
                    cc_hashed+=' Mastercard';
                }else if(cc_hashed.trim().charAt(0)=='6'){
                    cc_hashed+=' UnionPay';
                }
                quickReplies.push('"'+ cc_hashed + /*" " + creditCardTypeArray[i] + */'"');
                creditCardList+='\\n'+(i+1)+'. '+cc_hashed;
            }
            logger.log('info','getCreditCardNumbersForMobRecharge()>quickReplies= ' + quickReplies, { logId: sessionId});  
            //desabling the context 'awaiting_mobile_recharge_type'
            let awaiting_mobile_recharge_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_mobile_recharge_type';
            contextStr = '[{"name":"' + awaiting_mobile_recharge_type + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
            logger.log('info','getCreditCardNumbersForMobRecharge()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});    
            //fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                          
            title = "Please type serial number of card you wish to see information of. For example to see first card's information type 1 "+creditCardList;
            fulfillmentMessages = '[{"text": {"text": ["'+ title +'"]},"platform": "VIBER"},{"text": {"text": ["'+ title +'"]},"platform": "FACEBOOK"}] ';        
       }       
        logger.log('info','getCreditCardNumbersForMobRecharge()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');
    logger.log('info','getCreditCardNumbersForMobRecharge()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}

exports.getPrepaidCardNumbers = function(responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    try{
        
        let quickReplies = [];
        let title = null;

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','getPrepaidCardNumbers()>Existing noOfTries= '+ noOfTries, { logId: sessionId});  
        noOfTries = 0;
        logger.log('info','getPrepaidCardNumbers()> noOfTries reset to = '+ noOfTries, { logId: sessionId});   

        let clientIds = common.GetParameterValueFromSessionVars('clientIds', outputContexts, sessionId);

        clientIds = clientIds + ''; //to avoid TypeError: clientIds.split is not a function
        let clientIdsArray = clientIds.split(',');
        let prepaidCardArray = [];
        
        let i;
        for (i = 0; i < clientIdsArray.length; i++) {
            if(clientIds.split(',')[i].substring(0,2) == 'PP'){
                prepaidCardArray.push(clientIds.split(',')[i].split(' ')[1])     
            }          
        }
        logger.log('info','getPrepaidCardNumbers()>prepaidCardArray= ' + prepaidCardArray, { logId: sessionId});   

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        logger.log('info','getPrepaidCardNumbers()> number of prepaid Cards = ' + prepaidCardArray.length, { logId: sessionId});  
        if(prepaidCardArray.length == 1){
            let selectedPrepaidCardNumber = prepaidCardArray[0];
            logger.log('info','getPrepaidCardNumbers()>selectedPrepaidCardNumber= ' + selectedPrepaidCardNumber, { logId: sessionId});   
            //desabling the context 'awaiting_credit_card_number'
            let awaiting_prepaid_card_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_prepaid_card_number';
            contextStr = '[{"name":"' + awaiting_prepaid_card_number + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +', "selectedPrepaidCardNumber":"'+ selectedPrepaidCardNumber +'"}}]';
            logger.log('info','getPrepaidCardNumbers()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});         
            title = 'Please select quick link below or type your question in the space provided';
            quickReplies = ['"Available Balance"', '"Last 5 Transactions"', '"Mobile Recharge"'];
            fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                    
        }else{
            let pp_hashed= null;
            //title = "You have multple prepaid cards with EBL. Which card details do you want to view now?";
            //
            let i;
            let prepaidCardList='';
            for (i = 0; i < prepaidCardArray.length; i++) {
                logger.log('info','getPrepaidCardNumbers()>pp > = ' + prepaidCardArray[i], { logId: sessionId});  
				pp_hashed = prepaidCardArray[i].substring(0, 4) + "****" +prepaidCardArray[i].substring(prepaidCardArray[i].length - 4, prepaidCardArray[i].length)
                if(pp_hashed.trim().charAt(0)=='3'){
                    pp_hashed+=' Diners Club';
                }else if(pp_hashed.trim().charAt(0)=='4'){
                    pp_hashed+=' Visa';
                }else if(pp_hashed.trim().charAt(0)=='5'){
                    pp_hashed+=' Mastercard';
                }else if(pp_hashed.trim().charAt(0)=='6'){
                    pp_hashed+=' UnionPay';
                }
                quickReplies.push('"'+ pp_hashed + '"');
                prepaidCardList+='\\n'+(i+1)+'. '+pp_hashed;
            }
            logger.log('info','getPrepaidCardNumbers()>quickReplies= ' + quickReplies, { logId: sessionId});  
            //desabling the context 'awaiting_prepaid_card_assistance'
            let awaiting_prepaid_card_assistance = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_prepaid_card_assistance';
            contextStr = '[{"name":"' + awaiting_prepaid_card_assistance + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
            logger.log('info','getPrepaidCardNumbers()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});    
            //fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                          
            title = "Please type serial number of card you wish to see information of. For example to see first card's information type 1 "+prepaidCardList;
            fulfillmentMessages = '[{"text": {"text": ["'+ title +'"]},"platform": "VIBER"},{"text": {"text": ["'+ title +'"]},"platform": "FACEBOOK"}] ';        
       }       
        logger.log('info','getPrepaidCardNumbers()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');
    logger.log('info','getPrepaidCardNumbers()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}

exports.getPrepaidCardNumbersForMobRecharge = function(responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    try{
        
        let quickReplies = [];
        let title = null;

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','getPrepaidCardNumbersForMobRecharge()>Existing noOfTries= '+ noOfTries, { logId: sessionId});  
        noOfTries = 0;
        logger.log('info','getPrepaidCardNumbersForMobRecharge()> noOfTries reset to = '+ noOfTries, { logId: sessionId});   

        let clientIds = common.GetParameterValueFromSessionVars('clientIds', outputContexts, sessionId);

        clientIds = clientIds + ''; //to avoid TypeError: clientIds.split is not a function
        let clientIdsArray = clientIds.split(',');
        let prepaidCardArray = [];
        
        let i;
        for (i = 0; i < clientIdsArray.length; i++) {
            if(clientIds.split(',')[i].substring(0,2) == 'PP'){
                prepaidCardArray.push(clientIds.split(',')[i].split(' ')[1])     
            }          
        }
        logger.log('info','getPrepaidCardNumbersForMobRecharge()>prepaidCardArray= ' + prepaidCardArray, { logId: sessionId});    

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        logger.log('info','getPrepaidCardNumbersForMobRecharge()> number of prepaid Cards = ' + prepaidCardArray.length, { logId: sessionId});   
        if(prepaidCardArray.length == 1){
            let selectedPrepaidCardNumber = prepaidCardArray[0];
            logger.log('info','getPrepaidCardNumbersForMobRecharge()>selectedPrepaidCardNumber= ' + selectedPrepaidCardNumber, { logId: sessionId});   
            //desabling the context 'awaiting_credit_card_number_for_mobile_recharge'
            let awaiting_credit_card_number_for_mobile_recharge = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_credit_card_number_for_mobile_recharge';
            contextStr = '[{"name":"' + awaiting_credit_card_number_for_mobile_recharge + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +', "selectedPrepaidCardNumber":"'+ selectedPrepaidCardNumber +'"}}]';
            logger.log('info','getPrepaidCardNumbersForMobRecharge()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});          
            title = 'Which type of mobile recharge would you like to perform';
            quickReplies = ['"Prepaid"', '"Postpaid"'];
            fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                    
        }else{
            let pp_hashed= null;
            //title = "You have multiple prepaid cards with EBL. Which card details do you want to view now?";
            let prepaidCardList='';
            //
            let i;
            for (i = 0; i < prepaidCardArray.length; i++) {
                logger.log('info','getPrepaidCardNumbersForMobRecharge()>pp > = ' + prepaidCardArray[i], { logId: sessionId});  
				pp_hashed = prepaidCardArray[i].substring(0, 4) + "****" +prepaidCardArray[i].substring(prepaidCardArray[i].length - 4, prepaidCardArray[i].length)
                if(pp_hashed.trim().charAt(0)=='3'){
                    pp_hashed+=' Diners Club';
                }else if(pp_hashed.trim().charAt(0)=='4'){
                    pp_hashed+=' Visa';
                }else if(pp_hashed.trim().charAt(0)=='5'){
                    pp_hashed+=' Mastercard';
                }else if(pp_hashed.trim().charAt(0)=='6'){
                    pp_hashed+=' UnionPay';
                }
                quickReplies.push('"'+ pp_hashed + '"');
                prepaidCardList+='\\n'+(i+1)+'. '+pp_hashed;
            }
            logger.log('info','getPrepaidCardNumbersForMobRecharge()>quickReplies= ' + quickReplies, { logId: sessionId});  
            //desabling the context 'awaiting_mobile_recharge_type'
            let awaiting_mobile_recharge_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_mobile_recharge_type';
            contextStr = '[{"name":"' + awaiting_mobile_recharge_type + '", "lifespanCount":0, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
            logger.log('info','getPrepaidCardNumbersForMobRecharge()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});    
            //fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                          
            title = "Please type serial number of card you wish to see information of. For example to see first card's information type 1 "+prepaidCardList;
            fulfillmentMessages = '[{"text": {"text": ["'+ title +'"]},"platform": "VIBER"},{"text": {"text": ["'+ title +'"]},"platform": "FACEBOOK"}] ';        
        }       
        logger.log('info','getPrepaidCardNumbersForMobRecharge()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');
    logger.log('info','getPrepaidCardNumbersForMobRecharge()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}

exports.verifyCreditCardNumber = function(responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    try{
        
        let quickReplies = [];
        let title = null;
        let isCreditCardNumberMatching = false;

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','verifyCreditCardNumber()>Existing noOfTries= '+ noOfTries, { logId: sessionId});  

        let userProvidedCreditCardNumber = common.GetParameterValueFromSessionVars('userProvidedCreditCardNumber', outputContexts, sessionId)
        userProvidedCreditCardNumber=userProvidedCreditCardNumber.replace(/ /g,'');
        logger.log('info','verifyCreditCardNumber()>userProvidedCreditCardNumber= '+ userProvidedCreditCardNumber, { logId: sessionId});  

        let clientIds = common.GetParameterValueFromSessionVars('clientIds', outputContexts, sessionId);

        clientIds = clientIds + ''; //to avoid TypeError: clientIds.split is not a function
        let clientIdsArray = clientIds.split(',');
        let creditCardArray = [];
        let creditCardTypeArray = [];
        
        let i;
        for (i = 0; i < clientIdsArray.length; i++) {
            if(clientIds.split(',')[i].substring(0,2) == 'CR'){
                creditCardArray.push(clientIds.split(',')[i].split(' ')[1])   
                creditCardTypeArray.push(clientIds.split(',')[i].split(' ')[3]) 
            }          
        }
        logger.log('info','verifyCreditCardNumber()>creditCardArray= ' + creditCardArray, { logId: sessionId});   
        logger.log('info','verifyCreditCardNumber()>creditCardTypeArray= ' + creditCardTypeArray, { logId: sessionId});  

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        
        logger.log('info','verifyCreditCardNumber()> number of credit Cards = ' + creditCardArray.length, { logId: sessionId});  
        
        let cc_hashed = null;
        let selectedCreditCardNumber = null; 
        if(creditCardArray[userProvidedCreditCardNumber-1]!=undefined){
            userProvidedCreditCardNumber=creditCardArray[userProvidedCreditCardNumber-1].toString();
        }
        for (i = 0; i < creditCardArray.length; i++) {            
            cc_hashed = creditCardArray[i].substring(0, 4) + "****" +creditCardArray[i].substring(creditCardArray[i].length - 4, creditCardArray[i].length)
            cc_hashed = cc_hashed /*+ " " + creditCardTypeArray[i]*/;
            logger.log('info','verifyCreditCardNumber()>cc_hashed = ' + cc_hashed, { logId: sessionId});  
            //mathcing with 'full hashed CC with type' or 'last 4 digits of credit card number' or 'full plain CC' or 'full hashed without type'
            if(userProvidedCreditCardNumber == cc_hashed || 
            userProvidedCreditCardNumber == creditCardArray[i].substring(creditCardArray[i].length - 4, creditCardArray[i].length) ||
            userProvidedCreditCardNumber == creditCardArray[i] ||
            userProvidedCreditCardNumber == cc_hashed.split(' ')[0]){
                isCreditCardNumberMatching = true;
                selectedCreditCardNumber = creditCardArray[i];
                logger.log('info','verifyCreditCardNumber()>Credit card number is matching>  ' + selectedCreditCardNumber, { logId: sessionId});  
                noOfTries = 0;
                logger.log('info','verifyCreditCardNumber()> noOfTries reseted to 0', { logId: sessionId});  
                contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +', "selectedCreditCardNumber":"'+ selectedCreditCardNumber +'"}}]';
                logger.log('info','verifyCreditCardNumber()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});         
                title = 'Please select quick link below or type your question in the space provided';
                quickReplies = [ '"Limit"', '"Outstanding Balance"', '"Available Balance"','"Last 5 Transactions"', '"Mobile Recharge"'];
                fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                    
                break;
            }
        }
        logger.log('info','verifyCreditCardNumber()> isCreditCardNumberMatching = '+ isCreditCardNumberMatching, { logId: sessionId});  
        if(isCreditCardNumberMatching == false){
            //Credit card number is NOT  matching   
            noOfTries = noOfTries + 1;
            logger.log('info','verifyCreditCardNumber()> Credit Card number is NOT  matching, incremented noOfTries to = '+ noOfTries, { logId: sessionId});   
            if(noOfTries < 3){
                logger.log('info','verifyCreditCardNumber()>User still has tries left, asking user to try again.', { logId: sessionId});               
                //title = "Sorry, credit card number is not matching. Please select or enter last four digits of credit card number";
                let creditCardList='';                
                for (i = 0; i < creditCardArray.length; i++) {
                    logger.log('info','verifyCreditCardNumber()>cc > = ' + creditCardArray[i], { logId: sessionId});  
                    cc_hashed = creditCardArray[i].substring(0, 4) + "****" +creditCardArray[i].substring(creditCardArray[i].length - 4, creditCardArray[i].length)
                    if(cc_hashed.trim().charAt(0)=='3'){
                        cc_hashed+=' Diners Club';
                    }else if(cc_hashed.trim().charAt(0)=='4'){
                        cc_hashed+=' Visa';
                    }else if(cc_hashed.trim().charAt(0)=='5'){
                        cc_hashed+=' Mastercard';
                    }else if(cc_hashed.trim().charAt(0)=='6'){
                        cc_hashed+=' UnionPay';
                    }
                    quickReplies.push('"'+ cc_hashed + /*" " + creditCardTypeArray[i] + */'"');
                    creditCardList+='\\n'+(i+1)+'. '+cc_hashed;
                }
                logger.log('info','verifyCreditCardNumber()>quickReplies= ' + quickReplies, { logId: sessionId});  
                //desabling the context 'awaiting_credit_card_assistance' and adding the context 'awaiting_credit_card_number'
                let awaiting_credit_card_assistance = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_credit_card_assistance';
                let awaiting_credit_card_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_credit_card_number';
                contextStr = '[{"name":"' + awaiting_credit_card_assistance + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_credit_card_number + '", "lifespanCount":1, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','verifyCreditCardNumber()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});    
                //fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                          
                title = "Sorry, credit card number is not matching. Please type serial number of card you wish to see information of. For example to see first card's information type 1 "+creditCardList;
                fulfillmentMessages = '[{"text": {"text": ["'+ title +'"]},"platform": "VIBER"},{"text": {"text": ["'+ title +'"]},"platform": "FACEBOOK"}] ';        
           }
            else 
            {   //no more tries left
                logger.log('warn','verifyCreditCardNumber()>tries exceeded, calling No_MORE_TRIES event', { logId: sessionId}); 
                events.No_MORE_TRIES(responseToUser);
                return;   
            } 
        }       
        logger.log('info','verifyCreditCardNumber()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');
    logger.log('info','verifyCreditCardNumber()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}

exports.verifyCreditCardNumberForMobRecharge = function(responseToUser, outputContexts, sessionId ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    try{
       
        let quickReplies = [];
        let title = null;
        let isCreditCardNumberMatching = false;

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','verifyCreditCardNumberForMobRecharge()>Existing noOfTries= '+ noOfTries, { logId: sessionId});   

        let userProvidedCreditCardNumber = common.GetParameterValueFromSessionVars('userProvidedCreditCardNumber', outputContexts, sessionId)
        userProvidedCreditCardNumber=userProvidedCreditCardNumber.replace(/ /g,'');
        logger.log('info','verifyCreditCardNumberForMobRecharge()>userProvidedCreditCardNumber= '+ userProvidedCreditCardNumber, { logId: sessionId});  

        let clientIds = common.GetParameterValueFromSessionVars('clientIds', outputContexts, sessionId);

        clientIds = clientIds + ''; //to avoid TypeError: clientIds.split is not a function
        let clientIdsArray = clientIds.split(',');
        let creditCardArray = [];
        let creditCardTypeArray = [];
        
        let i;
        for (i = 0; i < clientIdsArray.length; i++) {
            if(clientIds.split(',')[i].substring(0,2) == 'CR'){
                creditCardArray.push(clientIds.split(',')[i].split(' ')[1])   
                creditCardTypeArray.push(clientIds.split(',')[i].split(' ')[3]) 
            }          
        }
        logger.log('info','verifyCreditCardNumberForMobRecharge()>creditCardArray= ' + creditCardArray, { logId: sessionId});  
        logger.log('info','verifyCreditCardNumberForMobRecharge()>creditCardTypeArray= ' + creditCardTypeArray, { logId: sessionId});  

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        
        logger.log('info','verifyCreditCardNumberForMobRecharge()> number of credit Cards = ' + creditCardArray.length, { logId: sessionId});  
        
        let cc_hashed = null;
        let selectedCreditCardNumber = null; 
        if(creditCardArray[userProvidedCreditCardNumber-1]!=undefined){
            userProvidedCreditCardNumber=creditCardArray[userProvidedCreditCardNumber-1].toString();
        }
        for (i = 0; i < creditCardArray.length; i++) {            
            cc_hashed = creditCardArray[i].substring(0, 4) + "****" +creditCardArray[i].substring(creditCardArray[i].length - 4, creditCardArray[i].length)
            cc_hashed = cc_hashed /*+ " " + creditCardTypeArray[i]*/;
            logger.log('info','verifyCreditCardNumberForMobRecharge()>cc_hashed = ' + cc_hashed, { logId: sessionId});  
            //mathcing with 'full hashed CC with type' or 'last 4 digits of credit card number' or 'full plain CC' or 'full hashed without type'
            if(userProvidedCreditCardNumber == cc_hashed || 
            userProvidedCreditCardNumber == creditCardArray[i].substring(creditCardArray[i].length - 4, creditCardArray[i].length) ||
            userProvidedCreditCardNumber == creditCardArray[i] ||
            userProvidedCreditCardNumber == cc_hashed.split(' ')[0]){
                isCreditCardNumberMatching = true;
                selectedCreditCardNumber = creditCardArray[i];
                logger.log('info','verifyCreditCardNumberForMobRecharge()>Credit card number is matching>  ' + selectedCreditCardNumber, { logId: sessionId});  
                noOfTries = 0;
                logger.log('info','verifyCreditCardNumberForMobRecharge()> noOfTries reseted to 0', { logId: sessionId});  
                contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +', "selectedCreditCardNumber":"'+ selectedCreditCardNumber +'"}}]';
                logger.log('info','verifyCreditCardNumberForMobRecharge()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});         
                title = 'Which type of mobile recharge would you like to perform';
                quickReplies = ['"Prepaid"', '"Postpaid"'];
                fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                    
                break;
            }
        }
        logger.log('info','verifyCreditCardNumberForMobRecharge()> isCreditCardNumberMatching = '+ isCreditCardNumberMatching, { logId: sessionId});  
        if(isCreditCardNumberMatching == false){
            //Credit card number is NOT  matching   
            noOfTries = noOfTries + 1;
            logger.log('info','verifyCreditCardNumberForMobRecharge()> Credit Card number is NOT  matching, incremented noOfTries to = '+ noOfTries, { logId: sessionId});    
            if(noOfTries < 3){
                logger.log('info','verifyCreditCardNumberForMobRecharge()>User still has tries left, asking user to try again.', { logId: sessionId});                  
                //title = "Sorry, credit card number is not matching. Please select or enter last four digits of credit card number";
                 let creditCardList='';               
                for (i = 0; i < creditCardArray.length; i++) {
                    logger.log('info','verifyCreditCardNumberForMobRecharge()>cc > = ' + creditCardArray[i], { logId: sessionId});  
                    cc_hashed = creditCardArray[i].substring(0, 4) + "****" +creditCardArray[i].substring(creditCardArray[i].length - 4, creditCardArray[i].length)
                    if(cc_hashed.trim().charAt(0)=='3'){
                        cc_hashed+=' Diners Club';
                    }else if(cc_hashed.trim().charAt(0)=='4'){
                        cc_hashed+=' Visa';
                    }else if(cc_hashed.trim().charAt(0)=='5'){
                        cc_hashed+=' Mastercard';
                    }else if(cc_hashed.trim().charAt(0)=='6'){
                        cc_hashed+=' UnionPay';
                    }
                    quickReplies.push('"'+ cc_hashed +/* " " + creditCardTypeArray[i] + */'"');
                    creditCardList+='\\n'+(i+1)+'. '+cc_hashed;
                }
                logger.log('info','verifyCreditCardNumberForMobRecharge()>quickReplies= ' + quickReplies, { logId: sessionId});  
                //desabling the context 'awaiting_mobile_recharge_type' and adding the context 'awaiting_credit_card_number_for_mobile_recharge'
                let awaiting_mobile_recharge_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_mobile_recharge_type';
                let awaiting_credit_card_number_for_mobile_recharge = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_credit_card_number_for_mobile_recharge';
                contextStr = '[{"name":"' + awaiting_mobile_recharge_type + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_credit_card_number_for_mobile_recharge + '", "lifespanCount":1, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','verifyCreditCardNumberForMobRecharge()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});    
                //fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                          
                title = "Sorry, credit card number is not matching. Please type serial number of card you wish to see information of. For example to see first card's information type 1 "+creditCardList;
                fulfillmentMessages = '[{"text": {"text": ["'+ title +'"]},"platform": "VIBER"},{"text": {"text": ["'+ title +'"]},"platform": "FACEBOOK"}] ';        
           }
            else 
            {   //no more tries left
                logger.log('warn','verifyCreditCardNumberForMobRecharge()>tries exceeded, calling No_MORE_TRIES event', { logId: sessionId}); 
                events.No_MORE_TRIES(responseToUser);
                return;   
            } 
        }       
        logger.log('info','verifyCreditCardNumberForMobRecharge()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');
    logger.log('info','verifyCreditCardNumberForMobRecharge()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}

exports.verifyPrepaidCardNumber = function(responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    try{
        
        let quickReplies = [];
        let title = null;
        let isPrepaidCardNumberMatching = false;

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','verifyPrepaidCardNumber()>Existing noOfTries= '+ noOfTries, { logId: sessionId});   

        let userProvidedPrepaidCardNumber = common.GetParameterValueFromSessionVars('userProvidedPrepaidCardNumber', outputContexts, sessionId)
        userProvidedPrepaidCardNumber=userProvidedPrepaidCardNumber.replace(/ /g,'');
        logger.log('info','verifyPrepaidCardNumber()>userProvidedPrepaidCardNumber= '+ userProvidedPrepaidCardNumber, { logId: sessionId});  

        let clientIds = common.GetParameterValueFromSessionVars('clientIds', outputContexts, sessionId);

        clientIds = clientIds + ''; //to avoid TypeError: clientIds.split is not a function
        let clientIdsArray = clientIds.split(',');
        let prepaidCardArray = [];
        
        let i;
        for (i = 0; i < clientIdsArray.length; i++) {
            if(clientIds.split(',')[i].substring(0,2) == 'PP'){
                prepaidCardArray.push(clientIds.split(',')[i].split(' ')[1])  
            }          
        }
        logger.log('info','verifyPrepaidCardNumber()>prepaidCardArray= ' + prepaidCardArray, { logId: sessionId});  

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        
        logger.log('info','verifyPrepaidCardNumber()> number of prepaid Cards = ' + prepaidCardArray.length, { logId: sessionId});  
        
        let pp_hashed = null;
        let selectedPrepaidCardNumber = null; // It will be used as input get card details
        if(prepaidCardArray[userProvidedPrepaidCardNumber-1]!=undefined){
            userProvidedPrepaidCardNumber=prepaidCardArray[userProvidedPrepaidCardNumber-1].toString();
        }
        for (i = 0; i < prepaidCardArray.length; i++) {            
            pp_hashed = prepaidCardArray[i].substring(0, 4) + "****" +prepaidCardArray[i].substring(prepaidCardArray[i].length - 4, prepaidCardArray[i].length)
            
            logger.log('info','verifyPrepaidCardNumber()>pp_hashed = ' + pp_hashed, { logId: sessionId});  
            //mathcing with 'full hashed PP'  or 'last 4 digits of prepaid card number' or 'full plain PP'
            if(userProvidedPrepaidCardNumber == pp_hashed || 
            userProvidedPrepaidCardNumber == prepaidCardArray[i].substring(prepaidCardArray[i].length - 4, prepaidCardArray[i].length) ||
            userProvidedPrepaidCardNumber == prepaidCardArray[i]){
                isPrepaidCardNumberMatching = true;
                selectedPrepaidCardNumber = prepaidCardArray[i];
                logger.log('info','verifyPrepaidCardNumber()>Prepaid card number is matching>  ' + selectedPrepaidCardNumber, { logId: sessionId});  
                noOfTries = 0;
                logger.log('info','verifyPrepaidCardNumber()> noOfTries reseted to 0', { logId: sessionId});  
                contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +', "selectedPrepaidCardNumber":"'+ selectedPrepaidCardNumber +'"}}]';
                logger.log('info','verifyPrepaidCardNumber()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});         
                title = 'Please select quick link below or type your question in the space provided';
                quickReplies = ['"Available Balance"', '"Last 5 Transactions"', '"Mobile Recharge"'];
                fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                    
                break;
            }
        }
        logger.log('info','verifyPrepaidCardNumber()> isPrepaidCardNumberMatching = '+ isPrepaidCardNumberMatching, { logId: sessionId});  
        if(isPrepaidCardNumberMatching == false){
            //Credit card number is NOT  matching   
            noOfTries = noOfTries + 1;
            logger.log('info','verifyPrepaidCardNumber()> Prepaid Card number is NOT  matching, incremented noOfTries to = '+ noOfTries, { logId: sessionId});    
            if(noOfTries < 3){
                logger.log('info','verifyPrepaidCardNumber()>User still has tries left, asking user to try again.', { logId: sessionId});                  
                //title = "Sorry, prepaid card number is not matching. Please select or enter last four digits of prepaid card number";
                let prepaidCardList='';                
                for (i = 0; i < prepaidCardArray.length; i++) {
                    logger.log('info','verifyPrepaidCardNumber()>pp > = ' + prepaidCardArray[i], { logId: sessionId});  
                    pp_hashed = prepaidCardArray[i].substring(0, 4) + "****" +prepaidCardArray[i].substring(prepaidCardArray[i].length - 4, prepaidCardArray[i].length)
                    if(pp_hashed.trim().charAt(0)=='3'){
                        pp_hashed+=' Diners Club';
                    }else if(pp_hashed.trim().charAt(0)=='4'){
                        pp_hashed+=' Visa';
                    }else if(pp_hashed.trim().charAt(0)=='5'){
                        pp_hashed+=' Mastercard';
                    }else if(pp_hashed.trim().charAt(0)=='6'){
                        pp_hashed+=' UnionPay';
                    }
                    quickReplies.push('"'+ pp_hashed + '"');
                    prepaidCardList+='\\n'+(i+1)+'. '+pp_hashed;
                }
                logger.log('info','verifyPrepaidCardNumber()>quickReplies= ' + quickReplies, { logId: sessionId});  
                //desabling the context 'awaiting_prepaid_card_assistance' and adding the context 'awaiting_prepaid_card_number'
                let awaiting_prepaid_card_assistance = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_prepaid_card_assistance';
                let awaiting_prepaid_card_number = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_prepaid_card_number';
                contextStr = '[{"name":"' + awaiting_prepaid_card_assistance + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_prepaid_card_number + '", "lifespanCount":1, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','verifyPrepaidCardNumber()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});   
                //fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                          
                title = "Sorry, prepaid card number is not matching. Please type serial number of card you wish to see information of. For example to see first card's information type 1 "+prepaidCardList;
                fulfillmentMessages = '[{"text": {"text": ["'+ title +'"]},"platform": "VIBER"},{"text": {"text": ["'+ title +'"]},"platform": "FACEBOOK"}] ';        
           }
            else 
            {   //no more tries left
                logger.log('warn','verifyPrepaidCardNumber()>tries exceeded, calling No_MORE_TRIES event', { logId: sessionId}); 
                events.No_MORE_TRIES(responseToUser);
                return;   
            } 
        }       
        logger.log('info','verifyPrepaidCardNumber()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');
    logger.log('info','verifyPrepaidCardNumber()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}

exports.verifyPrepaidCardNumberForMobRecharge = function(responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    try{
       
        let quickReplies = [];
        let title = null;
        let isPrepaidCardNumberMatching = false;

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','verifyPrepaidCardNumberForMobRecharge()>Existing noOfTries= '+ noOfTries, { logId: sessionId});   

        let userProvidedPrepaidCardNumber = common.GetParameterValueFromSessionVars('userProvidedPrepaidCardNumber', outputContexts, sessionId)
        userProvidedPrepaidCardNumber=userProvidedPrepaidCardNumber.replace(/ /g,'');
        logger.log('info','verifyPrepaidCardNumberForMobRecharge()>userProvidedPrepaidCardNumber= '+ userProvidedPrepaidCardNumber, { logId: sessionId});  

        let clientIds = common.GetParameterValueFromSessionVars('clientIds', outputContexts, sessionId);

        clientIds = clientIds + ''; //to avoid TypeError: clientIds.split is not a function
        let clientIdsArray = clientIds.split(',');
        let prepaidCardArray = [];
        
        let i;
        for (i = 0; i < clientIdsArray.length; i++) {
            if(clientIds.split(',')[i].substring(0,2) == 'PP'){
                prepaidCardArray.push(clientIds.split(',')[i].split(' ')[1])  
            }          
        }
        logger.log('info','verifyPrepaidCardNumberForMobRecharge()>prepaidCardArray= ' + prepaidCardArray, { logId: sessionId});   

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        
        logger.log('info','verifyPrepaidCardNumberForMobRecharge()> number of prepaid Cards = ' + prepaidCardArray.length, { logId: sessionId});  
        
        let pp_hashed = null;
        let selectedPrepaidCardNumber = null; // It will be used as input get card details
        if(prepaidCardArray[userProvidedPrepaidCardNumber-1]!=undefined){
            userProvidedPrepaidCardNumber=prepaidCardArray[userProvidedPrepaidCardNumber-1].toString();
        }
        for (i = 0; i < prepaidCardArray.length; i++) {            
            pp_hashed = prepaidCardArray[i].substring(0, 4) + "****" +prepaidCardArray[i].substring(prepaidCardArray[i].length - 4, prepaidCardArray[i].length)
            
            logger.log('info','verifyPrepaidCardNumberForMobRecharge()>pp_hashed = ' + pp_hashed, { logId: sessionId});  
            //mathcing with 'full hashed PP'  or 'last 4 digits of prepaid card number' or 'full plain PP'
            if(userProvidedPrepaidCardNumber == pp_hashed || 
            userProvidedPrepaidCardNumber == prepaidCardArray[i].substring(prepaidCardArray[i].length - 4, prepaidCardArray[i].length) ||
            userProvidedPrepaidCardNumber == prepaidCardArray[i]){
                isPrepaidCardNumberMatching = true;
                selectedPrepaidCardNumber = prepaidCardArray[i];
                logger.log('info','verifyPrepaidCardNumberForMobRecharge()>Prepaid card number is matching>  ' + selectedPrepaidCardNumber, { logId: sessionId});  
                noOfTries = 0;
                logger.log('info','verifyPrepaidCardNumberForMobRecharge()> noOfTries reseted to 0', { logId: sessionId});  
                contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +', "selectedPrepaidCardNumber":"'+ selectedPrepaidCardNumber +'"}}]';
                logger.log('info','verifyPrepaidCardNumberForMobRecharge()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});         
                title = 'Which type of mobile recharge would you like to perform';
                quickReplies = ['"Prepaid"', '"Postpaid"'];
                fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                    
                break;
            }
        }
        logger.log('info','verifyPrepaidCardNumberForMobRecharge()> isPrepaidCardNumberMatching = '+ isPrepaidCardNumberMatching, { logId: sessionId});  
        if(isPrepaidCardNumberMatching == false){
            //Credit card number is NOT  matching   
            noOfTries = noOfTries + 1;
            logger.log('info','verifyPrepaidCardNumberForMobRecharge()> Prepaid Card number is NOT  matching, incremented noOfTries to = '+ noOfTries, { logId: sessionId});    
            if(noOfTries < 3){
                logger.log('info','verifyPrepaidCardNumberForMobRecharge()>User still has tries left, asking user to try again.', { logId: sessionId});               
                //title = "Sorry, prepaid card number is not matching. Please select or enter last four digits of prepaid card number";
                let prepaidCardList='';                
                for (i = 0; i < prepaidCardArray.length; i++) {
                    logger.log('info','verifyPrepaidCardNumberForMobRecharge()>pp > = ' + prepaidCardArray[i], { logId: sessionId});  
                    pp_hashed = prepaidCardArray[i].substring(0, 4) + "****" +prepaidCardArray[i].substring(prepaidCardArray[i].length - 4, prepaidCardArray[i].length)
                    if(pp_hashed.trim().charAt(0)=='3'){
                        pp_hashed+=' Diners Club';
                    }else if(pp_hashed.trim().charAt(0)=='4'){
                        pp_hashed+=' Visa';
                    }else if(pp_hashed.trim().charAt(0)=='5'){
                        pp_hashed+=' Mastercard';
                    }else if(pp_hashed.trim().charAt(0)=='6'){
                        pp_hashed+=' UnionPay';
                    }
                    quickReplies.push('"'+ pp_hashed + '"');
                    prepaidCardList+='\\n'+(i+1)+'. '+pp_hashed;
                }
                logger.log('info','verifyPrepaidCardNumberForMobRecharge()>quickReplies= ' + quickReplies, { logId: sessionId});  
                //desabling the context 'awaiting_mobile_recharge_type' and adding the context 'awaiting_prepaid_card_number_for_mobile_recharge'
                let awaiting_mobile_recharge_type = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_mobile_recharge_type';
                let awaiting_prepaid_card_number_for_mobile_recharge = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_prepaid_card_number_for_mobile_recharge';
                contextStr = '[{"name":"' + awaiting_mobile_recharge_type + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_prepaid_card_number_for_mobile_recharge + '", "lifespanCount":1, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','verifyPrepaidCardNumberForMobRecharge()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});   
                //fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                          
                title = "Sorry, prepaid card number is not matching. Please type serial number of card you wish to see information of. For example to see first card's information type 1 "+prepaidCardList;
                fulfillmentMessages = '[{"text": {"text": ["'+ title +'"]},"platform": "VIBER"},{"text": {"text": ["'+ title +'"]},"platform": "FACEBOOK"}] ';        
           }
            else 
            {   //no more tries left
                logger.log('warn','verifyPrepaidCardNumberForMobRecharge()>tries exceeded, calling No_MORE_TRIES event', { logId: sessionId}); 
                events.No_MORE_TRIES(responseToUser);
                return;   
            } 
        }       
        logger.log('info','verifyPrepaidCardNumberForMobRecharge()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,'');
    logger.log('info','verifyPrepaidCardNumberForMobRecharge()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}

exports.getCreditCardBal = async function(responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    let selectedCreditCardNumber=null;
    let cardhashed=null;
    try{
        

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','getCreditCardBal()>Existing noOfTries= '+ noOfTries, { logId: sessionId});  

        let clientIds = common.GetParameterValueFromSessionVars('clientIds', outputContexts, sessionId);
        logger.log('info','getCreditCardBal()>clientIds= '+ JSON.stringify(clientIds), { logId: sessionId});  

        let creditCardAssistanceType = common.GetParameterValueFromSessionVars('creditCardAssistanceType', outputContexts, sessionId);
        logger.log('info','getCreditCardBal()>creditCardAssistanceType= '+ creditCardAssistanceType, { logId: sessionId});  
        
        selectedCreditCardNumber = common.GetParameterValueFromSessionVars('selectedCreditCardNumber', outputContexts, sessionId);
        logger.log('info','getCreditCardBal()>selectedCreditCardNumber= '+ selectedCreditCardNumber, { logId: sessionId});  

        let creditCardCurrency = common.GetParameterValueFromSessionVars('creditCardCurrency', outputContexts, sessionId);
        logger.log('info','getCreditCardBal()>creditCardCurrency= '+ creditCardCurrency, { logId: sessionId});  

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        
        clientIds = clientIds + ''; //to avoid TypeError: clientIds.split is not a function
        let clientIdsArray = clientIds.split(',');
        let clientId = null;
        
        let i;
        for (i = 0; i < clientIdsArray.length; i++) {
            if(clientIds.split(',')[i].split(' ')[1] == selectedCreditCardNumber){
                clientId = clientIds.split(',')[i].split(' ')[2];
                break;
            }                        
        }
        logger.log('info','getCreditCardBal()>clientId= ' + clientId, { logId: sessionId});   
        cardhashed = selectedCreditCardNumber.substring(0, 4) + "****" +selectedCreditCardNumber.substring(selectedCreditCardNumber.length - 4, selectedCreditCardNumber.length)
      
        let result =await ebl.cardBal(selectedCreditCardNumber, clientId, creditCardCurrency, common.getSessionId(outputContexts));
        logger.log('info','getCreditCardBal()> cardBal result: '+ JSON.stringify(result), { logId: sessionId});  

        if(result == 'timeout'){
            //EBL webmethod timedout 
            actionStatus='timeout';
            eblActionStatus='timeout';  
            logger.log('info','getCreditCardBal()> EBL webmethod timedout, asking user to enter again', { logId: sessionId});          
            noOfTries = noOfTries + 1;
            logger.log('info','getCreditCardBal()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});  
            
            if(noOfTries < 3){
                logger.log('info','getCreditCardBal()>User still has tries left, asking user to try again.', { logId: sessionId});  
                let title = 'Sorry, it seems that there is an issue which is causing a delay. Please select currency one more time';
                let quickReplies = ['"USD"', '"BDT"'];
                fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                    
                //disabling the context 'awaiting_anything_else_choice' and adding the context 'awaiting_credit_card_currency'
                let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
                let awaiting_credit_card_currency = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_credit_card_currency';
                contextStr = '[{"name":"' + awaiting_anything_else_choice + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_credit_card_currency + '", "lifespanCount":1, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','getCreditCardBal()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});   
            }
            else 
            {   //no more tries left
                logger.log('warn','getCreditCardBal()>tries exceeded, calling No_MORE_TRIES event', { logId: sessionId});
                events.No_MORE_TRIES(responseToUser);
                return;   
            }
            
        }else{
            let errorCode = result.CardbalResult.ERROR_CODE;
            actionStatus='success';
            logger.log('info','getCreditCardBal ()>cardBal errorCode= ' + errorCode, { logId: sessionId});   
            if(errorCode == '0000' || errorCode == '000' ){
                eblActionStatus='success';
                noOfTries = 0;
                logger.log('info','getCreditCardBal()> noOfTries reset to 0', { logId: sessionId});  
                let limit= null;
                let outstandingBalance= null;
                let availableBalance= null;
                let resultSetUsd='';
                let resultSetBdt='';
                let resultSet = result.CardbalResult.RESULTSET;
                logger.log('info','getCreditCardBal()>cardBal resultSet= ' + resultSet, { logId: sessionId});   
                resultSet= resultSet + '';//to avoid TypeError: resultSet.split is not a function
                if(resultSet.split(',')[1]!=undefined){
                    if(resultSet.split(',')[1].split(' ')[3]=='USD') {
                        resultSetUsd=resultSet.split(',')[1];
                    }
                    else{
                        resultSetBdt=resultSet.split(',')[1];
                    }
                }
                if(resultSet.split(',')[0]!=undefined){
                    if(resultSet.split(',')[0].split(' ')[3]=='USD') {
                        resultSetUsd=resultSet.split(',')[0];
                    }
                    else{
                        resultSetBdt=resultSet.split(',')[0];
                    }
                }
                if(creditCardCurrency=='BDT'){
                    resultSet=resultSetBdt;
                }
                else{
                    resultSet=resultSetUsd;
                }
                logger.log('info','getCreditCardBal()>cardBal resultSet currency specific = ' + resultSet, { logId: sessionId}); 
                let cc_hashed = selectedCreditCardNumber.substring(0, 4) + "****" +selectedCreditCardNumber.substring(selectedCreditCardNumber.length - 4, selectedCreditCardNumber.length)
                let text = null;
                if(creditCardAssistanceType == 'limit'){
                    limit =  resultSet.split(' ')[4];
                    logger.log('info','getCreditCardBal()>limit= ' + limit, { logId: sessionId});   
                    text = "Your credit card " + cc_hashed + " limit is " + limit + " " + creditCardCurrency;  
                } else if(creditCardAssistanceType == 'outstandingbalance'){
                    outstandingBalance =  resultSet.split(' ')[8];
                    logger.log('info','getCreditCardBal()>outstandingBalance= ' + outstandingBalance, { logId: sessionId});                       
                    text = "Your credit card " + cc_hashed + " outstanding balance as of date " + common.getDateInDdMmYyFormat(sessionId) +" is " + outstandingBalance + " " + creditCardCurrency; 
                }else if(creditCardAssistanceType == 'availablebalance'){
                    availableBalance =  resultSet.split(' ')[6];
                    logger.log('info','getCreditCardBal()>availableBalance= ' + availableBalance, { logId: sessionId});  
                    text = "Your credit card " + cc_hashed + " balance as of date " + common.getDateInDdMmYyFormat(sessionId) +" is " + availableBalance + " " + creditCardCurrency;                 
                }  
                logger.log('info','getCreditCardBal()>text= ' + text, { logId: sessionId});   
                let title="May I help you with anything else?";
                let quickReplies = ['"Yes"','"No"'];
                fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]'; 
                contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','getCreditCardBal()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});   
            }else{
                ////get cardBal failed
                eblActionStatus='error';
                logger.log('warn','getCreditCardBal()>error code is invalid, calling error event', { logId: sessionId});                  
                events.ERROR(responseToUser,sessionId,queryResult,fulfillmentMessages,contextStr);
                return;
            }
        }
        logger.log('info','getCreditCardBal()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
              
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,cardhashed);
    
    logger.log('info','getCreditCardBal()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}

exports.getPrepaidCardBal =  async function(responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    let selectedPrepaidCardNumber=null;
    let cardhashed=null;
    try{
        

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','getPrepaidCardBal()>Existing noOfTries= '+ noOfTries, { logId: sessionId});  

        let clientIds = common.GetParameterValueFromSessionVars('clientIds', outputContexts, sessionId);
        logger.log('info','getPrepaidCardBal()>clientIds= '+ JSON.stringify(clientIds), { logId: sessionId});  

        let prepaidCardAssistanceType = common.GetParameterValueFromSessionVars('prepaidCardAssistanceType', outputContexts, sessionId);
        logger.log('info','getPrepaidCardBal()>prepaidCardAssistanceType= '+ prepaidCardAssistanceType, { logId: sessionId});  
        
        selectedPrepaidCardNumber = common.GetParameterValueFromSessionVars('selectedPrepaidCardNumber', outputContexts, sessionId);
        logger.log('info','getPrepaidCardBal()>selectedPrepaidCardNumber= '+ selectedPrepaidCardNumber, { logId: sessionId});  

        let prepaidCardCurrency = common.GetParameterValueFromSessionVars('prepaidCardCurrency', outputContexts, sessionId);
        logger.log('info','getPrepaidCardBal()>prepaidCardCurrency= '+ prepaidCardCurrency, { logId: sessionId});  

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        
        clientIds = clientIds + ''; //to avoid TypeError: clientIds.split is not a function
        let clientIdsArray = clientIds.split(',');
        let clientId = null;
        
        let i;
        for (i = 0; i < clientIdsArray.length; i++) {
            if(clientIds.split(',')[i].split(' ')[1] == selectedPrepaidCardNumber){
                clientId = clientIds.split(',')[i].split(' ')[2];
                break;
            }                        
        }
        logger.log('info','getPrepaidCardBal()>clientId= ' + clientId, { logId: sessionId});  
        cardhashed = selectedPrepaidCardNumber.substring(0, 4) + "****" +selectedPrepaidCardNumber.substring(selectedPrepaidCardNumber.length - 4, selectedPrepaidCardNumber.length)
      
        let result =await ebl.cardBal(selectedPrepaidCardNumber, clientId, prepaidCardCurrency, common.getSessionId(outputContexts));
        logger.log('info','getPrepaidCardBal()> cardBal result: '+ JSON.stringify(result), { logId: sessionId});  

        if(result == 'timeout'){
            //EBL webmethod timedout 
            actionStatus='timeout';
            eblActionStatus='timeout';    
            logger.log('info','getPrepaidCardBal()> EBL webmethod timedout, asking user to enter again', { logId: sessionId});         
            noOfTries = noOfTries + 1;
            logger.log('info','getPrepaidCardBal()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});  
            if(noOfTries < 3){
                logger.log('info','getPrepaidCardBal()>User still has tries left, asking user to try again.', { logId: sessionId});  
                let title = 'Sorry, it seems that there is an issue which is causing a delay. Please select currency one more time';
                let quickReplies = ['"USD"', '"BDT"'];
                fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                    
                //disabling the context 'awaiting_anything_else_choice' and adding the context 'awaiting_prepaid_card_currency'
                let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
                let awaiting_prepaid_card_currency = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_prepaid_card_currency';
                contextStr = '[{"name":"' + awaiting_anything_else_choice + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_prepaid_card_currency + '", "lifespanCount":1, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','getPrepaidCardBal()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});  
            }
            else 
            {   //no more tries left
                logger.log('warn','getPrepaidCardBal()>tries exceeded, calling No_MORE_TRIES event', { logId: sessionId});  
                events.No_MORE_TRIES(responseToUser);
                return;   
            } 
            
        }else{
            actionStatus='success';
            let errorCode = result.CardbalResult.ERROR_CODE;
            logger.log('info','getPrepaidCardBal ()>cardBal errorCode= ' + errorCode, { logId: sessionId});  
            if(errorCode == '0000' || errorCode == '000' ){
                eblActionStatus='success';
                noOfTries = 0;
                logger.log('info','getPrepaidCardBal()> noOfTries reset to 0', { logId: sessionId});  
                let availableBalance= null;

                let resultSet = result.CardbalResult.RESULTSET;
                logger.log('info','getPrepaidCardBal()>cardBal resultSet= ' + resultSet, { logId: sessionId});    
                resultSet= resultSet + '';//to avoid TypeError: resultSet.split is not a function

                let pp_hashed = selectedPrepaidCardNumber.substring(0, 4) + "****" +selectedPrepaidCardNumber.substring(selectedPrepaidCardNumber.length - 4, selectedPrepaidCardNumber.length)
                let text = null;
                let resultSetBdt='';
                let resultSetUsd='';
                if(resultSet.split(',')[1]!=undefined){
                    if(resultSet.split(',')[1].split(' ')[3]=='USD') {
                        resultSetUsd=resultSet.split(',')[1];
                    }
                    else{
                        resultSetBdt=resultSet.split(',')[1];
                    }
                }
                if(resultSet.split(',')[0]!=undefined){
                    if(resultSet.split(',')[0].split(' ')[3]=='USD') {
                        resultSetUsd=resultSet.split(',')[0];
                    }
                    else{
                        resultSetBdt=resultSet.split(',')[0];
                    }
                }
                if(prepaidCardCurrency=='USD'){
                    resultSet=resultSetUsd;
                }
                else{
                    resultSet=resultSetBdt;
                }
                if(prepaidCardAssistanceType == 'availablebalance'){
                    availableBalance =  resultSet.split(' ')[6];
                    logger.log('info','getPrepaidCardBal()>availableBalance= ' + availableBalance, { logId: sessionId});   
                    text = "Your prepaid card " + pp_hashed + " balance as of date " + common.getDateInDdMmYyFormat(sessionId) +" is " + availableBalance + " " + prepaidCardCurrency;                 
                }  
                logger.log('info','getPrepaidCardBal()>text= ' + text, { logId: sessionId});  
                let title="May I help you with anything else?";
                let quickReplies = ['"Yes"','"No"'];
                fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]'; 
                contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','getPrepaidCardBal()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});   
            }else{
                ////get cardBal failed   
                eblActionStatus='error'; 
                logger.log('warn','getPrepaidCardBal()> invalid error code, calling ERROR event', { logId: sessionId});                  
                            
                events.ERROR(responseToUser,sessionId,queryResult,fulfillmentMessages,contextStr);
                return;
            }
        }
        logger.log('info','getPrepaidCardBal()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,cardhashed);
    logger.log('info','getPrepaidCardBal()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}

exports.getCreditCardLast5Txn = async function(responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    let selectedCreditCardNumber=null;
    let cardhashed=null;
    try{
        

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','getCreditCardLast5Txn()>Existing noOfTries= '+ noOfTries, { logId: sessionId});  
        
        selectedCreditCardNumber = common.GetParameterValueFromSessionVars('selectedCreditCardNumber', outputContexts, sessionId);
        logger.log('info','getCreditCardLast5Txn()>selectedCreditCardNumber= '+ selectedCreditCardNumber, { logId: sessionId});  

        let creditCardCurrency = common.GetParameterValueFromSessionVars('creditCardCurrency', outputContexts, sessionId);
        logger.log('info','getCreditCardLast5Txn()>creditCardCurrency= '+ creditCardCurrency, { logId: sessionId});  

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        cardhashed = selectedCreditCardNumber.substring(0, 4) + "****" +selectedCreditCardNumber.substring(selectedCreditCardNumber.length - 4, selectedCreditCardNumber.length)
      
        let result =await ebl.cardTransactions(selectedCreditCardNumber, creditCardCurrency, common.getSessionId(outputContexts));
        logger.log('info','getCreditCardLast5Txn()> cardTransactions result: '+ JSON.stringify(result), { logId: sessionId});  

        if(result == 'timeout'){
            //EBL webmethod timedout  
            actionStatus='timeout';
            eblActionStatus='timeout';   
            logger.log('info','getCreditCardLast5Txn()> EBL webmethod timedout, asking user to enter again', { logId: sessionId});         
            noOfTries = noOfTries + 1;
            logger.log('info','getCreditCardLast5Txn()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});  
            if(noOfTries < 3){
                logger.log('info','getCreditCardLast5Txn()>User still has tries left, asking user to try again.', { logId: sessionId});  
                let title = 'Sorry, it seems that there is an issue which is causing a delay. Could you select the currency again?';
                let quickReplies = ['"USD"', '"BDT"'];
                fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                    
                //disabling the context 'awaiting_anything_else_choice' and adding the context 'awaiting_credit_card_currency'
                let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
                let awaiting_credit_card_currency = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_credit_card_currency';
                contextStr = '[{"name":"' + awaiting_anything_else_choice + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_credit_card_currency + '", "lifespanCount":1, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','getCreditCardLast5Txn()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});    
            }
            else 
            {   //no more tries left
                logger.log('warn','getCreditCardLast5Txn()>tries exceeded, calling No_MORE_TRIES event', { logId: sessionId}); 
                events.No_MORE_TRIES(responseToUser);
                return;   
            }
            
        }else{
            actionStatus='success';
            let errorCode = result.QRYRESULT.ISSUCCESS;
            logger.log('info','getCreditCardLast5Txn ()>cardBal errorCode= ' + errorCode, { logId: sessionId});  
            if(errorCode == 'Y'){
                eblActionStatus='success';
                noOfTries = 0;
                logger.log('info','getCreditCardLast5Txn()> noOfTries reset to 0', { logId: sessionId});  
                
                let transactionHistory = result.QRYRESULT.EBLCRD_OUTPUT.P_RESULT_SET;
                logger.log('info','getCreditCardLast5Txn ()>transactionHistory= ' + JSON.stringify(transactionHistory), { logId: sessionId});   
                let text = 'Your last 5 transaction details are: ';
                let item = null;
                let i = 0;
                for(i=0; i< transactionHistory.ITEM.length; i++){
                    item =transactionHistory.ITEM[i];
                    if(item.TRANSACTION_SIGN == 'C'){
                        text = text +   "\\n"+(i+1)+". "+creditCardCurrency+" "+  item.BILLING_AMOUNT + " credit on "+  item.POSTING_DATE+", "+item.TRANSACTION_DESCRIPTION;
                    }else{
                        text = text +   "\\n"+(i+1)+". "+creditCardCurrency+" "+ item.BILLING_AMOUNT + " debit on "+  item.POSTING_DATE+", "+item.TRANSACTION_DESCRIPTION;
                    }  
                    //text = text +  " , \\n";              
                }  
                text = text.slice(0,-3); 
                logger.log('info','getCreditCardLast5Txn()>text= ' + text, { logId: sessionId});   
                let title="May I help you with anything else?";
                let quickReplies = ['"Yes"','"No"'];
                fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]'; 
                contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','getCreditCardLast5Txn()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});                 
            }else{
                ////get cardBal failed  
                eblActionStatus='error';
                logger.log('warn','getCreditCardLast5Txn()> invalid error code, calling ERROR event', { logId: sessionId});     
                events.ERROR(responseToUser,sessionId,queryResult,fulfillmentMessages,contextStr);
                return;
            }
        }
        logger.log('info','getCreditCardLast5Txn()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,cardhashed);
    logger.log('info','getCreditCardLast5Txn()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}

exports.getPrepaidCardLast5Txn = async function(responseToUser, outputContexts, sessionId,queryResult ) {
    let responseJson = {};
    let contextStr = null;
    let fulfillmentMessages = null;
    let actionStatus='success';
    let eblActionStatus='na';
    let selectedPrepaidCardNumber=null;
    let cardhashed=null;
    try{
        

        let noOfTries = common.GetParameterValueFromSessionVars('noOfTries', outputContexts, sessionId)
        if(noOfTries == 'undefined' || noOfTries == '' || noOfTries == null || noOfTries == '0'){
            noOfTries = 0;
        }
        logger.log('info','getPrepaidCardLast5Txn()>Existing noOfTries= '+ noOfTries, { logId: sessionId});  
        
        selectedPrepaidCardNumber = common.GetParameterValueFromSessionVars('selectedPrepaidCardNumber', outputContexts, sessionId);
        logger.log('info','getPrepaidCardLast5Txn()>selectedPrepaidCardNumber= '+ selectedPrepaidCardNumber, { logId: sessionId});  

        let prepaidCardCurrency = common.GetParameterValueFromSessionVars('prepaidCardCurrency', outputContexts, sessionId);
        logger.log('info','getPrepaidCardLast5Txn()>prepaidCardCurrency= '+ prepaidCardCurrency, { logId: sessionId});  

        let session_vars = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/session_vars';
        cardhashed = selectedPrepaidCardNumber.substring(0, 4) + "****" +selectedPrepaidCardNumber.substring(selectedPrepaidCardNumber.length - 4, selectedPrepaidCardNumber.length)
      
        let result =await ebl.cardTransactions(selectedPrepaidCardNumber, prepaidCardCurrency, common.getSessionId(outputContexts));
        logger.log('info','getPrepaidCardLast5Txn()> cardTransactions result: '+ JSON.stringify(result), { logId: sessionId});  

        if(result == 'timeout'){
            //EBL webmethod timedout 
            actionStatus='timeout';
            eblActionStatus='timeout';    
            logger.log('info','getPrepaidCardLast5Txn()> EBL webmethod timedout, asking user to enter again', { logId: sessionId});          
            noOfTries = noOfTries + 1;
            logger.log('info','getPrepaidCardLast5Txn()> incremented noOfTries to = '+ noOfTries, { logId: sessionId});             

            if(noOfTries < 3){
                logger.log('info','getPrepaidCardLast5Txn()>User still has tries left, asking user to try again.', { logId: sessionId});  
                let title = 'Sorry, it seems that there is an issue which is causing a delay. Could you select the currency again?';
                let quickReplies = ['"USD"', '"BDT"'];
                fulfillmentMessages = '[{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text":{"text":[""]}}]';                    
                //disabling the context 'awaiting_anything_else_choice' and adding the context 'awaiting_prepaid_card_currency'
                let awaiting_anything_else_choice = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_anything_else_choice';
                let awaiting_prepaid_card_currency = 'projects/'+common.getProjectId(outputContexts, sessionId)+'/agent/sessions/'+common.getSessionId(outputContexts)+'/contexts/awaiting_prepaid_card_currency';
                contextStr = '[{"name":"' + awaiting_anything_else_choice + '", "lifespanCount":0, "parameters":{}},{"name":"' + awaiting_prepaid_card_currency + '", "lifespanCount":1, "parameters":{}},{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','getPrepaidCardLast5Txn()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});  
            }
            else 
            {   //no more tries left
                logger.log('warn','getPrepaidCardLast5Txn()>tries exceeded, calling No_MORE_TRIES event', { logId: sessionId}); 
                events.No_MORE_TRIES(responseToUser);
                return;   
            }             
        }else{
            let errorCode = result.QRYRESULT.ISSUCCESS;
            actionStatus='success';
            logger.log('info','getPrepaidCardLast5Txn ()>cardBal errorCode= ' + errorCode, { logId: sessionId});  
            if(errorCode == 'Y'){
                eblActionStatus='success';
                noOfTries = 0;
                logger.log('info','getPrepaidCardLast5Txn()> noOfTries reset to 0', { logId: sessionId});  
                
                let transactionHistory = result.QRYRESULT.EBLCRD_OUTPUT.P_RESULT_SET;
                logger.log('info','getPrepaidCardLast5Txn ()>transactionHistory= ' + JSON.stringify(transactionHistory), { logId: sessionId});   
                let text = 'Your last 5 transaction details are: ';
                let item = null;
                let i = 0;
                for(i=0; i< transactionHistory.ITEM.length; i++){
                    item =transactionHistory.ITEM[i];
                    if(item.TRANSACTION_SIGN == 'C'){
                        text = text +   "\\n"+(i+1)+". "+prepaidCardCurrency+" "+  item.BILLING_AMOUNT + " credit on "+  item.POSTING_DATE+", "+item.TRANSACTION_DESCRIPTION;
                    }else{
                        text = text +   "\\n"+(i+1)+". "+prepaidCardCurrency+" "+  item.BILLING_AMOUNT + " debit on "+  item.POSTING_DATE+", "+item.TRANSACTION_DESCRIPTION;
                    }  
                    //text = text +  " , \\n";              
                }  
                text = text.slice(0,-3); 
                logger.log('info','getPrepaidCardLast5Txn()>text= ' + text, { logId: sessionId});  
                let title="May I help you with anything else?";
                let quickReplies = ['"Yes"','"No"'];
                fulfillmentMessages = '[{"text": {"text":["'+ text +'"]},"platform": "FACEBOOK"},{"quickReplies":{ "title":"'+ title +'", "quickReplies":['+ quickReplies +']},"platform":"FACEBOOK"},{"text": {"text":["'+text+'"]},"platform": "VIBER"},{"quickReplies":{"title":"'+ title +'","quickReplies":['+ quickReplies +']},"platform":"VIBER"}]'; 
                contextStr = '[{"name":"' + session_vars + '", "lifespanCount":100, "parameters":{"noOfTries":'+ noOfTries +'}}]';
                logger.log('info','getPrepaidCardLast5Txn()> contextStr= '+ JSON.stringify(contextStr), { logId: sessionId});                 
            }else{
                ////get cardBal failed  
                eblActionStatus='error';
                logger.log('warn','getPrepaidCardLast5Txn()> invalid error code, calling ERROR event', { logId: sessionId});                  
                events.ERROR(responseToUser,sessionId,queryResult,fulfillmentMessages,contextStr);
                return;
            }
        }
        logger.log('info','getPrepaidCardLast5Txn()> fulfillmentMessages: '+JSON.stringify(fulfillmentMessages), { logId: sessionId});  
        responseJson.fulfillmentMessages= JSON.parse(fulfillmentMessages);            
        responseJson.outputContexts = JSON.parse(contextStr);
    }catch(e){
        logger.log('error', e.stack, { logId: sessionId});
        actionStatus='error';
    }  
    traversal.nodeTraversal(sessionId,queryResult,actionStatus,eblActionStatus,fulfillmentMessages,contextStr,cardhashed);
    logger.log('info','getPrepaidCardLast5Txn()> Response:'+JSON.stringify(responseJson), { logId: sessionId});  
    responseToUser.json(responseJson);
}
