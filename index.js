const express = require('express');
const cors = require('cors');
const app = express();
const jsonwebtoken = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const port = process.env.PORT || 5000;

// Middleware.
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));

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



// Middleware.
// const logger = async (req, res, next) => {
//     console.log("Called: ", req.host, req.originalUrl);
//     next()
// };


// Verify Token.
const VerifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    // console.log("token from verify token", token);
    if (!token) {
        return res.status(401).send({ message: "Unauthorize Access" })
    };
    jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        // Error.
        if (err) {
            return res.status(401).send({ message: "Unauthorize Access" })
        }
        // Decoded.
        req.user = decoded;
        next();
    });
};



async function run() {
    try {
        // DB CONNECT.
        await client.connect();

        // Collections.
        const servicesCollections = client.db("CarDoctor").collection("Services");
        const bookingsCollections = client.db("CarDoctor").collection("Bookings");



        //-------------------------------------
        //          Auth Related API.
        // ------------------------------------


        // Create JWT.
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jsonwebtoken.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: false
            })
            res.send({ success: true });
        });



        // -------------------------------------
        //          Service Related API.
        // -------------------------------------


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
        app.get("/bookings", VerifyToken, async (req, res) => {
            // console.log("Query Email: ", req.query.email);
            // console.log("Cookie Token", req.cookies.token);
            // console.log("User Token info From Bookings", req.user);

            // Verify Data Requested User.
            if (req.query?.email !== req.user.email) {
                return res.status(403).send({ message: "Forbidden Access" })
            }

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