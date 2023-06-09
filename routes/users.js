const express = require('express');
const AWS = require('aws-sdk');
const app = express();
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const router = express.Router();
const { Converter } = AWS.DynamoDB;


// Create a DynamoDB service object
const dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

// sign up

router.post('/users', async (req, res) => {
    const hashpasword = await bcrypt.hash(req.body.password, 10);
    console.log(hashpasword);
    var params = {
      TableName: "UserTable",
      IndexName: "userIndex",
      KeyConditionExpression:'username = :username',
      ExpressionAttributeValues: {
          ':username': {'S': req.body.username},
         
      },
      
    }
    dynamodb.query(params, (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      } else if (data.Items.length > 0) {
        res.status(400).json({ error: 'Username already exists' });
      } else {
        var putParams = {
          TableName: "UserTable",
          Item: {
            id: "USER:" + uuidv4(),
            role: "ROLE:" + uuidv4(),
            username: req.body.username,
            password: hashpasword.toString(),
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            type: req.body.type
            }
          }
        docClient.put(putParams, (err) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.json({ message: 'User signed up successfully' });
          }
        });
      }
    });
  });
  
router.get(`/users`, (req, res) =>{
    const params = {
      TableName : "UserTable"
    };
    // console.log('hello')
  docClient.scan(params, (err, data) => {
      if (err) {
          console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          res.send(data);
      }
    })
  })


// router.get('http://10.62.0.60:8080/temp',(req,res)=>{
//   console.log('helllo');
//   res.send('heeelo')
// })
  
// router.get('temp',(req,res)=>{
//   console.log('h');
//   res.send('h')
// }) 


  router.get('/users/:id', function (req, res) {
    var userId = req.params.id;
    var params = {
          TableName : "UserTable",
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
  
    router.delete('/users/:id', function (req, res) {
      var userId = req.params.id;
      var params = {
            TableName : "UserTable",
            Key: {
              "id": userId
            }
        };
        docClient.delete(params, function(err, data) {
          if (err) {
              console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
          }else{
            res.send(data);
          }
      });
      });
  
  
      router.get('/check-duplicate', (req, res) => {
        
        const params = {
          TableName: 'UserTable',
          IndexName: 'userIndex',
          KeyConditionExpression: 'username = "Hetvi"' && 'password= "987654321"',
          
        };
      
        dynamodb.query(params, (err, data) => {
          if (err) {
            console.error(err);
            res.status(500).send('Error checking for duplicates');
          } else {
            const duplicates = data.Items.length > 0;
            res.json({ duplicates });
          }
        });
      });
  
      //Role
  
      router.get(`/role`, (req, res) =>{
        const params = {
          TableName : "Role"
        };
      docClient.scan(params, (err, data) => {
          if (err) {
              console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
          } else {
              res.send(data);
          }
        })
      })
  
  
      //login
  
      router.post('/login', (req, res) => {
        var params = {
          TableName: "UserTable",
          IndexName: "userIndex",
          KeyConditionExpression:'username = :username ',
          ExpressionAttributeValues: {
              ':username': {'S': req.body.username},
             
          },
          
        }
        dynamodb.query(params, (err, data) => {
          if (err) {
            console.log(err);
            res.send(err)
          } else if (data.Items.length === 0) {
            res.send('User not found in DynamoDB');
          } else {
            const user = data.Items[0];
            // Compare the user's entered password with the hashed password in DynamoDB
            bcrypt.compare((req.body.password), user.password['S'], (err, result) => {
              console.log((req.body.password), user.password['S'], result);
              if (err) {
              res.send('Error comparing passwords: ', err);
              } else if (result === true) {
                res.send('Passwords match!');
                const token = jwt.sign({ userId: user.id }, 'secret_key', { expiresIn: '1h' });
                console.log(token);
  
                res.send({user:Converter.unmarshall(user), token:token})
                // Login successful, perform further actions
              } else {
                res.send('Passwords do not match!');
                // Login failed, handle the error
              }
            });
          }
        });
      });
  
      const verifyToken = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).send('Access denied. No token provided.');
        }
      
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, 'secret_key');
          req.user = { id: decoded.userId };
          next();
        } catch (err) {
          res.status(400).send('Invalid token.');
        }
      };

       // app.get('/test',verifyToken,(req,res)=>{
    //   res.send(`User ID: ${req.user['id']['S']}`);
    // })
    
    module.exports = router;