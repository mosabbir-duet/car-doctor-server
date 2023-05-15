const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000;

// middleware 
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send("Cars doctor server is running.....")
})

// console.log(process.env.DB_USER)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qqel2bj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT = (req, res, next) => {
  const authorization =  req.headers.authorization;
  console.log(authorization)
  if(!authorization) {
    return res.status(401).send({error: true, message: 'Unauthorized access'})
  }
  const token = authorization.split(' ')[1];
  console.log('token inside jwt verify =', token)
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if(error) {
      return res.status(403).send({error: true, message: 'Unauthorized access'})
    }
    req.decoded = decoded;
    next();
  })

  
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

const serviceCollection = client.db('carDoctor').collection('service');
const orderCollection = client.db('carDoctor').collection('order');

// service data fetch from database 

app.get('/services', async (req, res) => {
    const cursor = serviceCollection.find()
    const result = await cursor.toArray()
    res.send(result);
})

// specific service data fetch from database 
app.get('/services/:id', async (req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const options = { projection: {title: 1, price: 1, service_id: 1, img: 1}}
    const result = await serviceCollection.findOne(query, options);
    res.send(result);
})

// orderBookings route 
app.get('/orderBookings',verifyJWT, async(req,res) => {
  // console.log(req.query.email)
  const decoded = req.decoded;
  console.log('came back after verification..',decoded)
  if(decoded.email != req.query.email) {
    return res.status(403).send({error: true, message: 'forbidden access'})
  }
  let query = {}
  if(req.query?.email)
  {
    query = {email: req.query.email}
  }

  const result = await orderCollection.find(query).toArray()
  res.send(result)
})

// data delete 

app.delete('/orderBookings/:id', async(req, res) => {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await orderCollection.deleteOne(query)
  res.send(result)
})

// jwt route 

app.post('/jwt', (req,res) => {
  const user = req.body;
  console.log(user)
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
  console.log(token)
  // token provide as a string and it,s convert in json to client side that's why it convert in object 
  res.send({token})
})

// orderBooking data insert into order collection of carDoctor database 

app.post('/orderBookings', async(req,res) => {
  const orderBooking = req.body;
  // console.log(orderBooking)
  const result = await orderCollection.insertOne(orderBooking);
  res.send(result)
})

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`Cars doctor server is running on port = ${port}`)
})