const express = require("express")
const cors = require("cors")
const nodemailer = require("nodemailer")
const mongoose = require("mongoose")
require("dotenv").config()

const app = express()

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
.then(function() {
    console.log("MongoDB Connected")
})
.catch(function(err) {
    console.log("MongoDB Error:", err)
})

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

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

app.get("/", function(req, res) {
    res.send("BulkMail Backend is Running!")
})

app.post("/sendemail", function(req, res) {
    var subject = req.body.subject
    var msg = req.body.message
    var emailList = req.body.emailList

    new Promise(async function(resolve, reject) {
        try {
            for (var i = 0; i < emailList.length; i++) {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: emailList[i],
                    subject: subject,
                    text: msg
                })
                console.log("Email Sent to:" + emailList[i])
            }
            resolve("Success")
        } catch (error) {
            console.log("Error sending email:", error.message)
            reject("Failed")
        }
    }).then(async function() {
        const newEmail = new Email({
            subject: subject,
            message: msg,
            emailList: emailList,
            status: "success"
        })
        await newEmail.save()
        console.log("Saved to database")
        res.send({ success: true, msg: "Emails Sent Successfully!" })
    }).catch(async function() {
        const newEmail = new Email({
            subject: subject,
            message: msg,
            emailList: emailList,
            status: "failed"
        })
        await newEmail.save()
        res.send({ success: false, msg: "Failed to send emails" })
    })
})

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

module.exports = app