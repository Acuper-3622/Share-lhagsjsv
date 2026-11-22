require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/share-location", async (req, res) => {
  const { latitude, longitude, accuracy, consent } = req.body || {};

  if (consent !== true) {
    return res.status(400).json({ error: "Explicit consent is required." });
  }
  if (
    typeof latitude !== "number" || !Number.isFinite(latitude) ||
    latitude < -90 || latitude > 90 ||
    typeof longitude !== "number" || !Number.isFinite(longitude) ||
    longitude < -180 || longitude > 180
  ) {
    return res.status(400).json({ error: "Invalid coordinates." });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD ||
      !process.env.DESTINATION_EMAIL) {
    return res.status(500).json({ error: "Email service is not configured." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.DESTINATION_EMAIL,
      subject: "Location shared with your permission",
      text: `A user chose to share their location.\nLatitude: ${latitude}\nLongitude: ${longitude}\nAccuracy: ${accuracy ?? "unknown"} meters\nMap: ${mapUrl}`
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Email sending failed:", err.message);
    res.status(500).json({ error: "Could not send the email. Check server email settings." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
