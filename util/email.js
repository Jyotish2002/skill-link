import nodemailer from "nodemailer";
import crypto from "crypto";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function sendVerificationEmail(
  email,
  token,
  subject = "Verify Your Email",
  path = "/verify-email"
) {
  const verificationLink = `${process.env.NEXTAUTH_URL}/${path}?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hack-IT-on - ${subject}</h2>
        <p>Hi there,</p>
        <p>${subject}</p>
        <p><a href="${verificationLink}" style="display: inline-block; padding: 10px 15px; background: #007bff; color: #fff; text-decoration: none; border-radius: 4px;">${subject}</a></p>
        <p>Or copy this link: ${verificationLink}</p>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Hack-IT-on Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return true;
}

export async function sendQRCodeEmail(
  email,
  userName,
  qrCodeDataUrl,
  eventName
) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Event Registration - ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Event Registration Confirmation</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for registering for ${eventName}.</p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="${qrCodeDataUrl}" alt="QR Code" style="max-width: 250px;">
        </div>
        <p><strong>Instructions:</strong></p>
        <ul>
          <li>Save this QR code for check-in</li>
          <li>Present at venue entrance</li>
          <li>Ensure screen brightness is high</li>
        </ul>
        <p>This QR code is unique to your registration. Please don't share it.</p>
        <p>For questions, contact the event organizer.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

export async function sendQRCodeEmailOut(
  email,
  userName,
  qrCodeDataUrl,
  eventName
) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Event Check-out - ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Event Check-out Confirmation</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for attending ${eventName}.</p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="${qrCodeDataUrl}" alt="QR Code" style="max-width: 250px;">
        </div>
        <p><strong>Instructions:</strong></p>
        <ul>
          <li>Save this QR code for check-out</li>
          <li>Present at venue exit</li>
          <li>Ensure screen brightness is high</li>
        </ul>
        <p>This QR code is unique to your check-out. Please don't share it.</p>
        <p>For questions, contact the event organizer.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

export async function sendAccountApprovalEmail(
  email,
  name,
  subject = "Account Approved - Hack-IT-on"
) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Approved - Welcome!</h2>
        <p>Hi ${name},</p>
        <p>Your account has been approved. You can now access all features.</p>
        <p><a href="${process.env.NEXTAUTH_URL}" style="display: inline-block; padding: 10px 15px; background: #28a745; color: #fff; text-decoration: none; border-radius: 4px;">Go to Dashboard</a></p>
        <p>Or visit: ${process.env.NEXTAUTH_URL}</p>
        <p>If you have any questions, feel free to reach out.</p>
        <p>Hack-IT-on Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return true;
}

export async function sendAccountRejectedEmail(
  email,
  name,
  subject = "Account Status - Hack-IT-on"
) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Registration Status</h2>
        <p>Hi ${name},</p>
        <p>Your account registration needs attention. Please ensure all details are correct and complete.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/register" style="display: inline-block; padding: 10px 15px; background: #dc3545; color: #fff; text-decoration: none; border-radius: 4px;">Register Again</a></p>
        <p>Or visit: ${process.env.NEXTAUTH_URL}/register</p>
        <p>If you believe this was a mistake, please contact our support team.</p>
        <p>Hack-IT-on Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return true;
}

export async function sendQuestionApprovalEmail(
  email,
  name,
  questionTitle,
  subject = "Question Status - Hack-IT-on"
) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Question Approved</h2>
        <p>Hi ${name},</p>
        <p>Your question has been approved and is now live. You've earned 5 points and 1 coin.</p>
        <p><strong>Question:</strong> "${questionTitle}"</p>
        <p>Thank you for contributing to Hack-IT-on!</p>
        <p>Hack-IT-on Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return true;
}

export async function sendQuestionRejectedEmail(
  email,
  name,
  questionTitle,
  subject = "Question Status - Hack-IT-on"
) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Question Needs Revision</h2>
        <p>Hi ${name},</p>
        <p>Your question requires some adjustments to meet our guidelines.</p>
        <p><strong>Question:</strong> "${questionTitle}"</p>
        <p>Please review and resubmit. If you believe this was a mistake, contact our support team.</p>
        <p>Hack-IT-on Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return true;
}
