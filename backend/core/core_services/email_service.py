import os
import smtplib
from email.message import EmailMessage
import asyncio
from core.logger import logger

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_pass = os.getenv("SMTP_PASS")
        self.sender_email = os.getenv("SENDER_EMAIL", "noreply@voxbiz.ai")

    def _send_email_sync(self, to_email: str, subject: str, body: str):
        if not self.smtp_host or not self.smtp_user or not self.smtp_pass:
            # Fallback to secure logging in development
            logger.info(f"Mock Email Dispatch: Delivered '{subject}' to {to_email} successfully. (SMTP not configured)")
            # ONLY FOR LOCAL TESTING: Print the body to console so developers can see the reset code
            print(f"\n--- MOCK EMAIL DELIVERED LOCALHOST ---\nTo: {to_email}\nSubject: {subject}\nBody:\n{body}\n--------------------------------------\n")
            return
            
        msg = EmailMessage()
        msg.set_content(body)
        msg["Subject"] = subject
        msg["From"] = self.sender_email
        msg["To"] = to_email

        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)
            logger.info(f"Email sent successfully to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            raise

    async def send_email(self, to_email: str, subject: str, body: str):
        """
        Sends an email asynchronously to avoid blocking the event loop.
        """
        await asyncio.to_thread(self._send_email_sync, to_email, subject, body)

email_service = EmailService()
