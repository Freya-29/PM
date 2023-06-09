const express = require('express');
const AWS = require('aws-sdk');
const app = express();
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
require('dotenv/config');
const base = 'http://10.62.0.60:8080'
const http = require('http')
const cors = require('cors');

AWS.config.update({
  region: 'ap-south-1',
  endpoint: 'http://10.62.0.61:8000',
});

// Create a DynamoDB service object
const dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();


//middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

//Routes
const usersRoutes = require('./routes/users');
const employeesRoutes = require('./routes/employees');
const campaignRoutes = require('./routes/campaign');
const feedbacksRoutes = require('./routes/feedbacks');


app.use(`/api`,usersRoutes);
app.use(`/api`,employeesRoutes);
app.use(`/api`,campaignRoutes);
app.use(`/api`,feedbacksRoutes);


// app.listen(process.env.PORT,'10.62.0.60',() =>
app.listen(process.env.PORT,() =>
  console.log(`Example app listening on port ${process.env.PORT}!`),
);


