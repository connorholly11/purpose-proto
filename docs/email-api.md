# Email API Documentation

This document describes the AI-driven emailing feature using SendGrid.

## Overview

The email feature allows sending personalized emails to users based on their conversation data and structured summaries. The system uses the existing LLM service to generate personalized email content and SendGrid for delivery.

## Setup Requirements

1. **SendGrid Account**: You need a SendGrid account and API key
2. **Verified Sender**: Add a verified sender email in your SendGrid account
3. **Environment Variables**: Set the following in `.env`:
   ```
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=your-verified-sender@yourdomain.com
   ```

## API Endpoints

### User Endpoints

#### `POST /api/email/send`
Send an AI-generated email to a user.

**Request Body:**
```json
{
  "userId": "user_clerk_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

#### `GET /api/email/logs/:userId`
Get email logs for a specific user.

**Response:**
```json
[
  {
    "id": "email_log_id",
    "userId": "user_clerk_id",
    "subject": "Your Personalized Update",
    "htmlBody": "...",
    "status": "sent",
    "createdAt": "2025-04-08T19:01:35.000Z"
  }
]
```

### Admin Endpoints

#### `POST /api/admin/send-ai-email`
Admin endpoint to send an AI-generated email to any user.

**Request Body:**
```json
{
  "userId": "user_clerk_id"
}
```

**Response:**
Same as the user endpoint.

#### `GET /api/admin/email-logs`
Get all email logs (admin only).

**Response:**
```json
[
  {
    "id": "email_log_id",
    "userId": "user_clerk_id",
    "subject": "Your Personalized Update",
    "htmlBody": "...",
    "status": "sent",
    "createdAt": "2025-04-08T19:01:35.000Z",
    "user": {
      "username": "johndoe"
    }
  }
]
```

### Testing Endpoint

#### `POST /api/testing/send-email`
Test endpoint for sending emails without authentication.

**Request Body:**
```json
{
  "userId": "user_clerk_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

## Email Generation Process

1. **User Context Retrieval**:
   - The system retrieves the user's structured summary from the database.

2. **Content Generation**:
   - Using the LLM, the system generates a personalized subject line and HTML content.
   - The prompt includes the user's structured summary data.

3. **Email Template**:
   - The generated content is merged into an HTML template.
   - Templates are stored in `backend/src/emailTemplates/`.

4. **Email Sending**:
   - SendGrid API is used to deliver the email.
   - Email logs are stored in the database.

## Error Handling

The API endpoints return proper error status codes and messages for:
- Missing user ID
- User not found
- Missing structured summary
- Email sending failures

All email attempts (successful and failed) are logged in the `EmailLog` table.

## Development & Testing

You can use the `/api/testing/send-email` endpoint during development to test email functionality without authentication. This is useful for testing the email generation and delivery process.

For production use, it's recommended to use the authenticated endpoints.