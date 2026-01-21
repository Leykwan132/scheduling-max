import {
  type GetPasswordResetEmailContentFn,
  type GetVerificationEmailContentFn,
} from "wasp/server/auth";

export const getVerificationEmailContent: GetVerificationEmailContentFn = ({
  verificationLink,
}) => ({
  subject: "Activate your Morph Scheduling account",
  text: `Click the link below to verify your email address and activate your account.`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header Image Placeholder -->
      <div style="width: 100%; height: 100px; background: linear-gradient(90deg, #FFC0CB 0%, #FF1493 100%); background-color: #FF1493;"></div>
      
      <div style="padding: 40px 20px;">
        <h1 style="color: #000000; font-size: 28px; line-height: 1.2; font-weight: 400; margin: 0 0 20px 0;">Activate your Morph Scheduling account</h1>
        
        <p style="color: #000000; font-size: 16px; font-weight: 700; margin: 0 0 30px 0;">Click the link below to get started with Morph Scheduling.</p>
        
        <a href="${verificationLink}" style="display: inline-block; background-color: #FDF2F8; color: #000000; text-decoration: none; padding: 16px 32px; font-size: 16px; font-weight: 500; border-radius: 2px;">Activate account</a>
      </div>
    
      <!-- Footer Image Placeholder -->
      <div style="width: 100%; height: 100px; background: linear-gradient(90deg, #FFC0CB 0%, #FF1493 100%); background-color: #FF1493;"></div>
    
      <!-- Footer Branding -->
      <div style="text-align: center; padding: 20px;">
        <div style="display: inline-block; background-color: #F3F4F6; padding: 6px 16px; border-radius: 9999px; font-size: 10px; color: #9CA3AF; font-weight: 700; letter-spacing: 0.5px;">
          <span style="color: #93C5FD;">♥</span> POWERED BY MORPH SCHEDULING
        </div>
      </div>
    </div>
  `,
});

export const getPasswordResetEmailContent: GetPasswordResetEmailContentFn = ({
  passwordResetLink,
}) => ({
  subject: "Reset your Morph Scheduling password",
  text: `Use the link below to set a new password for your account.`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header Image Placeholder -->
      <div style="width: 100%; height: 100px; background: linear-gradient(90deg, #FFC0CB 0%, #FF1493 100%); background-color: #FF1493;"></div>
      
      <div style="padding: 40px 20px;">
        <h1 style="color: #000000; font-size: 28px; line-height: 1.2; font-weight: 400; margin: 0 0 20px 0;">We received a request to reset your account password.</h1>
        
        <p style="color: #000000; font-size: 16px; font-weight: 700; margin: 0 0 30px 0;">
          Protecting your data is important to us.<br>
          Please click on the button below to begin.
        </p>
        
        <a href="${passwordResetLink}" style="display: inline-block; background-color: #FDF2F8; color: #000000; text-decoration: none; padding: 16px 32px; font-size: 16px; font-weight: 500; border-radius: 2px;">Reset Password</a>

        <div style="margin-top: 40px; font-size: 14px; color: #000000; line-height: 1.5;">
          <p style="margin: 0 0 20px 0;">If you did not request a password change, please contact us IMMEDIATELY so we can keep your account secure.</p>
          
          <p style="margin: 0;">
            Call Us at +60-129499394<br>
            or Email at <a href="mailto:security-support@sandown.com" style="color: #000000; text-decoration: none;">security-support@sandown.com</a>
          </p>
        </div>
      </div>
    
      <!-- Footer Image Placeholder -->
      <div style="width: 100%; height: 100px; background: linear-gradient(90deg, #FFC0CB 0%, #FF1493 100%); background-color: #FF1493;"></div>
    
      <!-- Footer Branding -->
      <div style="text-align: center; padding: 20px;">
        <div style="display: inline-block; background-color: #F3F4F6; padding: 6px 16px; border-radius: 9999px; font-size: 10px; color: #9CA3AF; font-weight: 700; letter-spacing: 0.5px;">
          <span style="color: #93C5FD;">♥</span> POWERED BY MORPH SCHEDULING
        </div>
      </div>
    </div>
  `,
});
