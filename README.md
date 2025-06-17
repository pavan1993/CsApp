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

**Option 1: Local Development**
- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

**Option 2: Docker Development**
- Docker (v20.10 or higher)
- Docker Compose (v2.0 or higher)

### Installation

**Option 1: Local Development**

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

**Option 2: Docker Development**

1. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration (the defaults work for development)
```

**Important**: The `.env.example` file contains all the necessary environment variables. For development, you can use it as-is, but make sure to change the passwords and secrets for production use.

2. Start all services:
```bash
# Start with logs (recommended for first run)
docker-compose up

# Or start in background
docker-compose up -d
```

3. Wait for services to be healthy, then run database setup:
```bash
# Check service status
docker-compose ps

# Generate Prisma client and run migrations
docker-compose exec backend npx prisma generate
docker-compose exec backend npx prisma db push

# Optional: Seed database with sample data
docker-compose exec backend npm run seed
```

### Development

**Local Development:**

```bash
# Frontend (runs on http://localhost:3000)
npm run dev:frontend

# Backend (runs on http://localhost:5000)
npm run dev:backend

# Database Studio
npm run db:studio
```

**Docker Development:**

```bash
# Start all services with logs
docker-compose up

# Start services in background
docker-compose up -d

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Stop services
docker-compose down

# Stop and remove volumes (careful - deletes data!)
docker-compose down -v

# Rebuild and start (after code changes)
docker-compose up --build

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Execute commands in containers
docker-compose exec backend npm run db:studio
docker-compose exec backend npm run db:migrate
docker-compose exec postgres psql -U postgres -d customer_success_db

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh
```

**Service URLs (Development):**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Database: localhost:5432
- Redis: localhost:6379

### Building for Production

**Local Build:**

```bash
npm run build:frontend
npm run build:backend
```

**Docker Production Deployment:**

1. Set up production environment variables:
```bash
cp .env.example .env
# Configure production values (secure passwords, proper URLs, etc.)
```

2. Build and deploy:
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Check service health
docker-compose -f docker-compose.prod.yml ps

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
```

3. Run database setup (first time only):
```bash
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
```

**Production Service URLs:**
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:5000
- HTTPS: https://localhost (port 443, if SSL configured)

**Individual Container Builds:**
```bash
# Build individual images
docker build -t customer-success-frontend ./frontend
docker build -t customer-success-backend .

# Run individual containers
docker run -p 3000:80 customer-success-frontend
docker run -p 5000:5000 customer-success-backend
```

## Docker Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check Docker daemon is running
docker --version
docker-compose --version

# Check for port conflicts (ports 3000, 3001, 5432, 6379 must be free)
# Windows:
netstat -an | findstr :3000
netstat -an | findstr :3001
netstat -an | findstr :5432
netstat -an | findstr :6379

# Mac/Linux:
lsof -i :3000
lsof -i :3001
lsof -i :5432
lsof -i :6379
```

**Database connection issues:**
```bash
# Check PostgreSQL health
docker-compose exec postgres pg_isready -U postgres

# Connect to database directly
docker-compose exec postgres psql -U postgres -d customer_success_db

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend npm run db:migrate
```

**Frontend build issues:**
```bash
# Clear node_modules and rebuild
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

**Backend API issues:**
```bash
# Check backend logs
docker-compose logs backend

# Restart backend service
docker-compose restart backend

# Check environment variables
docker-compose exec backend env | grep -E "(DATABASE_URL|NODE_ENV|PORT)"
```

**"Cannot connect to backend" errors:**
```bash
# Check if backend is running and healthy
docker-compose logs backend

# Backend should be accessible at http://localhost:3001/api/health
curl http://localhost:3001/api/health

# If backend fails to start, check database connection
docker-compose logs postgres
docker-compose exec postgres pg_isready -U postgres
```

**Frontend shows "Network Error":**
```bash
# Check if VITE_API_URL is correctly set in .env
docker-compose exec frontend env | grep VITE_API_URL

# Should show: VITE_API_URL=http://localhost:3001/api
# If not, update your .env file and restart: docker-compose restart frontend
```

**Performance issues:**
```bash
# Check resource usage
docker stats

# Increase Docker memory/CPU limits in Docker Desktop
# Clean up unused containers/images
docker system prune -a
```

### Development Tips

- Use `docker-compose up` (without -d) for first runs to see startup logs
- Backend has hot reloading enabled in development mode
- Frontend changes require container rebuild: `docker-compose build frontend`
- Database data persists in Docker volumes between restarts
- Use `docker-compose down -v` only when you want to reset all data

## Features

- Customer analytics dashboard
- Success metrics tracking
- Data visualization
- User management
- Real-time updates

# Analytics Dashboard - Calculation Formulas

This document describes the standardized calculation formulas used throughout the analytics dashboard to ensure consistency and transparency in metrics computation.

## Core Metrics

### 1. Usage Score (0-100)

The Usage Score represents how well a product area is being utilized compared to its expected or historical usage patterns.

**Formula:**
```
Usage Score = (Current Usage / Reference Value) × 100
```

**Reference Value Options:**
- **Historical Average** (default): Average usage over a historical period
- **Expected Maximum**: Theoretical maximum expected usage

**Implementation:**
- Scores are capped at 150% to show over-performance while maintaining readability
- Zero reference values return 0 to avoid division errors
- Negative usage values are treated as 0

**Risk Interpretation:**
- 90-100+: Excellent utilization
- 80-89: Good utilization  
- 70-79: Moderate concern
- <70: Poor utilization requiring attention

### 2. Usage Change Percentage

Represents the percentage change in usage from the previous period to the current period.

**Formula:**
```
Usage Change = ((Current Usage - Previous Usage) / Previous Usage) × 100
```

**Interpretation:**
- Positive values: Usage growth
- Negative values: Usage decline
- Values below -15% typically indicate significant problems

### 3. Technical Debt Score (0-100)

A composite score representing the overall health of a product area. Higher scores indicate more technical debt (worse health).

**Formula:**
```
Technical Debt Score = Severity Score + Usage Decline Penalty + Volume Penalty + Key Module Penalty
```

**Components:**

#### Severity Score (0-40 points)
```
Severity Score = min(40, (Critical×10 + Severe×6 + Moderate×3 + Low×1) / Total Tickets)
```

#### Usage Decline Penalty (0-30 points)
```
Usage Decline Penalty = min(30, |Usage Change| × 0.5) if Usage Change < 0, else 0
```

#### Volume Penalty (0-20 points)
```
Volume Penalty = min(20, Total Tickets × 0.5)
```

#### Key Module Penalty (0-10 points)
```
Key Module Penalty = 10 if (Is Key Module AND Total Tickets > 0), else 0
```

**Risk Categories:**
- 0-30: Good (Green)
- 31-60: Moderate Risk (Yellow)
- 61-85: High Risk (Orange)
- 86-100: Critical (Red)

### 4. Correlation Coefficient

Measures the linear relationship between two datasets (e.g., usage scores vs. ticket counts).

**Formula (Pearson Correlation):**
```
r = (n×ΣXY - ΣX×ΣY) / √[(n×ΣX² - (ΣX)²) × (n×ΣY² - (ΣY)²)]
```

**Interpretation:**
- +1.0: Perfect positive correlation
- 0.0: No linear correlation
- -1.0: Perfect negative correlation
- |r| > 0.7: Strong correlation
- |r| 0.3-0.7: Moderate correlation
- |r| < 0.3: Weak correlation

### 5. Trend Calculation

Calculates percentage change between two time periods for trend analysis.

**Formula:**
```
Trend = ((Recent Period Average - Previous Period Average) / Previous Period Average) × 100
```

**Default Periods:**
- Recent: Last 7 days average
- Previous: 7 days before that (days 8-14)

## Risk Assessment Logic

### Problem Area Identification

A product area is flagged as a "Problem Area" if:
```
(Ticket Count > 35 AND Usage Score < 70) OR Usage Change < -15%
```

### Risk Level Assignment

Risk levels are determined by combining multiple factors:

1. **Critical Risk:**
   - Technical Debt Score ≥ 86, OR
   - Usage drop > 40%, OR
   - Critical tickets > 8

2. **High Risk:**
   - Technical Debt Score 61-85, OR
   - Usage drop 20-40%, OR
   - Critical + Severe tickets > 15

3. **Moderate Risk:**
   - Technical Debt Score 31-60, OR
   - Usage drop 10-20%, OR
   - Total tickets > 35

4. **Good:**
   - Technical Debt Score ≤ 30 AND stable usage

## Data Generation (Demo Mode)

When real data is unavailable, the system generates realistic mock data using:

### Mock Usage Data
```
Usage Value = Base Value + Seasonal Pattern + Random Variation
Seasonal Pattern = sin((day/total_days) × π × 4) × 15
Random Variation = (random - 0.5) × Base Value × Volatility
```

**Parameters:**
- Base Value: 75 (typical baseline)
- Volatility: 0.15-0.2 (15-20% variation)
- Seasonal cycles: 4 complete cycles over the time period

### Mock Ticket Data
```
Ticket Count = Base Tickets + Seasonal Factor + Random Factor
Base Tickets = Weekend ? 15 : 25
Seasonal Factor = sin((day/total_days) × π × 2) × 5
```

## Implementation Notes

### Calculation Utilities

All calculations are centralized in `frontend/src/utils/analyticsCalculations.ts` to ensure:
- Consistency across components
- Easy maintenance and updates
- Proper error handling
- Comprehensive documentation

### Error Handling

- Division by zero returns 0
- Negative values are handled appropriately for each metric
- Missing data uses sensible defaults
- All calculations include bounds checking

### Performance Considerations

- Calculations are memoized where appropriate
- Large datasets use efficient algorithms
- Real-time updates are debounced to prevent excessive recalculation

## Usage Examples

### Calculating Usage Score
```typescript
import { calculateUsageScore } from './utils/analyticsCalculations'

const usageScore = calculateUsageScore({
  currentUsage: 850,
  previousUsage: 900,
  historicalAverage: 1000
})
// Returns: 85 (85% of historical average)
```

### Calculating Technical Debt
```typescript
import { calculateTechnicalDebtScore } from './utils/analyticsCalculations'

const debtScore = calculateTechnicalDebtScore(
  { CRITICAL: 5, SEVERE: 12, MODERATE: 8, LOW: 15 },
  { currentUsage: 850, previousUsage: 900 },
  true // isKeyModule
)
// Returns: Calculated debt score based on formula
```

## Future Enhancements

Planned improvements to the calculation system:

1. **Machine Learning Integration**: Use ML models to predict trends and identify anomalies
2. **Weighted Historical Averages**: Give more weight to recent historical data
3. **Industry Benchmarking**: Compare scores against industry standards
4. **Custom Thresholds**: Allow organizations to set custom risk thresholds
5. **Multi-dimensional Scoring**: Include additional factors like code complexity, deployment frequency

---

For technical implementation details, see the source code in `frontend/src/utils/analyticsCalculations.ts`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
