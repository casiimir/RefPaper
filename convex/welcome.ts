import { v } from "convex/values";
import { internalAction, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend } from "resend";

/**
 * Welcome email system for new user registrations
 * Sends email automatically when user creates account with Clerk
 */

const DOMAIN_EMAIL_ADRRESS = "noreply@refpaper.xyz";

/**
 * Send welcome email to new user using Resend SDK
 */
export const sendWelcomeEmail = internalAction({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      const { data, error } = await resend.emails.send({
        from: DOMAIN_EMAIL_ADRRESS,
        to: args.userEmail,
        subject: "Welcome to Refpaper! 🎉",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Refpaper!</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">

            <!-- Header -->
            <div style="background: #0a0a0a; padding: 40px 32px; border-radius: 4px; text-align: center; margin-bottom: 32px;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600;">Welcome to Refpaper!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">Turn your documentation into an AI knowledge assistant</p>
            </div>

            <!-- Main Content -->
            <div style="background: white; padding: 32px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
              <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">
                Thank you for joining Refpaper! We're excited to help you transform your documentation into powerful AI assistants.
              </p>

              <div style="background: #f3f4f6; padding: 24px; border-radius: 4px; margin: 24px 0;">
                <h3 style="color: #1f2937; margin-top: 0; font-size: 18px; margin-bottom: 16px;">🚀 Get started in 3 easy steps:</h3>
                <ol style="color: #4b5563; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;"><strong>Upload your documentation</strong> - Add URLs, or web pages</li>
                  <li style="margin-bottom: 8px;"><strong>Create your AI assistant</strong> - We'll process your content automatically</li>
                  <li style="margin-bottom: 8px;"><strong>Start asking questions</strong> - Get instant, accurate answers from your docs</li>
                </ol>
              </div>

              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  💡 <strong>Pro tip:</strong> The more comprehensive your documentation, the smarter your assistant becomes!
                </p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${
                  process.env.NEXT_PUBLIC_APP_URL ||
                  "https://ref-paper.vercel.app"
                }"
                   style="background: oklch(0.145 0 0); color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                  Create Your First Assistant →
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 8px 0;">Happy building!</p>
              <p style="margin: 8px 0;"><strong>The Refpaper Team</strong></p>
              <p style="margin: 16px 0 8px 0;">
                <a href="${
                  process.env.NEXT_PUBLIC_APP_URL ||
                  "https://ref-paper.vercel.app"
                }" style="color: #667eea; text-decoration: none;">RefPaper</a>
              </p>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error("Resend error:", error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      throw error;
    }
  },
});

/**
 * Trigger welcome email when user signs up
 * Call this after user completes Clerk registration
 */
export const triggerWelcomeEmail = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Only send welcome email if user has email
    if (identity.email) {
      // Schedule welcome email to be sent immediately
      ctx.scheduler.runAfter(0, internal.welcome.sendWelcomeEmail, {
        userEmail: identity.email,
      });

      return { success: true, email: identity.email };
    }

    return { success: false, error: "No email found" };
  },
});
