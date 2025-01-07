const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

// Middleware.
app.use(cors());
app.use(express.json());

// Service
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kwi75.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



async function run() {
    try {
        // DB CONNECT.
        await client.connect();

        // Collections.
        const servicesCollections = client.db("CarDoctor").collection("Services");
        const bookingsCollections = client.db("CarDoctor").collection("Bookings");


        // Get All Services.
        app.get("/services", async (req, res) => {
            const result = await servicesCollections.find().toArray();
            res.send(result);
        });


        // Get A Single Service.
        app.get("/service/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await servicesCollections.findOne(filter);
            res.send(result);
        });


        // Get A Single Service For Checkout (Spacial )
        app.get("/checkout/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = {
                projection: { title: 1, price: 1, service_id: 1, img: 1 }
            }
            const result = await servicesCollections.findOne(filter, options);
            res.send(result);
        });


        // Get Bookings Info.
        app.get("/bookings", async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { customer_email: req.query.email }
            }
            const result = await bookingsCollections.find(query).toArray();
            res.send(result);
        })


        // Post Service Bookings.
        app.post("/bookings", async (req, res) => {
            const bookingData = req.body;
            const result = await bookingsCollections.insertOne(bookingData);
            res.send(result);
        });


        // Update Booking Info.
        app.patch("/booking/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateInfo = req.body;
            const updatedDoc = {
                $set: {
                    status: updateInfo.status
                }
            };
            const result = await bookingsCollections.updateOne(filter, updatedDoc);
            res.send(result);
        });


        // Delete Booking.
        app.delete("/booking/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingsCollections.deleteOne(query);
            res.send(result);
        });




        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


// Default Port.
app.get("/", (req, res) => {
    res.send("Car Doctor Server Running");
});

// Listening.
app.listen(port, () => {
    console.log("Server Running on Port: ", port);
});