const express = require('express');
const AWS = require('aws-sdk');
const app = express();
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const router = express.Router();

// Create a DynamoDB service object
const dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();







module.exports = router;