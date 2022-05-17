const express = require("express"); //import express
const router = express.Router(); //used express to create route handlers
const urlController = require('../controllers/urlController');

router.post("/url/shorten",urlController.createUrl);

module.exports = router;