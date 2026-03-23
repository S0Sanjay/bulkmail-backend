const express = require("express")
const cors = require("cors")
const nodemailer = require("nodemailer")
const mongoose = require("mongoose")
require("dotenv").config()

const app = express()

// i learned cors is needed so frontend can talk to backend
app.use(cors())
app.use(express.json())

// connecting to mongodb - learned this in week 11
mongoose.connect(process.env.MONGO_URI)
.then(function() {
    console.log("MongoDB Connected")
})
.catch(function(err) {
    console.log("MongoDB Error:", err)
})

// schema to save email records in database
const emailSchema = new mongoose.Schema({
    subject: String,
    message: String,
    emailList: [String],
    status: String,
    sentAt: {
        type: Date,
        default: Date.now
    }
})

const Email = mongoose.model("Email", emailSchema)

// setup nodemailer - using gmail
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

// this function sends email to each person one by one
const sendMails = ({ subject, message, emailList }) => {
    return new Promise(async (resolve, reject) => {
        try {
            for (const recipient of emailList) {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: recipient,
                    subject: subject,
                    text: message
                }
                await transporter.sendMail(mailOptions)
                console.log(`Email sent to ${recipient}`)
            }
            resolve("Success")
        } catch (error) {
            console.log("Error sending email:", error.message)
            reject(error.message)
        }
    })
}

// test route to check if server is running
app.get("/", function(req, res) {
    res.send("BulkMail Backend is Running!")
})

// POST route to send emails and save to db
app.post("/sendemail", function(req, res) {
    const { subject, message, emailList } = req.body

    // basic check
    if (!subject || !message || !emailList || emailList.length === 0) {
        return res.send({ success: false, msg: "Please fill all fields" })
    }

    sendMails({ subject, message, emailList })
    .then(async function(response) {
        console.log("All emails sent!")

        // save to database after sending
        const newEmail = new Email({
            subject: subject,
            message: message,
            emailList: emailList,
            status: "success"
        })
        await newEmail.save()
        console.log("Saved to database")

        res.send({ success: true, msg: "Emails Sent Successfully!" })
    })
    .catch(async function(error) {
        console.log("Failed:", error)

        // save failed record too
        const newEmail = new Email({
            subject: subject,
            message: message,
            emailList: emailList,
            status: "failed"
        })
        await newEmail.save()

        res.send({ success: false, msg: "Failed to send emails" })
    })
})

// GET route to fetch email history from database
app.get("/history", function(req, res) {
    Email.find().sort({ sentAt: -1 })
    .then(function(data) {
        console.log("History fetched:", data.length, "records")
        res.send(data)
    })
    .catch(function(err) {
        console.log("Error fetching history:", err)
        res.send([])
    })
})

app.listen(5000, function() {
    console.log("Server Started on port 5000.....")
})
console.log()