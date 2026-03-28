const express = require("express");
const cors = require("cors");
const app = express();

// ✅ Define corsOptions BEFORE using it
var corsOptions = {
  origin: "https://bulkmail-frontend-eosin.vercel.app", // ❌ removed double slash at end
};

app.use(cors(corsOptions)); // ✅ now corsOptions is defined

app.use(express.json());

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sanjaysarav01@gmail.com",
    pass: "oohb jtiw uflu wekk",
  },
});

const emailTemplate = (message, recipient) => ({
  from: "sanjaysarav01@gmail.com",
  to: recipient,
  subject: "You get Text Message from Your App!",
  text: message,
});

const sendMails = ({ message, emailList }) => {
  return new Promise(async (resolve, reject) => {
    try {
      for (const recipient of emailList) {
        const mailOptions = emailTemplate(message, recipient);
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${recipient}`);
      }
      resolve("Success");
    } catch (error) {
      console.error("Error sending emails:", error.message);
      reject(error.message);
    }
  });
};

app.post("/sendemail", function (req, res) {
  sendMails(req.body)
    .then((response) => {
      console.log(response);
      res.send(true);
    })
    .catch((error) => {
      res.send(false);
    });
});

app.listen(5000, function () {
  console.log("Server Started.....");
});
