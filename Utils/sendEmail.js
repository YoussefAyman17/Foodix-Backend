const nodemailer = require("nodemailer");
const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.Email_Host,
      port: process.env.Email_port,
      secure: true,
      auth: {
        user: process.env.Email_User,
        pass: process.env.Email_Password,
      },
    });

    const mailOptions = {
      from: "FoodIX <nadasawan212@gmail.com>",
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Email Error Details: ", error);
  }
};

module.exports = sendEmail;
