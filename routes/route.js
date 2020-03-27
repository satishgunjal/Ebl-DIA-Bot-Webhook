'use strict';

const express = require('express');
const router = express.Router();

// Require the controllers
const controller = require('../controllers/controller');


// Requests from Dialogflow will be routed to below function.
// POST Req Url using ngrok: http://706da9c2.ngrok.io/increaseNoOfTries
// POST Req Url from localhost  :http://localhost:1234/increaseNoOfTries
// Above url will be updated on Dialogflow under fullfilment section
router.post('/', controller.dialogflow_webhook_request);
router.get('/', controller.get_request);


module.exports = router;