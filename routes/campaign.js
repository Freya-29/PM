const express = require('express');
const AWS = require('aws-sdk');
const app = express();
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const router = express.Router();
const nodemailer = require('nodemailer');
const axios = require('axios');
const {Converter} = AWS.DynamoDB;

const transporter = nodemailer.createTransport({
  
  host: 'smtp.gmail.com', // Replace with your SMTP host
  port: 587, // Replace with your SMTP port
  secure: false, // Set to true if using a secure connection
  auth: {
    user: 'fmh.sgp@gmail.com', // Replace with your email address
    pass: 'ajosjbiwppeqmcyy' // Replace with your email password or app password
  }
});


const dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

// var recipients = ["freya.190410107118@gmail.com"];

router.post('/send-email', (req, res) => {
  const { subject, content   } = req.body;
  const recipients1 = req.body.recipients


  const mailOptions = {
    from: 'fmh.sgp@gmail.com', // Replace with your email address
    to: recipients1,
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
      const date = new Date();
  
      const params = {
        TableName: 'Campaign',
        Item: {
          id: campaignId,
          startedBy: req.body.startedBy,
          for: req.body.for,
          reviewers: req.body.reviewers,
          created: date.toString(),
          active: req.body.active
        }
      };
      docClient.put(params, (err, data) => {
        if (err) {
          res.status(500).send(err);
        } else {
          console.log(params.Item);
          return res.send(params.Item);
        }
      });
  });


//update campaign
router.put('/campaigns/:id', (req, res) => {
  const campaignId = req.params.id;
    // index ;
  // const neelReviewers.mpa(ele,i)=>{
  //   ele.id === submitID
  //   index = i
  // }
  const params1 = {
    TableName : "Campaign"
  };
docClient.scan(params1, (err, data) => {
    if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log('tempppp->',data);
    }
  })
  const params = {
    TableName: 'Campaign',
    Key: {
      id: campaignId
    },
    UpdateExpression: 'SET reviewers[0].issubmitted = :issubmitted',
    ExpressionAttributeValues: {
      ':issubmitted': req.body.issubmitted
    },
  };

  docClient.update(params, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      // console.log(data.Attributes);
      return res.send(data.Attributes);
    }
  });
});

//update active-> deactivate

router.put('/campaign/deactivate/:id', (req, res) => {
  const campaignId = req.params.id;
    
  const params = {
    TableName: 'Campaign',
    Key: {
      id: campaignId
    },
    UpdateExpression: 'SET active = :active',
    ExpressionAttributeValues: {
      ':active': req.body.active
    },
  };

  docClient.update(params, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      // console.log(data.Attributes);
      return res.send(data.Attributes);
    }
  });
});


  
  
  router.delete('/campaign/:id', function (req, res) {
    var campaignId = req.params.id;
    var params = {
        TableName: "Campaign",
        Key: {
            "id": campaignId
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
      let param = req.query.forId;
      console.log(param);
      var reviewers;
      var campaignId = req.params.id;
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
        docClient.query(params, function(err, data) {
          if (err) {
              console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
          } else {
              console.log("Query succeeded.");
              res.send(data.Items[0].reviewers);
              reviewers = data.Items[0].reviewers
              reviewers.forEach(element => {
                var recipients = [];
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
              docClient.query(params, async function(err, data){
                if(err){
                  console.log(err);
                } else{
                  console.log(data['Items'][0]['email']);
                  recipients.push({
                    formLink: 'http://localhost:4200/form/' + campaignId + '/' + param + '/'  + data['Items'][0].id,
                    email: data['Items'][0]['email']
                  })
                  console.log(recipients[0]);
                  await sendemail(recipients[0]);
                }
              })


              });
              // const postData = {
              //   subject: 'John Doe',
              //   content: 'hello',
              //   recipients: recipients
              // };
              
              // // Make a POST request
              // axios.post('http://localhost:3000/api/send-email', postData)
              //   .then(response => {
              //     // Handle the response data
              //     console.log(response.data);
              //   })
              //   .catch(error => {
              //     // Handle the error
              //     console.error(error);
              //   });
          }
      });
      });

function sendemail(params) {
  const postData = {
      subject: 'John Doe',
      content: params.formLink,
      recipients: params.email
    };
    
    // Make a POST request
    axios.post('http://localhost:3000/api/send-email', postData)
      .then(response => {
        // Handle the response data
        console.log(response.data);
      })
      .catch(error => {
        // Handle the error
        console.error(error);
      });
}

module.exports = router;