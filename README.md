# Grep-Test or Delta 
A modern full-stack web application built with Next.js 14, MongoDB, and GitHub authentication using NextAuth.js.

To build it fast I have created architecture.md and scratchpad.md

architecture md works as a highlevel context for AI and sracthpad.md works as a more granual stuff I am working on
Using both allows AI to stay on track and help me ship things faster.

I review all the changes and update platform accordingly

## 🚀 Live Demo & Platform

- **🎥 Demo Video**: [Watch the Demo](https://www.loom.com/share/ef9e272553ce4334b7c5e5a84331d5b5)
- **🌐 Live Platform**: [https://grep-test.vercel.app/](https://grep-test.vercel.app/)

## Features

- 🔐 **GitHub OAuth Authentication** - Secure login with GitHub using NextAuth.js
- 📊 **MongoDB Integration** - Data persistence with MongoDB and session management
- ⚡ **Next.js 14 App Router** - Latest Next.js with App Router and React Server Components
- 🎨 **Modern UI with Tailwind CSS** - Beautiful, responsive design
- 🔒 **Session Management** - Persistent user sessions with database storage
- 📱 **Responsive Design** - Mobile-first responsive interface
- 🤖 **AI-Powered Changelog Generation** - Automated changelog creation using OpenAI

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Database**: MongoDB with MongoDB Adapter
- **Authentication**: NextAuth.js with GitHub Provider
- **AI Integration**: OpenAI for changelog generation
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Prerequisites

Before running this application, you need:

1. **Node.js** (v18 or higher)
2. **MongoDB** (local installation or MongoDB Atlas account)
3. **GitHub OAuth App** for authentication
4. **OpenAI API Key** for changelog generation

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd greptile
npm install
```

### 2. Environment Variables

**📧 Need Environment Variables?** If you want to run this locally, feel free to ask me for the environment variables - I can provide you with the necessary credentials to get started quickly.

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/greptile
# For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/greptile?retryWrites=true&w=majority

# OpenAI Configuration (for changelog generation)
OPENAI_API_KEY=your-openai-api-key

# JWT Secret
JWT_SECRET=your-jwt-secret-key
```

**Important**: Replace the placeholder values with your actual credentials:
- Generate a random string for `NEXTAUTH_SECRET` (32+ characters)
- Use your GitHub OAuth app credentials
- Use your MongoDB connection string
- Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Generate a random string for `JWT_SECRET`

### 3. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Create a database named `greptile`

#### Option B: MongoDB Atlas (Recommended)
1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string

### 4. GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy the **Client ID** and **Client Secret**

### 5. OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the API key and add it to your `.env.local` file

### 6. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/    # NextAuth.js API routes
│   ├── auth/                      # Authentication pages
│   │   ├── signin/               # Custom sign-in page
│   │   └── error/                # Authentication error page
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Homepage
├── components/
│   └── SessionProvider.tsx       # NextAuth session provider wrapper
├── lib/
│   └── mongodb.ts               # MongoDB connection utility
└── types/
    └── next-auth.d.ts           # NextAuth type extensions
```

## API Routes

- `GET/POST /api/auth/[...nextauth]` - NextAuth.js authentication endpoints
- `GET/POST /api/repositories/changelogs/generate` - OpenAI-powered changelog generation
- Built-in NextAuth.js routes for sign-in, sign-out, and callbacks

## Authentication Flow

1. User clicks "Sign In with GitHub"
2. Redirected to GitHub OAuth
3. User authorizes the application
4. GitHub redirects back with authorization code
5. NextAuth.js exchanges code for access token
6. User session is created and stored in MongoDB
7. User is redirected to the homepage

## Database Schema

NextAuth.js automatically creates the following collections in MongoDB:
- `accounts` - OAuth account information
- `sessions` - User session data
- `users` - User profile information
- `verification_tokens` - Email verification tokens

## Deployment

### Environment Variables for Production

Update your `.env.local` (or deployment environment) with production values:

```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
GITHUB_CLIENT_ID=your-production-github-client-id
GITHUB_CLIENT_SECRET=your-production-github-client-secret
MONGODB_URI=your-production-mongodb-uri
OPENAI_API_KEY=your-production-openai-api-key
```

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check your `MONGODB_URI` is correct
   - Ensure MongoDB is running (if local)
   - Check network access (if using Atlas)

2. **GitHub OAuth Error**
   - Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
   - Check OAuth app callback URL matches your domain
   - Ensure `NEXTAUTH_URL` is correct

3. **NextAuth Session Error**
   - Verify `NEXTAUTH_SECRET` is set
   - Check if MongoDB collections are created properly

4. **OpenAI Changelog Generation Error**
   - Verify `OPENAI_API_KEY` is correct and valid
   - Check your OpenAI API usage limits
   - Ensure you have sufficient credits in your OpenAI account

### Environment Variables

Make sure all required environment variables are set:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `MONGODB_URI`
- `OPENAI_API_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.