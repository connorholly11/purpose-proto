import sgMail from '@sendgrid/mail';
import { prisma } from './prisma';
import { callSummarizationLlmApi } from './llm';
import path from 'path';
import fs from 'fs';
import Handlebars from 'handlebars';
import { clerkClient } from '@clerk/nextjs';

// Set SendGrid API key
const apiKey = process.env.SENDGRID_API_KEY;

// Always use the real SendGrid API if we have credentials
if (apiKey && apiKey !== 'sendgrid-api-key') {
  console.log('Using real SendGrid integration with provided API key');
  sgMail.setApiKey(apiKey);
} else {
  console.log('Using mock SendGrid integration (no API key provided)');
}

// Load email template
const templatePath = path.join(process.cwd(), 'src/lib/email/templates/base.html');
let baseTemplate: string;
let template: HandlebarsTemplateDelegate<any>;

try {
  if (fs.existsSync(templatePath)) {
    baseTemplate = fs.readFileSync(templatePath, 'utf-8');
    template = Handlebars.compile(baseTemplate);
  } else {
    // Create a basic default template if none exists
    baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>{{subject}}</title>
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header { 
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 0.8em;
          color: #777;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Purpose</h1>
      </div>
      
      <div class="content">
        {{{bodyContent}}}
      </div>
      
      <div class="footer">
        <p>© Purpose AI, Inc.</p>
        <p>This email was generated based on insights from your conversations.</p>
      </div>
    </body>
    </html>
    `;
    template = Handlebars.compile(baseTemplate);
    
    // Create the directory if it doesn't exist
    const dir = path.dirname(templatePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save the default template
    fs.writeFileSync(templatePath, baseTemplate);
    console.log('Created default email template at:', templatePath);
  }
} catch (error) {
  console.error('Error loading email template:', error);
  // Fallback to a simple template
  baseTemplate = '<html><body>{{{bodyContent}}}</body></html>';
  template = Handlebars.compile(baseTemplate);
}

/**
 * Generate personalized email content based on user's structured summary
 */
export async function generateCustomEmailContent(userId: string): Promise<{ subject: string; body: string }> {
  // Fetch user context from structuredSummary
  const summary = await prisma.structuredSummary.findUnique({
    where: { userId },
  });
  
  if (!summary || !summary.summaryData) {
    throw new Error(`No summary data found for user ${userId}`);
  }

  // Prepare an LLM prompt that includes user context
  const prompt = `
    You are an AI assistant writing a personalized email for a user.
    The user context is: ${JSON.stringify(summary.summaryData)}
    
    Based on the user's data, write a personalized email that will be helpful and relevant to them.
    The email should be warm, encouraging, and reference the user's experiences or personality traits.
    
    1) Write a short, catchy subject line that relates to the user's journey or personality.
    2) Write an HTML email body that is warm, encouraging, and references the user's experiences, in a professional tone.
    
    Return your result in JSON of the form: {"subject": "...", "html": "..."}.
  `;

  // Call LLM
  const rawLlmResponse = await callSummarizationLlmApi(prompt, true);

  // Parse the JSON result
  let subject = 'Your Personalized Update';
  let body = '<p>Hello from Purpose!</p>';
  
  try {
    const parsed = JSON.parse(rawLlmResponse);
    subject = parsed.subject || subject;
    body = parsed.html || body;
  } catch (err) {
    console.error('Error parsing LLM response for email content:', err);
    console.log('Raw response:', rawLlmResponse);
  }

  return { subject, body };
}

/**
 * Send a personalized email to a user
 * @param userId - The Clerk ID of the user
 * @param overrideEmail - Optional email address to override the user's email
 */
export async function sendAiEmailToUser(userId: string, overrideEmail?: string): Promise<void> {
  // Get user from database
  const user = await prisma.user.findUnique({ 
    where: { clerkId: userId } 
  });
  
  if (!user) {
    throw new Error('User not found');
  }

  // Use override email if provided
  let userEmail: string | null = null;
  
  if (overrideEmail && overrideEmail.trim() !== '') {
    userEmail = overrideEmail.trim();
    console.log(`Using provided override email: ${userEmail}`);
  } else {
    // No override provided, try to get from Clerk
    try {
      // Try to get from Clerk
      const clerkUser = await clerkClient.users.getUser(user.clerkId);
      
      if (clerkUser && clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
        const primaryEmail = clerkUser.emailAddresses.find(
          (email) => email.id === clerkUser.primaryEmailAddressId
        );
        userEmail = primaryEmail?.emailAddress || clerkUser.emailAddresses[0].emailAddress;
      }
      
      // If no email from Clerk and we're in development, use default test email
      if (!userEmail && (process.env.NODE_ENV !== 'production')) {
        userEmail = 'connorholly11@gmail.com';
        console.log(`Using test email address for development: ${userEmail}`);
      }
    } catch (error) {
      console.error('Error fetching user from Clerk:', error);
      
      // Fallback to test email for development
      if (process.env.NODE_ENV !== 'production') {
        userEmail = 'connorholly11@gmail.com';
        console.log(`Using fallback test email address: ${userEmail}`);
      } else {
        throw new Error('Failed to retrieve user email from Clerk');
      }
    }
  }

  if (!userEmail) {
    throw new Error('User has no email address');
  }

  // Generate personalized content
  const { subject, body } = await generateCustomEmailContent(userId);

  // Apply template
  const finalHtml = template({
    subject,
    bodyContent: body,
  });

  // Create email object
  const msg = {
    to: userEmail,
    from: process.env.SENDGRID_FROM_EMAIL || 'support@yourapp.com', // Verified sender in SendGrid
    subject,
    html: finalHtml,
  };

  try {
    // Always try to send the real email if we have API key
    if (apiKey && apiKey !== 'sendgrid-api-key') {
      console.log('Sending real email via SendGrid');
      console.log(`To: ${userEmail}`);
      console.log(`From: ${process.env.SENDGRID_FROM_EMAIL || 'support@yourapp.com'}`);
      console.log(`Subject: ${subject}`);
      
      // Send the email
      await sgMail.send(msg);
      
      // Log to database
      await prisma.emailLog.create({
        data: {
          userId: user.clerkId,
          subject,
          htmlBody: finalHtml,
          status: 'sent',
        },
      });
      
      console.log('Email sent successfully!');
    } else {
      // Mock mode when no API key is available
      console.log('MOCK EMAIL SENDING (no SendGrid API key)');
      console.log(`To: ${userEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content Length: ${finalHtml.length} chars`);
      
      // Log to database as "mock_sent"
      await prisma.emailLog.create({
        data: {
          userId: user.clerkId,
          subject,
          htmlBody: finalHtml,
          status: 'mock_sent',
        },
      });
    }
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    
    // Log failure
    await prisma.emailLog.create({
      data: {
        userId: user.clerkId,
        subject,
        htmlBody: finalHtml,
        status: 'failed',
      },
    });
    
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get email logs for a user
 */
export async function getUserEmailLogs(userId: string, limit = 10) {
  return prisma.emailLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get all email logs (admin function)
 */
export async function getAllEmailLogs(limit = 100) {
  return prisma.emailLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
  });
}