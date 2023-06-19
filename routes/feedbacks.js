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

router.post('/feedbacks', async (req, res) => {
    const feedbackId = uuidv4();
    const campaignId = req.body.campaignId;
    const feedbackFor = req.body.for;
    const reviewer = req.body.reviewer;
    const scanParams = {
        TableName: 'Feedback'
    };
    let index;
    let reviewersArray = [];

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
    
    // particylar employee campiagn and reviewers
    var params = {
      TableName : "Campaign",
      KeyConditionExpression: "#id = :id" ,
      ExpressionAttributeNames:{
          "#id": "id"
      },
      ExpressionAttributeValues: {
          ":id": campaignId
      }
    };
    await docClient.query(params, function(err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded....");
        reviewersArray = data.Items[0].reviewers
        console.log('one campaign data ->',data.Items[0].reviewers);
        reviewersArray.map((ele,i) => {
          console.log("ele(i)-->",ele);
          if(ele.id == reviewer){
            console.log('temp ->',ele,reviewer);
            index = i;
            console.log("i-->",i);
          }
        })
        console.log('index ->',index)
    }
});




// // updating the feedback value
const params1 = {
  TableName: 'Campaign',
  Key: {
    id: campaignId
  }
};

docClient.get(params1, (err, data) => {
  if (err) {
    console.error('Error retrieving item:', err);
    // Handle the error
  } else {
    const item = data.Item;
    
    console.log("item--->",item);
    // Update the element at the specified index
    item.reviewers[index].issubmitted = true;
    console.log("hello!");
    // Save the updated item back to DynamoDB
    const updateParams = {
      TableName: 'Campaign',
      Item: item
    };

    docClient.put(updateParams, (err, data) => {
      if (err) {
        console.error('Error updating item:', err);
        // Handle the error
      } else {
        console.log('Item updated successfully:', data);
        // Handle the successful update
      }
    });
    console.log("put");
  }
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

  router.get('/feedback/:eid', function(req, res){
    var id = req.params.eid;
    const params = {
      TableName: 'Feedback',
      IndexName: 'FeedbackIndex',
      KeyConditionExpression: '#for = :value',
      ExpressionAttributeNames: {
        '#for': 'for'
      },
      ExpressionAttributeValues: {
        ':value': id // Replace 'your-for-value' with the desired value for the "for" attribute
      }
    };
    
    dynamodb.query(params, (err, data) => {
      if (err) {
        console.error(err);
      } else {
        console.log(data); // Output: Array of items matching the query condition
      }
    });
  })

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