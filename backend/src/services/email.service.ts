import nodemailer from "nodemailer";
import { prisma } from "../utils/prisma.js";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  type: "STATUS_UPDATE" | "IMPORTANT_NOTICE" | "GENERAL";
}

let transporter: nodemailer.Transporter | null = null;

const initTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log("[EmailService] SMTP Transporter initialized.");
    } catch (err) {
      console.error("[EmailService] Failed to initialize SMTP:", err);
      transporter = null;
    }
  }
};

initTransporter();

export const sendNotificationEmail = async (options: SendEmailOptions): Promise<boolean> => {
  const { to, subject, html, type } = options;
  const from = process.env.EMAIL_FROM || "Society Office <notifications@societyhub.local>";

  try {
    let sentStatus = "SIMULATED";
    let errorMessage: string | null = null;

    if (transporter) {
      try {
        await transporter.sendMail({
          from,
          to,
          subject,
          html,
        });
        sentStatus = "SENT";
        console.log(`[EmailService] Email dispatched to: ${to} | Subject: ${subject}`);
      } catch (err: any) {
        console.error(`[EmailService] SMTP error when sending to ${to}:`, err.message);
        sentStatus = "FAILED";
        errorMessage = err.message;
      }
    } else {
      console.log(`\n================== [SIMULATED EMAIL NOTIFICATION] ==================`);
      console.log(`TO:      ${to}`);
      console.log(`FROM:    ${from}`);
      console.log(`TYPE:    ${type}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`BODY:    ${html.replace(/<[^>]+>/g, " ").trim().substring(0, 160)}...`);
      console.log(`====================================================================\n`);
    }

    await prisma.notificationLog.create({
      data: {
        recipientEmail: to,
        subject,
        content: html,
        type,
        status: sentStatus,
        error: errorMessage,
      },
    });

    return true;
  } catch (error: any) {
    console.error("[EmailService] Unexpected notification error:", error);
    return false;
  }
};

export const sendStatusChangeEmail = async (
  residentEmail: string,
  residentName: string,
  ticketId: string,
  title: string,
  oldStatus: string,
  newStatus: string,
  adminNote?: string | null
) => {
  const subject = `[${ticketId}] Maintenance Ticket Status Updated to ${newStatus}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
      <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #94a3b8; text-transform: uppercase;">Society Maintenance Operations</span>
        <h2 style="color: #f8fafc; margin: 6px 0 0 0; font-size: 20px; font-weight: 700;">Ticket Status Notification</h2>
      </div>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Dear <strong>${residentName}</strong>,</p>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">The status of your maintenance ticket has been updated by the society administrator:</p>
      
      <div style="background-color: #1e293b; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
        <div style="margin-bottom: 8px;"><strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Ticket ID:</strong> <span style="color: #f8fafc; font-family: monospace; font-weight: 700; margin-left: 6px;">${ticketId}</span></div>
        <div style="margin-bottom: 8px;"><strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Subject:</strong> <span style="color: #f8fafc; margin-left: 6px;">${title}</span></div>
        <div style="margin-bottom: 8px;"><strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Previous State:</strong> <span style="color: #64748b; margin-left: 6px;">${oldStatus}</span></div>
        <div style="margin-bottom: 8px;"><strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Updated State:</strong> <span style="color: #38bdf8; font-weight: 700; margin-left: 6px;">${newStatus}</span></div>
        ${adminNote ? `<div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #334155;"><strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Administrator Note:</strong><p style="color: #e2e8f0; font-style: italic; margin: 4px 0 0 0; font-size: 13px;">"${adminNote}"</p></div>` : ""}
      </div>
      
      <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 12px;">This is an automated notification from Palm Grove Residency Administration.</p>
    </div>
  `;

  return sendNotificationEmail({
    to: residentEmail,
    subject,
    html,
    type: "STATUS_UPDATE",
  });
};

export const sendImportantNoticeEmail = async (
  residents: { email: string; name: string }[],
  noticeTitle: string,
  noticeContent: string
) => {
  const subject = `Official Notice: ${noticeTitle}`;
  const promises = residents.map((resident) => {
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #d97706;">
        <div style="display: inline-block; background-color: #451a03; color: #fbbf24; border: 1px solid #92400e; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
          High Priority Society Announcement
        </div>
        <h2 style="color: #f8fafc; margin: 8px 0 16px 0; font-size: 20px; font-weight: 700;">${noticeTitle}</h2>
        <p style="color: #cbd5e1; font-size: 14px;">Dear <strong>${resident.name}</strong>,</p>
        <div style="background-color: #1e293b; padding: 18px; border-radius: 8px; line-height: 1.6; color: #e2e8f0; margin: 16px 0; font-size: 14px; border: 1px solid #334155;">
          ${noticeContent.replace(/\n/g, "<br/>")}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 12px;">Official circular dispatched by Society Management.</p>
      </div>
    `;

    return sendNotificationEmail({
      to: resident.email,
      subject,
      html,
      type: "IMPORTANT_NOTICE",
    });
  });

  await Promise.allSettled(promises);
};
