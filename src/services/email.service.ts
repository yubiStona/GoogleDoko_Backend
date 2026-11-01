export interface SendPasswordResetOptions {
  email: string;
  token: string;
  resetUrl: string;
}

export class EmailService {
  async sendPasswordResetEmail(options: SendPasswordResetOptions): Promise<boolean> {
    const { email, token, resetUrl } = options;
    const webhookUrl = process.env.RESET_EMAIL_WEBHOOK;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `GoogleDoko Support <${fromEmail}>`,
            to: [email],
            subject: "Your GoogleDoko Password Reset Code",
            html: `
              <h2>GoogleDoko Password Reset</h2>
              <p>You requested a password reset for your GoogleDoko account.</p>
              <p>Your verification code is: <strong>${token}</strong></p>
              <p>Or click the link below to set a new password:</p>
              <p><a href="${resetUrl}">Reset Password</a></p>
              <p>This code will expire in 60 minutes.</p>
              <p>If you did not request this, please ignore this email.</p>
            `,
          }),
        });

        return response.ok;
      } catch (error) {
        console.error("Failed to send reset email via Resend:", error);
        return false;
      }
    }

    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token, resetUrl }),
        });
        return response.ok;
      } catch (error) {
        console.error("Failed to send reset email via webhook:", error);
        return false;
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV EMAIL] Password reset token for ${email}: ${token}`);
      console.log(`[DEV EMAIL] Reset URL: ${resetUrl}`);
    }

    return true;
  }
}

export default new EmailService();
