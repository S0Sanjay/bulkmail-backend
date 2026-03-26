const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: "https://bulkmail-frontend-eosin.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(function () {
    console.log("MongoDB Connected");
  })
  .catch(function (err) {
    console.log("MongoDB Error:", err);
  });

const emailSchema = new mongoose.Schema({
  subject: String,
  message: String,
  emailList: [String],
  status: String,
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

const Email = mongoose.model("Email", emailSchema);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.get("/", function (req, res) {
  res.send("BulkMail Backend is Running!");
});

app.post("/sendemail", async function (req, res) {
  const { subject, message, emailList } = req.body;

  try {
    for (let i = 0; i < emailList.length; i++) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: emailList[i],
        subject: subject,
        text: message,
      });
      console.log("Email Sent to:", emailList[i]);
    }

    await new Email({
      subject,
      message,
      emailList,
      status: "success",
    }).save();

    console.log("All emails sent & saved");
    res.send({ success: true });
  } catch (error) {
    console.log("Error:", error.message);

    await new Email({
      subject,
      message,
      emailList,
      status: "failed",
    }).save();

    res.send({ success: false, error: error.message });
  }
});

app.get("/history", function (req, res) {
  Email.find()
    .sort({ sentAt: -1 })
    .then(function (data) {
      console.log("History fetched:", data.length, "records");
      res.send(data);
    })
    .catch(function (err) {
      console.log("Error fetching history:", err);
      res.send([]);
    });
});

module.exports = app;