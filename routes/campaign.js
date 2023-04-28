const express = require('express');
const AWS = require('aws-sdk');
const app = express();
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const router = express.Router();


const dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();


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

module.exports = router;