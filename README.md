# Customer Success Analytics

A full-stack Customer Success Analytics application built with React, Node.js, and PostgreSQL.

## Tech Stack

- **Frontend**: React with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM

## Project Structure

```
├── frontend/          # React TypeScript frontend
├── backend/           # Node.js Express backend
├── database/          # Database migrations and seeds
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up environment variables (see individual folder READMEs)

3. Set up the database:
```bash
npm run db:migrate
```

4. Generate Prisma client:
```bash
npm run db:generate
```

### Development

Run frontend and backend in development mode:

```bash
# Frontend (runs on http://localhost:3000)
npm run dev:frontend

# Backend (runs on http://localhost:5000)
npm run dev:backend

# Database Studio
npm run db:studio
```

### Building for Production

```bash
npm run build:frontend
npm run build:backend
```

## Features

- Customer analytics dashboard
- Success metrics tracking
- Data visualization
- User management
- Real-time updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
