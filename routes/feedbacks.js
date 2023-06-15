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
    const campaignId = req.body.campaignId;
    const feedbackFor = req.body.for;
    const reviewer = req.body.reviewer;
    const scanParams = {
        TableName: 'Feedback'
    };
    
    
    docClient.scan(scanParams, (err, data) => {
      if (err) {
        return res.status(500).send(err);
      }
  
      const feedbackExists = data.Items.some(item => {
        return (
          item.campaignId === campaignId &&
          item.for === feedbackFor &&
          item.reviewer === reviewer
        );
      });
  
      if (feedbackExists) {
        return res.status(400).json({ message: 'Feedback already exists' });
      } 
      const date = new Date(); 
      const putParams = {
        TableName: 'Feedback',
        Item: {
          id: feedbackId,
          campaignId: campaignId,
          for: feedbackFor,
          reviewer: reviewer,
          review: req.body.review,
          date: date.toString(),
        }
      };
  
      docClient.put(putParams, (putErr, putData) => {
        if (putErr) {
          return res.status(500).send(putErr);
        }
        
        return res.send(putData);
      });
    });
  });

  router.delete('/feedbacks/:id/:fid', function (req, res) {
    var feedbackId = req.params.id;
    var params = {
        TableName: "Feedback",
        Key: {
            "id": feedbackId,
            "for": req.params.for
        }
    };
    docClient.delete(params, function (err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            res.send(data);
        }
    });
});

// router.post('/feedbacks', (req, res) => {

//     const feedbackId = uuidv4();

//     const params = {
//       TableName: 'Feedback',
//       Item: {
//         id: feedbackId,
//         campaignId: req.body.campaignId,
//         for: req.body.for,
//         reviewer: req.body.reviewer,
//         review: req.body.review
//       }
//     };
//     docClient.put(params, (err, data) => {
//       if (err) {
//         res.status(500).send(err);
//       } else {
//         return res.send(data);
//       }
//     });
// });





module.exports = router;