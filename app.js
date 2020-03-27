const express = require('express');
const bodyParser = require('body-parser');
const logger = require("./logger");

const config = require('./config');
const route = require('./routes/route'); // Imports routes for the users

const PORT = config.server.port;
const SERVER_TIMEOUT_MS = config.server.timeoutMs;
const USE_SSL = config.server.usessl;
const SMULATION_MODE = config.simulationMode;
const TRAVERSAL = config.traversal;

logger.log('info', 'app.js()> USE_SSL= ' + USE_SSL);
logger.log('info', 'app.js()> SMULATION_MODE= ' + SMULATION_MODE);
logger.log('info', 'app.js()> TRAVERSAL= ' + TRAVERSAL);

if(USE_SSL == 'off'){
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use('/EblDiaWebhook', route);
    app.get('/', (req, res) => res.send('This is NodeJs app, which contains the webhook code for EblDIA Google Dialogflow bot'))
    app.listen(PORT, () => {
        logger.log('info', "################## listening on port " + PORT + ". SERVER_TIMEOUT_MS= " + SERVER_TIMEOUT_MS + " ##################", { logId: "NULL" });
        logger.log('info', "################## Local access url = http://localhost:9000/ , With public ip= http://103.79.225.84:9000/ ##################", { logId: "NULL" });
        logger.log('info', "################## Remote access url for Dialogflow fullfilment With public ip= http://103.79.225.84:9000/EblDiaWebhook/ ################## \n", { logId: "NULL" });
    });
}else{
    let fs = require('fs');
    let path = require('path')
    var https_options = {   
        key: fs.readFileSync(path.join(__dirname, 'ssl_cert/ebldia_ebl_bd_pvt.key')),
        cert: fs.readFileSync(path.join(__dirname, 'ssl_cert/ebldia_ebl-bd_com.crt')),
        ca: [
          fs.readFileSync(path.join(__dirname, 'ssl_cert/AddTrustExternalCARoot.crt')),
          fs.readFileSync(path.join(__dirname, 'ssl_cert/USERTrustRSAAddTrustCA_bundle.crt'))
        ]
    };  
    let app = express() , server = require('https').createServer(https_options, app);

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use('/EblDiaWebhook', route);
    server.setTimeout(SERVER_TIMEOUT_MS);
    
    app.get('/', (req, res) => res.send('This is NodeJs app, which contains the webhook code for EblDIA Google Dialogflow bot'))
    server.listen(PORT, () => {
        logger.log('info', "################## listening on port " + PORT + ". SERVER_TIMEOUT_MS= " + SERVER_TIMEOUT_MS + " ##################", { logId: "NULL" });
        logger.log('info', "################## Remote access url = https://publicip:9000/ , With domain= https://ebldia.ebl-bd.com:9000/ ##################", { logId: "NULL" });
        logger.log('info', "################## Remote access url for Dialogflow fullfilment With domain= https://ebldia.ebl-bd.com:9000/EblDiaWebhook/ ################## \n", { logId: "NULL" });
    });
}


    