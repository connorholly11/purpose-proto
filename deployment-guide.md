# AI Companion Deployment Guide for Internal Testing

This guide provides simple instructions for deploying the AI Companion prototype for internal testing between the three cofounders.

## Local Deployment for Testing

The simplest way to test the application internally is to run both the backend and frontend locally:

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd my-companion-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root directory with:
   ```
   OPENAI_API_KEY=your_openai_api_key
   HUME_API_KEY=your_hume_api_key
   HUME_SECRET_KEY=your_hume_secret_key
   ```

4. **Start the backend server**:
   ```bash
   npm start
   ```

The backend server will run on http://localhost:3002.

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd my-companion-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env.local` file** with:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3002
   ```

4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```

The frontend application will run on http://localhost:3000 (or another port if 3000 is in use).

## Simple Production Deployment Options

For a more persistent setup that all three cofounders can access:

### Option 1: Deploy on a Shared Server or VPS

1. **Set up a VPS** (e.g., DigitalOcean Droplet, AWS EC2, etc.)

2. **Install Node.js and npm** on the server

3. **Clone the repository** to the server

4. **Set up the backend and frontend** following the local deployment steps above

5. **Use PM2 to keep the servers running**:
   ```bash
   npm install -g pm2
   cd my-companion-backend
   pm2 start server.js
   cd ../my-companion-frontend
   pm2 start npm -- start
   ```

6. **Set up a simple nginx reverse proxy** to route traffic to both servers

### Option 2: Use Ngrok for Temporary Public URLs

For quick testing without a permanent setup:

1. **Install ngrok**:
   ```bash
   npm install -g ngrok
   ```

2. **Run the backend and frontend locally** as described above

3. **Create public URLs with ngrok**:
   ```bash
   # For the backend
   ngrok http 3002
   
   # For the frontend
   ngrok http 3000
   ```

4. **Share the ngrok URLs** with the other cofounders

## Sharing the Application

1. **Share the application URL** with the other cofounders

2. **Ensure all cofounders have the necessary API keys** if they want to run the application locally

3. **Create a shared document** with any testing notes or feedback

## Troubleshooting Common Issues

- **API Key Errors**: Verify that all environment variables are correctly set
- **CORS Errors**: If testing across different domains, ensure CORS is properly configured
- **Connection Issues**: Check that the backend URL is correctly set in the frontend environment variables
- **Port Conflicts**: If ports are already in use, change them in the server configuration

## Security Notes for Internal Testing

- Even for internal testing, avoid committing API keys to the repository
- Use environment variables for all sensitive information
- Be mindful of API usage costs, especially for OpenAI and Hume services
