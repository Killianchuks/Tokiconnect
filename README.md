# TOKI CONNECT - Language Learning Platform

TOKI CONNECT is a platform that connects language learners with native-speaking teachers for personalized language lessons.

## Features

- User authentication (students and teachers)
- Teacher profiles and discovery
- Lesson booking and scheduling
- Messaging system
- Reviews and ratings
- Payment processing
- Admin dashboard

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Deployment**: Vercel or self-hosted

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/tokiconnect.git
   cd tokiconnect
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   Edit `.env.local` with your configuration values.

4. Set up the database:
   \`\`\`bash
   npm run db:push
   \`\`\`

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel Deployment

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Configure environment variables in Vercel dashboard.
4. Deploy.

### Self-Hosted Deployment

1. Set up a server with Node.js and PostgreSQL.
2. Clone the repository on your server.
3. Configure environment variables.
4. Run the deployment script:
   \`\`\`bash
   chmod +x deploy.sh
   ./deploy.sh
   \`\`\`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
