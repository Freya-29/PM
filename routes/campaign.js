const express = require('express');
const AWS = require('aws-sdk');
const app = express();
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const router = express.Router();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  
  host: 'smtp.gmail.com', // Replace with your SMTP host
  port: 587, // Replace with your SMTP port
  secure: false, // Set to true if using a secure connection
  auth: {
    user: 'freya19beceg147@gmail.com', // Replace with your email address
    pass: 'freya@29' // Replace with your email password or app password
  }
});


const dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

router.post('/send-email', (req, res) => {
  const { subject, content, recipients } = req.body;

  const mailOptions = {
    from: 'hetviparikh29@gmail.com', // Replace with your email address
    to: recipients,
    subject,
    text: content
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      res.status(500).send('Error sending email');
    } else {
      console.log('Email sent:', info.response);
      res.sendStatus(200);
    }
  });
});


router.post('/campaigns', (req, res) => {

      const campaignId = uuidv4();
  
      const params = {
        TableName: 'Campaign',
        Item: {
          id: campaignId,
          startedBy: req.body.startedBy,
          for: req.body.for,
          reviewers: req.body.reviewers,
          active: false
        }
      };
      docClient.put(params, (err, data) => {
        if (err) {
          res.status(500).send(err);
        } else {
          return res.send(data);
        }
      });
  });


  router.get(`/campaigns`, (req, res) =>{
    const params = {
      TableName : "Campaign"
    };
  docClient.scan(params, (err, data) => {
      if (err) {
          console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          res.send(data);
      }
    })
  })


  router.get('/campaigns/:id', function (req, res) {
    var userId = req.params.id;
    var params = {
          TableName : "Campaign",
          KeyConditionExpression: "#id = :id" ,
          ExpressionAttributeNames:{
              "#id": "id"
          },
          ExpressionAttributeValues: {
              ":id": userId
          }
      };
      docClient.query(params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            console.log("Query succeeded.");
            res.send(data)
        }
    });
    });

    router.get('/campaigns/mail/:id', function (req, res) {
      var reviewers;
      var userId = req.params.id;
      var params = {
            TableName : "Campaign",
            KeyConditionExpression: "#id = :id" ,
            ExpressionAttributeNames:{
                "#id": "id"
            },
            ExpressionAttributeValues: {
                ":id": userId
            }
        };
        docClient.query(params, function(err, data) {
          if (err) {
              console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
          } else {
              console.log("Query succeeded.");
              res.send(data.Items[0].reviewers);
              reviewers = data.Items[0].reviewers
              reviewers.forEach(element => {
                var params = {
                  TableName : "Employee",
                  KeyConditionExpression: "#id = :id" ,
                  ExpressionAttributeNames:{
                      "#id": "id"
                  },
                  ExpressionAttributeValues: {
                      ":id": element
                  }
              };
              docClient.query(params, function(err, data){
                if(err){
                  console.log(err);
                } else{
                  console.log(data['Items'][0]['email']);
                  ///sending email:-------------------
                }
              })


              });
          }
      });
      });

module.exports = router;