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


router.post('/employees', async function (req, res) {

    var employeeParams = {
        IndexName: "employeeIndex",
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': req.body.email
        },
        TableName: "Employee"
    }

    docClient.query(employeeParams, async (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        } else if (data.Items.length > 0) {
            res.status(400).json({ error: 'Data already exists' });
        } else {
            var deprtmnt = {
                IndexName: "DepartmentIndex",
                KeyConditionExpression: 'departmentName = :name',
                ExpressionAttributeValues: {
                    ':name': req.body.department
                },
                TableName: "Department"
            }
            var departmentDetail = await docClient.query(deprtmnt).promise();
            console.log("DepartmentDetail" + JSON.stringify(departmentDetail));
            console.log("DepartmentDetailID" + JSON.stringify(departmentDetail.Items[0].id));

            var designation = {
                IndexName: "designationIndex",
                KeyConditionExpression: 'designationName = :name',
                ExpressionAttributeValues: {
                    ':name': req.body.designation
                },
                TableName: "Designation"
            }
            var designationDetail = await docClient.query(designation).promise();
            console.log("DesignationDetail" + JSON.stringify(designationDetail));
            console.log("DesignationDetailID" + JSON.stringify(designationDetail.Items[0].id));

            const employeeItem = {
                TableName: "Employee",
                Item: {
                    id: "EMPLOYEE:: " + uuidv4(),
                    createdAt: new Date().toISOString(),
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    designation: designationDetail.Items[0].id,
                    department: departmentDetail.Items[0].id,
                    reportsTo: req.body.reportsTo,
                    type: "EMPLOYEE"
                }
            };

            docClient.put(employeeItem, function (err, data) {
                if (err) {
                    console.error("Unable to add Name. Error JSON:", JSON.stringify(err, null, 2));
                    return res.send(err);
                } else {
                    console.log("PutItem succeeded:", data);
                    return res.send(data);
                }
            });
        }
    })


})

// get employee
router.get(`/employees`, (req, res) => {
    const params = {
      TableName: "Employee"
    };
  
    docClient.scan(params, async (err, data) => {
      if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        res.status(500).send("Error retrieving employee data");
      } else {
        try {
          const employees = data.Items;
  
          const modifiedEmployees = await Promise.all(employees.map(async (element) => {
            const departmentId = element.department;
            const departmentParams = {
              TableName: "Department",
              KeyConditionExpression: "#id = :id",
              ExpressionAttributeNames: {
                "#id": "id"
              },
              ExpressionAttributeValues: {
                ":id": departmentId
              }
            };
  
            const departmentData = await new Promise((resolve, reject) => {
              docClient.query(departmentParams, (err, data2) => {
                if (err) {
                  console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                  reject(err);
                } else {
                  console.log("Query succeeded.");
                  console.log(data2['Items'][0]['departmentName']);
                  resolve(data2['Items'][0]['departmentName']);
                }
              });
            });
  
            element.department = departmentData;
            return element;
          }));
  
          console.log(modifiedEmployees);
          res.send(modifiedEmployees);
        } catch (error) {
          console.error("Error processing employee data:", error);
          res.status(500).send("Error processing employee data");
        }
      }
    });
  });

router.get('/employees/:id', function (req, res) {
    var userId = req.params.id;
    var params = {
        TableName: "Employee",
        KeyConditionExpression: "#id = :id",
        ExpressionAttributeNames: {
            "#id": "id"
        },
        ExpressionAttributeValues: {
            ":id": userId
        }
    };
    docClient.query(params, function (err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            console.log("Query succeeded.");
            res.send(data)
        }
    });
});


// delete employee
router.delete('/employees/:id', function (req, res) {
    var userId = req.params.id;
    var params = {
        TableName: "Employee",
        Key: {
            "id": userId
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


//create a Department
router.post('/department', function (req, res) {

    var departmentParams = {
        IndexName: "DepartmentIndex",
        KeyConditionExpression: 'departmentName = :name',
        ExpressionAttributeValues: {
            ':name': req.body.departmentName
        },
        TableName: "Department"
    }

    docClient.query(departmentParams, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        } else if (data.Items.length > 0) {
            res.status(400).json({ error: 'DepartmentName already exists' });
        } else {
            const departmentItem = {
                TableName: "Department",
                Item: {
                    id: uuidv4(),
                    createdAt: new Date().toISOString(),
                    departmentName: req.body.departmentName
                }
            };
            docClient.put(departmentItem, function (err, data) {
                if (err) {
                    console.error("Unable to add Name. Error JSON:", JSON.stringify(err, null, 2));
                    return res.send(err);
                } else {
                    console.log("PutItem succeeded:", data);
                    return res.send(data);
                }
            });
        }
    })

})


//get department
router.get('/department', function (req, res) {
    docClient.scan({ TableName: "Department" }, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            res.send(data)
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
        }
    });

})


// Get the employee list with department === departmentId
router.get('/employees/department/:department', async function (req, res) {
    docClient.scan({ TableName: "Employee" }, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            var EmployeeDetail = data;
            console.log("Nalini ", EmployeeDetail.Items);
            var allEmloyees = [];
            if (EmployeeDetail) {
                EmployeeDetail.Items.forEach(element => {
                    // console.log("Nalini1",element);
                    if (element.department === req.params.department) {
                        console.log("Nalini5", element);
                        allEmloyees.push(element);
                    }
                });
                console.log("allEmployees : ", allEmloyees);
                res.send(allEmloyees)
            }
        }
    });
})


// Get the employee list with reportsTo === empId
router.get('/employees/reportsto/:reportsTo', async function (req, res) {
    docClient.scan({ TableName: "Employee" }, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            var EmployeesDetail = data;
            console.log("Nalini ", EmployeesDetail.Items);
            var allEmloyee = [];
            if (EmployeesDetail) {
                EmployeesDetail.Items.forEach(element => {
                    // console.log("Nalini1",element);
                    if (element.reportsTo === req.params.reportsTo) {
                        console.log("Nalini5", element);
                        allEmloyee.push(element);
                    }
                });
                console.log("allEmployee : ", allEmloyee);
                res.send(allEmloyee)
            }
        }
    });
})


//create a Designation
router.post('/designation', function (req, res) {

    var designationParams = {
        IndexName: "designationIndex",
        KeyConditionExpression: 'designationName = :name',
        ExpressionAttributeValues: {
            ':name': req.body.designationName
        },
        TableName: "Designation"
    }

    docClient.query(designationParams, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        } else if (data.Items.length > 0) {
            res.status(400).json({ error: 'DesignationName already exists' });
        } else {
            const designationItem = {
                TableName: "Designation",
                Item: {
                    id: uuidv4(),
                    createdAt: new Date().toISOString(),
                    designationName: req.body.designationName,
                    canReview: req.body.canReview
                }
            };

            docClient.put(designationItem, function (err, data) {
                if (err) {
                    console.error("Unable to add Name. Error JSON:", JSON.stringify(err, null, 2));
                    return res.send(err);
                } else {
                    console.log("PutItem succeeded:", data);
                    return res.send(data);
                }
            });
        }
    })

})

//get designation
router.get('/designation', function (req, res) {
    docClient.scan({ TableName: "Designation" }, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            res.send(data)
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
        }
    });

})


module.exports = router;