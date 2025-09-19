// SMTP / transactional email provider config
// Example using Nodemailer
import nodemailer from "nodemailer";

export const emailTransporter = nodemailer.createTransport({
   host: process.env.SMTP_HOST,
   port: process.env.SMTP_PORT,
   secure: true,
   auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
   },
});
