const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const query = require("express/lib/middleware/query");
const port = process.env.PORT || 5000;

const app = express();

//------------Middleware-----------\\

app.use(express.json());
app.use(cors());

//-----------MongoDB API-------------\\

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r9cny.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("Database: MongDB is connected");

    const serviceCollection = client.db("CavityCare").collection("services");
    const bookingCollection = client.db("CavityCare").collection("bookings");
    const userCollection = client.db("CavityCare").collection("users");

    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.get("/bookings", async (req, res) => {
      const patient = req.query.patient;
      const query = { patient: patient };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        date: booking.date,
        patient: booking.patient,
      };
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingCollection.insertOne(booking);
      return res.send({ success: true, result });
    });

    app.get("/available", async (req, res) => {
      const date = req.query?.date;

      // step-1 : get all services

      const services = await serviceCollection.find().toArray();

      // step-2 : get the booking of that date

      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();

      // step-3 : for each service find booking for that service

      services.forEach((service) => {
        // step-4 : find booking for that service
        const serviceBooking = bookings.filter(
          (booking) => booking.treatment === service.name
        );
        // step-5 : select slots for the service booking
        const booked = serviceBooking.map((booked) => booked.slot);

        // step-6 : select those slots that are not available in booked slots
        const available = service.slots.filter(
          (slot) => !booked.includes(slot)
        );
        // step-7 : set available slots to make it easier
        service.slots = available;
      });

      //------Nota bene: Available api je object gula dibe tader moddhe booked and slot nam e 2ta array thakbe. Then amra slot array theke booked array ta minus kore available gulake dekhabo client side e. But this is not the proper way of query--------//

      //We should use aggregate lookup, pipeline, match, group, etc when we will learn more about mongodb and express.

      res.send(services);
    });
  } finally {
  }
}
run().catch(console.dir);

//-----------Node Server API----------\\

app.get("/", (req, res) => {
  res.send("Server: Node server in running with Express");
});

app.listen(port, () => {
  console.log(`Server app listening on port ${port}`);
});
