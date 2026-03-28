const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors({
  origin: "https://bulkmail-frontend-eosin.vercel.app",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));
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
app.get("/", (req, res) => {
  res.send("BulkMail Backend is Running!");
});
app.post("/sendemail", async (req, res) => {
  const { subject, message, emailList } = req.body;
  if (!subject || !message || !emailList || emailList.length === 0) {
    return res.status(400).json({ success: false, msg: "All fields are required." });
  }
  res.json({ success: true, msg: "Emails are being sent..." });

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

    await new Email({ subject, message, emailList, status: "success" }).save();
    console.log("All emails sent and saved.");
  } catch (error) {
    console.log("Error sending email:", error.message);
    await new Email({ subject, message, emailList, status: "failed" }).save();
  }
});
app.get("/history", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ success: false, msg: "Unauthorized" });
  }
  try {
    const data = await Email.find().sort({ sentAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error fetching history" });
  }
});

module.exports = app;
