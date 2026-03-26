const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

var corsOptions = {
  origin: ["https://bulkmail-frontend-eosin.vercel.app"],
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://bulkmail-frontend-eosin.vercel.app",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

app.options("*", (req, res) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://bulkmail-frontend-eosin.vercel.app",
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE",
  );
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.send();
});

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

const sendMails = ({ subject, message, emailList }) => {
  return new Promise(async (resolve, reject) => {
    try {
      for (const recipient of emailList) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: recipient,
          subject: subject,
          text: message,
        });
        console.log(`Email sent to ${recipient}`);
      }
      resolve("Success");
    } catch (error) {
      console.error("Error sending emails:", error.message);
      reject(error.message);
    }
  });
};

app.get("/", function (req, res) {
  res.send("BulkMail Backend is Running!");
});

app.post("/sendemail", function (req, res) {
  const { subject, message, emailList } = req.body;

  sendMails({ subject, message, emailList })
    .then(async function () {
      await new Email({
        subject,
        message,
        emailList,
        status: "success",
      }).save();
      res.send({ success: true });
    })
    .catch(async function (error) {
      await new Email({ subject, message, emailList, status: "failed" }).save();
      res.send({ success: false, error: error });
    });
});

app.get("/history", function (req, res) {
  Email.find()
    .sort({ sentAt: -1 })
    .then(function (data) {
      res.send(data);
    })
    .catch(function (err) {
      res.send([]);
    });
});

module.exports = app;
