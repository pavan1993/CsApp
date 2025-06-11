# Database

This folder contains database-related files for the Customer Success Analytics application.

## Setup

1. Make sure PostgreSQL is installed and running
2. Create a database for the application:
   ```sql
   CREATE DATABASE customer_success_db;
   ```

3. Copy the environment variables:
   ```bash
   cp ../backend/.env.example ../backend/.env
   ```

4. Update the `DATABASE_URL` in the `.env` file with your PostgreSQL credentials

5. Run migrations:
   ```bash
   cd ../backend
   npm run db:migrate
   ```

6. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

7. Seed the database with sample data:
   ```bash
   npm run db:seed
   ```

## Database Schema

The application uses the following main entities:

- **Customer**: Core customer information including health scores
- **Interaction**: Customer interactions and touchpoints

## Prisma Commands

From the backend directory:

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with sample data

## Environment Variables

Required environment variables in `backend/.env`:

```
DATABASE_URL="postgresql://username:password@localhost:5432/customer_success_db?schema=public"
```
