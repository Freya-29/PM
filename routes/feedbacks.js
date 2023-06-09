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

router.get(`/feedbacks`, (req, res) => {

    const params = {

        TableName: "Feedback"

    };

    docClient.scan(params, (err, data) => {

        if (err) {

            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));

        } else {

            res.send(data);

        }

    })

});

router.get('/feedback/:id', (req, res) => {
    const empId =req.params.id;
    docClient.scan({ TableName: "Feedback" }, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            var FeedbackDetail = data;
            // console.log("Nalini ", EmployeeDetail.Items);
            var allFeedbacks = [];
            if (FeedbackDetail) {
                FeedbackDetail.Items.forEach(element => {
                    // console.log("Nalini1",element);
                    if (element.for === empId) {
                        // console.log("Nalini5", element);
                        allFeedbacks.push(element);
                    }
                });
                // console.log("allEmployees : ", allEmloyees);
                res.send(allFeedbacks)
            }
        }
    });
})

router.post('/feedbacks', (req, res) => {

    const feedbackId = uuidv4();

    const params = {
      TableName: 'Feedback',
      Item: {
        id: feedbackId,
        campaignId: req.body.campaignId,
        for: req.body.for,
        reviewer: req.body.reviewer,
        review: req.body.review
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





module.exports = router;