const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const admin = require('firebase-admin');
require('dotenv').config()
const ObjectId = require('mongodb').ObjectId;

const port = 4000
const app = express()
app.use(bodyParser.json())
app.use(cors())

var serviceAccount = require("./reo-garage-firebase-adminsdk-b7ic9-9fd96b0875.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://reo-garage.firebaseio.com"
});


const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zcosf.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  const commentsCollection = client.db("reo-garage").collection("comments");
  const servicesCollection = client.db("reo-garage").collection("services");
  const adminEmailCollection = client.db("reo-garage").collection("admin_email");
  const ordersCollection = client.db("reo-garage").collection("orders");

  app.post('/db/addComments', (req, res) => {
    const comment = req.body;
    commentsCollection.insertOne(comment)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  app.get('/db/comments', (req, res) => {
    commentsCollection.find({})  
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.post('/db/addService', (req, res) => {
    const service = req.body;
    servicesCollection.insertOne(service)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  app.get('/db/services', (req, res) => {
    servicesCollection.find({})  
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.post('/db/addAdminMember', (req, res) => {
    const admin = req.body;
    adminEmailCollection.insertOne(admin)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  app.get('/db/service/:id', (req, res) => {
    servicesCollection.find({ _id: ObjectId(req.params.id)})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.post('/db/addOrder', (req, res) => {
    const order = req.body;
    ordersCollection.insertOne(order)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  app.get('/db/order', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          let tokenEmail = decodedToken.email;
          let queryEmail = req.query.email;
          if (tokenEmail === queryEmail) {
            ordersCollection.find({ email: req.query.email })
            .toArray((err, documents) => {
                res.send(documents)
              })
          }
          else {
            res.status(401).send('unauthorized access');
          }
        })
        .catch((error) => {
          res.status(401).send('unauthorized access');
        });
    }
    else {
      res.status(401).send('unauthorized access');
    }
  })

  app.get('/db/adminsEmail', (req, res) => {
    adminEmailCollection.find({})  
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.get('/db/allOrders', (req, res) => {
    ordersCollection.find({})  
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.patch('/db/updateStatus/:id', (req, res) => {
    ordersCollection.updateOne({ _id: ObjectId(req.params.id)},
      {
        $set: { orderStatus: req.body.action }
      })
      .then(result => {
        res.send(result.modifiedCount > 0)
      })
  })


})

app.listen(port)