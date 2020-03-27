"use strict";

const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const fs = require('fs');
let path = require('path')
const logger = require("./../logger");
const config = require("./../config");
const request = require("request");
const common = require("../controllers/common");

const SIMULATION_MODE = config.simulationMode;
let URI = config.ebl.uri;
let TIMEOUT_MS = config.ebl.timeoutMs;
const CONTENT_TYPE = 'application/json';

const USERID = config.mobileRecharge.userId;
const PASSWORD = config.mobileRecharge.password;
const HANDSHAKE_KEY = config.mobileRecharge.handshakekey;

/**
 * This web method will be used to check the valid phone number and balance information.
 */
exports.getBankAccountDetails = function(mobileNumber, sessionId){         
    return new Promise (function (resolve, reject){
        try{
            logger.log('debug', "exports.getBankAccountDetails()> ####### START ####### ", {logId: sessionId});
            logger.log('info', 'exports.getBankAccountDetails()> (I/P) mobileNumber= ' + mobileNumber, {logId: sessionId}); 
            if(SIMULATION_MODE == 'on'){
                logger.log('warn', 'exports.getBankAccountDetails()> SIMULATION_MODE= ' + SIMULATION_MODE, {logId: sessionId});
                let jsonfile = path.join(__dirname, '"/../sampleJsonData/getBankAccountDetails.json');
                logger.log('info','exports.getBankAccountDetails()>JSON file path= ' + jsonfile); 
                fs.readFile(jsonfile, function (err, data) {
                    resolve(JSON.parse(data));
                });
            }else{            
                let options = {
                    method: 'POST',
                    url: URI + 'accountdetails',
                    headers: {
                        'Content-type': CONTENT_TYPE
                    },
                    body: {"MOBILENO": mobileNumber},
                    json: true,
                    timeout: TIMEOUT_MS
                    };
                logger.log('debug',  "exports.getBankAccountDetails()> options = " + JSON.stringify(options), {logId: sessionId});
                request(options, function (error, response, body) {
                    try {        
                        logger.log('info', "exports.getBankAccountDetails()> Response received", { logId: sessionId});
                        if (error) {
                            logger.log('error', JSON.stringify(error), { logId: sessionId});
                            logger.log('error', "exports.getBankAccountDetails()> ####### ERROR ####### ", { logId: sessionId});
                            //Sample error object in case timeout= {"code":"ETIMEDOUT","connect":true}                            
                            if(error.code == 'ETIMEDOUT' ||error.code=='ESOCKETTIMEDOUT'){
                                resolve('timeout');
                            }else
                            {
                                reject(error);
                            }                            
                        } else {
                            logger.log('info', "exports.getBankAccountDetails()> body= " + JSON.stringify(body), { logId: sessionId});                               
                            resolve(body);                                           
                        }
                    } catch (e) {
                        logger.log('error', e.stack, { logId: sessionId});
                        reject(e);
                    } 
                });
            }
        }catch(e){
            logger.log('error', e.stack, { logId: sessionId});
            reject(e);
        } 
    });                
}  

/**
 * Bank Account Service
   This web method will be used to get last 5 transactions details.
 */
exports.getBankAccountLast5Txn = function(accountNumber, sessionId){
    return new Promise (function (resolve, reject){
        try{
            logger.log('debug', "exports.getBankAccountLast5Txn()> ####### START ####### ", {logId: sessionId});
            logger.log('info', 'exports.getBankAccountLast5Txn()> (I/P) accountNumber = ' + accountNumber, {logId: sessionId}); 
            if(SIMULATION_MODE == 'on'){
                logger.log('warn', 'exports.getBankAccountLast5Txn()> SIMULATION_MODE= ' + SIMULATION_MODE, {logId: sessionId});
                let jsonfile = path.join(__dirname, '"/../sampleJsonData/getBankAccountLast5Txn.json');
                logger.log('info','exports.getBankAccountLast5Txn()>JSON file path= ' + jsonfile); 
                fs.readFile(jsonfile, function (err, data) {
                    resolve(JSON.parse(data));
                });
            }else{            
                let options = {
                    method: 'POST',
                    url: URI + 'accounttxnhist',
                    headers: {
                        'Content-type': CONTENT_TYPE
                    },
                    body: {"CUSTOMERACCNO": accountNumber},
                    json: true,
                    timeout: TIMEOUT_MS
                    };
                logger.log('debug',  "exports.getBankAccountLast5Txn()> options = " + JSON.stringify(options), {logId: sessionId});
                request(options, function (error, response, body) {
                    try {        
                        logger.log('info', "exports.getBankAccountLast5Txn()> Response received", { logId: sessionId});
                        if (error) {
                            logger.log('error', JSON.stringify(error), { logId: sessionId});
                            logger.log('error', "exports.getBankAccountLast5Txn()> ####### ERROR ####### ", { logId: sessionId});
                            //Sample error object in case timeout= {"code":"ETIMEDOUT","connect":true}                            
                            if(error.code == 'ETIMEDOUT' || error.code=='ESOCKETTIMEDOUT'){
                                resolve('timeout');
                            }else{
                                reject(error);
                            }                            
                        } else {
                            logger.log('info', "exports.getBankAccountLast5Txn()> body= " + JSON.stringify(body), { logId: sessionId});                               
                            resolve(body);                                           
                        }
                    } catch (e) {
                        logger.log('error', e.stack, { logId: sessionId});
                        reject(e);
                    } 
                });
            }
        }catch(e){
            logger.log('error', e.stack, { logId: sessionId});
            reject(e);
        } 
    }); 
}

exports.mobileRechargeDia = function(accountNumber, paymentType,mobileNumber, amount, phoneNumber, sessionId){
    return new Promise (function (resolve, reject){
        try{
            logger.log('debug', "exports.mobileRechargeDia()> ####### START ####### ", {logId: sessionId});
            logger.log('info', 'exports.mobileRechargeDia()> (I/P) accountNumber= = ' + accountNumber, {logId: sessionId}); 
            logger.log('info', 'exports.mobileRechargeDia()> (I/P) paymentType= ' + paymentType, {logId: sessionId});  
            logger.log('info', 'exports.mobileRechargeDia()> (I/P) mobileNumber= ' + mobileNumber, {logId: sessionId});  
            paymentType=paymentType+','+mobileNumber;
            logger.log('info', 'exports.mobileRechargeDia()> (I/P) updated paymentType= ' + paymentType, {logId: sessionId});  
            logger.log('info', 'exports.mobileRechargeDia()> (I/P) amount= ' + amount, {logId: sessionId}); 
            logger.log('info', 'exports.mobileRechargeDia()> (I/P) phoneNumber= ' + phoneNumber, {logId: sessionId}); 
            if(SIMULATION_MODE == 'on'){
                logger.log('warn', 'exports.mobileRechargeDia()> SIMULATION_MODE= ' + SIMULATION_MODE, {logId: sessionId});
                let jsonfile = path.join(__dirname, '"/../sampleJsonData/mobileRechargeDia.json');
                logger.log('info','exports.mobileRechargeDia()>JSON file path= ' + jsonfile); 
                fs.readFile(jsonfile, function (err, data) {
                    resolve(JSON.parse(data));
                });
            }else{            
                let options = {
                    method: 'POST',
                    url: URI + 'mobilerechargedia',
                    headers: {
                        'Content-type': CONTENT_TYPE
                    },
                    body: {
                        "user_id" : USERID,
                        "password" : PASSWORD,
                        "handshakekey" : HANDSHAKE_KEY,
                        "ref_no" : common.getDateInYYMMDDHHmmssSSSS(sessionId),
                        "payment_type" : paymentType,
                        "account_number" : accountNumber,
                        "amount" : amount+'',
                        "number" : phoneNumber+''},
                    json: true,
                    timeout: TIMEOUT_MS
                    };
                logger.log('debug',  "exports.mobileRechargeDia()> options = " + JSON.stringify(options), {logId: sessionId});
                request(options, function (error, response, body) {
                    try {        
                        logger.log('info', "exports.mobileRechargeDia()> Response received", { logId: sessionId});
                        if (error) {
                            logger.log('error', JSON.stringify(error), { logId: sessionId});
                            logger.log('error', "exports.mobileRechargeDia()> ####### ERROR ####### ", { logId: sessionId});
                            //Sample error object in case timeout= {"code":"ETIMEDOUT","connect":true}                            
                            if(error.code == 'ETIMEDOUT' || error.code=='ESOCKETTIMEDOUT'){
                                resolve('timeout');
                            }else{
                                reject(error);
                            }                            
                        } else {
                            logger.log('info', "exports.mobileRechargeDia()> body= " + JSON.stringify(body), { logId: sessionId});                               
                            resolve(body);                                           
                        }
                    } catch (e) {
                        logger.log('error', e.stack, { logId: sessionId});
                        reject(e);
                    } 
                });
            }
        }catch(e){
            logger.log('error', e.stack, { logId: sessionId});
            reject(e);
        } 
    }); 
}

exports.cardTransactions = function(cardNumber, currency, sessionId){
    return new Promise (function (resolve, reject){
        try{
            
            logger.log('debug', "exports.cardTransactions()> ####### START ####### ", {logId: sessionId});
            logger.log('info', 'exports.cardTransactions()> (I/P) cardNumber= = ' + cardNumber, {logId: sessionId}); 
            logger.log('info', 'exports.cardTransactions()> (I/P) currency= ' + currency, {logId: sessionId}); 
            logger.log('warn', 'exports.cardTransactions()> SIMULATION_MODE= ' + SIMULATION_MODE, {logId: sessionId});
        
            if(SIMULATION_MODE == 'on'){
                logger.log('warn', 'exports.cardTransactions()> SIMULATION_MODE= ' + SIMULATION_MODE, {logId: sessionId});
            
                let jsonfile = path.join(__dirname, '"/../sampleJsonData/cardTransactions.json');
                logger.log('info','exports.cardTransactions()>JSON file path= ' + jsonfile); 
                fs.readFile(jsonfile, function (err, data) {
                    resolve(JSON.parse(data));
                });
            }else{            
                let options = {
                    method: 'POST',
                    url: 'http://192.168.3.159/apicbot/' + 'cardstxnhist',
                    headers: {
                        'Content-type': CONTENT_TYPE},
                    body: {
                        "CARD_NO" : cardNumber,
	                    "CURRENCY" : currency},
                    json: true,
                    timeout: TIMEOUT_MS
                    };
                logger.log('debug',  "exports.cardTransactions()> options = " + JSON.stringify(options), {logId: sessionId});
                request(options, function (error, response, body) {
                    try {        
                        logger.log('info', "exports.cardTransactions()> Response received", { logId: sessionId});
                        if (error) {
                            logger.log('error', JSON.stringify(error), { logId: sessionId});
                            logger.log('error', "exports.cardTransactions()> ####### ERROR ####### ", { logId: sessionId});
                            //Sample error object in case timeout= {"code":"ETIMEDOUT","connect":true}                            
                            if(error.code == 'ETIMEDOUT' || error.code=='ESOCKETTIMEDOUT'){
                                resolve('timeout');
                            }else{
                                reject(error);
                            }                            
                        } else {
                            logger.log('info', "exports.cardTransactions()> body= " + JSON.stringify(body), { logId: sessionId});                               
                            resolve(body);                                           
                        }
                    } catch (e) {
                        logger.log('error', e.stack, { logId: sessionId});
                        reject(e);
                    } 
                });
            }
        }catch(e){
            logger.log('error', e.stack, { logId: sessionId});
            reject(e);
        } 
    }); 
}

// START ---- EBL CMS Service ---- START
/**
 * CMS Web service
 * Returns ClientId's if successful else blank
 * This web method is used to verify the phone number. It will return card type, card number and client id.
 * CR= Credit Card, PP= Pre-Paid Card, DC= Debit Card
 * Visa= Will always start with digit 4.	Visa cards will be always 16 digits.
 * Master Card	= Will always start with digit 5.	MasterCard cards will be always 16 digits.
 * Diners Club= Will starts with digit 3 and 6	If the Diners Club card number starts with 3 then card number will be 14 digits. If Diners club card starts with 6 then card number will be 16 digits.
 * Result code:
 * 0000	Phone Number is Registered.
 * 0001	Phone Number is not 11 digit
 * 0002	Phone Number should be number only
 * 0003	Reference Number should be number only 12 digit
 * 0004	Service Type Not Matched
 * 0005	Phone Number is Not Registerd.
 * Sample O/P:
 * CR 36090127167418 CC00071524,CR 4368770392365454 CC00071524,CR 4368777202582491 CC00071524,CR 4368779053461767 CC00071524,CR 5595810301222446 CC00071524,PP 4893401098420450 PP10007187,PP 4893409047280297 PP10007187
 */
exports.phoneCheck = function(phoneNumber, serviceType, sessionId){
    return new Promise (function (resolve, reject){
        try{
            logger.log('debug', "exports.phoneCheck()> ####### START ####### ", {logId: sessionId});
            logger.log('info', 'exports.phoneCheck()> (I/P) phoneNumber= ' + phoneNumber, {logId: sessionId}); 
            logger.log('info', 'exports.phoneCheck()> (I/P) serviceType= ' + serviceType, {logId: sessionId}); 
            if(SIMULATION_MODE == 'on'){
                logger.log('warn', 'exports.phoneCheck()> SIMULATION_MODE= ' + SIMULATION_MODE, {logId: sessionId});
                
                let jsonfile = path.join(__dirname, '"/../sampleJsonData/phoneCheck.json');
                logger.log('info','exports.phoneCheck()>JSON file path= ' + jsonfile); 
                fs.readFile(jsonfile, function (err, data) {
                    resolve(JSON.parse(data));
                });
            }else{            
                let options = {
                    method: 'POST',
                    url: URI + 'phonecheck',
                    headers: {
                        'Content-type': CONTENT_TYPE},
                    body: {
                        "REFERENCE_NUMBER" :phoneNumber+'0',
                        "PHONE_NUMBER" : phoneNumber,
                        "SERVICE_TYPE" : serviceType},
                    json: true,
                    timeout: TIMEOUT_MS
                    };
                logger.log('debug',  "exports.phoneCheck()> options = " + JSON.stringify(options), {logId: sessionId});
                request(options, function (error, response, body) {
                    try {        
                        logger.log('info', "exports.phoneCheck()> Response received", { logId: sessionId});
                        if (error) {
                            logger.log('error', JSON.stringify(error), { logId: sessionId});
                            logger.log('error', "exports.phoneCheck()> ####### ERROR ####### ", { logId: sessionId});
                            //Sample error object in case timeout= {"code":"ETIMEDOUT","connect":true}                            
                            if(error.code == 'ETIMEDOUT' || error.code=='ESOCKETTIMEDOUT'){
                                resolve('timeout');
                            }else{
                                reject(error);
                            }                            
                        } else {
                            logger.log('info', "exports.phoneCheck()> body= " + JSON.stringify(body), { logId: sessionId});                               
                            resolve(body);                                           
                        }
                    } catch (e) {
                        logger.log('error', e.stack, { logId: sessionId});
                        reject(e);
                    } 
                });
            }
        }catch(e){
            logger.log('error', e.stack, { logId: sessionId});
            reject(e);
        } 
    }); 
}

/**
 * Returns OTP if successful or else blank value
 */
exports.botOtp = function(phoneNumber, serviceType, sessionId){
    return new Promise (function (resolve, reject){
        try{
            logger.log('debug', "exports.botOtp()> ####### START ####### ", {logId: sessionId});
            logger.log('info', 'exports.botOtp()> (I/P) phoneNumber= = ' + phoneNumber, {logId: sessionId}); 
            logger.log('info', 'exports.botOtp()> (I/P) serviceType= ' + serviceType, {logId: sessionId}); 
            if(SIMULATION_MODE == 'on'){
                logger.log('warn', 'exports.botOtp()> SIMULATION_MODE= ' + SIMULATION_MODE, {logId: sessionId});
                
                let jsonfile = path.join(__dirname, '"/../sampleJsonData/botOtp.json');
                logger.log('info','exports.botOtp()>JSON file path= ' + jsonfile); 
                fs.readFile(jsonfile, function (err, data) {
                    resolve(JSON.parse(data));
                });
            }else{            
                let options = {
                    method: 'POST',
                    url: URI + 'cbototp',
                    headers: {
                        'Content-type': CONTENT_TYPE},
                    body: {
                        "mobileNumber" : phoneNumber,
                        "serviceType" : serviceType},
                    json: true,
                    timeout: TIMEOUT_MS
                    };
                logger.log('debug',  "exports.botOtp()> options = " + JSON.stringify(options), {logId: sessionId});
                request(options, function (error, response, body) {
                    try {        
                        logger.log('info', "exports.botOtp()> Response received", { logId: sessionId});
                        if (error) {
                            logger.log('error', JSON.stringify(error), { logId: sessionId});
                            logger.log('error', "exports.botOtp()> ####### ERROR ####### ", { logId: sessionId});
                            //Sample error object in case timeout= {"code":"ETIMEDOUT","connect":true}                            
                            if(error.code == 'ETIMEDOUT' || error.code=='ESOCKETTIMEDOUT'){
                                resolve('timeout');
                            }else{
                                reject(error);
                            }                            
                        } else {
                            logger.log('info', "exports.botOtp()> body= " + JSON.stringify(body), { logId: sessionId});                               
                            resolve(body);                                           
                        }
                    } catch (e) {
                        logger.log('error', e.stack, { logId: sessionId});
                        reject(e);
                    } 
                });
            }
        }catch(e){
            logger.log('error', e.stack, { logId: sessionId});
            reject(e);
        } 
    }); 
}

/**
 * CMS Web Service
 * Returns Balance details if successful or else ERROR_CODE
 * ERROR_CODE	Definition
 * 0000	    OPERATION ENDED SUCCESSFULLY.
 * 0002	    Data error.
 * 0003	    Reference number is not 12 digits.
 * cardNumber> Card number should be valid and linked to a client code
 * clientCode> Client code should be valid and linked to a card number
 * currency> BDT/USD
 */
exports.cardBal = function(cardNumber, clientCode, currency, sessionId){
    return new Promise (function (resolve, reject){
        try{
            logger.log('debug', "exports.cardBal()> ####### START ####### ", {logId: sessionId});
            logger.log('info', 'exports.cardBal()> (I/P) cardNumber= = ' + cardNumber, {logId: sessionId}); 
            logger.log('info', 'exports.cardBal()> (I/P) clientCode= ' + clientCode, {logId: sessionId}); 
            logger.log('info', 'exports.cardBal()> (I/P) currency= ' + currency, {logId: sessionId});
            logger.log('warn', 'exports.cardBal()> SIMULATION_MODE= ' + SIMULATION_MODE, {logId: sessionId});
            
            if(SIMULATION_MODE == 'on'){
                logger.log('warn', 'exports.cardBal()> SIMULATION_MODE= ' + SIMULATION_MODE, {logId: sessionId});
                let jsonfile = path.join(__dirname, '"/../sampleJsonData/cardBal.json');
                logger.log('info','exports.cardBal()>JSON file path= ' + jsonfile); 
                fs.readFile(jsonfile, function (err, data) {
                    resolve(JSON.parse(data));
                });
            }else{            
                let options = {
                    method: 'POST',
                    url: URI + 'cardbalancelatest',
                    headers: {
                        'Content-type': CONTENT_TYPE},
                    body: {
                        "REFERENCE_NUMBER" : common.getDateInYYYYMMDDHHmmssSSS(sessionId),
                       // "CLIENT_CODE" : clientCode,
                        "CARD_NUMBER" : ""+cardNumber//,
                       // "CURRENCY" : currency
                    },
                    json: true,
                    timeout: TIMEOUT_MS
                    };
                logger.log('debug',  "exports.cardBal()> options = " + JSON.stringify(options), {logId: sessionId});
                request(options, function (error, response, body) {
                    try {        
                        logger.log('info', "exports.cardBal()> Response received", { logId: sessionId});
                        if (error) {
                            logger.log('error', JSON.stringify(error), { logId: sessionId});
                            logger.log('error', "exports.cardBal()> ####### ERROR ####### ", { logId: sessionId});
                            //Sample error object in case timeout= {"code":"ETIMEDOUT","connect":true}                            
                            if(error.code == 'ETIMEDOUT' || error.code=='ESOCKETTIMEDOUT'){
                                resolve('timeout');
                            }else{
                                reject(error);
                            }                            
                        } else {
                            logger.log('info', "exports.cardBal()> body= " + JSON.stringify(body), { logId: sessionId});                               
                            resolve(body);                                           
                        }
                    } catch (e) {
                        logger.log('error', e.stack, { logId: sessionId});
                        reject(e);
                    } 
                });
            }
        }catch(e){
            logger.log('error', e.stack, { logId: sessionId});
            reject(e);
        } 
    }); 
}


/**
 * Returns greetingMessage if successful or else blank value
 */
exports.checkGreetingMessage = function(sessionId){
    return new Promise (function (resolve, reject){
        try{
            logger.log('debug', "exports.checkGreetingMessage()> ####### START ####### ", {logId: sessionId});
            if(SIMULATION_MODE == 'on'){
                logger.log('warn', 'exports.checkGreetingMessage()> SIMULATION_MODE= ' + SIMULATION_MODE, {logId: sessionId});
                
                let jsonfile = path.join(__dirname, '"/../sampleJsonData/checkGreetingMessage.json');
                logger.log('info','exports.checkGreetingMessage()>JSON file path= ' + jsonfile); 
                fs.readFile(jsonfile, function (err, data) {
                    if(err){
                        logger.log('error', err, { logId: sessionId});
                    }else{
                        resolve(JSON.parse(data));
                    }                    
                });
            }else{            
                let options = {
                    method: 'POST',
                    url: URI + 'messageshow',
                    headers: {
                        'Content-type': CONTENT_TYPE},
                   /* body: {
                        "mobileNumber" : phoneNumber,
                        "serviceType" : serviceType},*/
                    json: true,
                    timeout: TIMEOUT_MS
                    };
                logger.log('debug',  "exports.checkGreetingMessage()> options = " + JSON.stringify(options), {logId: sessionId});
                request(options, function (error, response, body) {
                    try {        
                        logger.log('info', "exports.checkGreetingMessage()> Response received", { logId: sessionId});
                        if (error) {
                            logger.log('error', JSON.stringify(error), { logId: sessionId});
                            logger.log('error', "exports.checkGreetingMessage()> ####### ERROR ####### ", { logId: sessionId});
                            //Sample error object in case timeout= {"code":"ETIMEDOUT","connect":true}                            
                            if(error.code == 'ETIMEDOUT' || error.code=='ESOCKETTIMEDOUT'){
                                resolve('timeout');
                            }else{
                                reject(error);
                            }                            
                        } else {
                            logger.log('info', "exports.checkGreetingMessage()> body= " + JSON.stringify(body), { logId: sessionId});                               
                            resolve(body);                                           
                        }
                    } catch (e) {
                        logger.log('error', e.stack, { logId: sessionId});
                        reject(e);
                    } 
                });
            }
        }catch(e){
            logger.log('error', e.stack, { logId: sessionId});
            reject(e);
        } 
    }); 
}
// END ---- EBL CMS Service ---- END