# FlowLogic AI Intelligence Platform

A modern, AI-powered Warehouse Management System (WMS) with advanced analytics, anomaly detection, and intelligent forecasting. Built with React, TypeScript, and Vite on the frontend, with a Node.js/Express backend featuring production-ready AI engines.

## Features

### Core WMS Functionality
- **Dashboard** - Real-time warehouse metrics and KPIs
- **Inventory Management** - Track stock levels, locations, and movements
- **Order Processing** - Manage customer orders and fulfillment
- **Receiving & Shipping** - Inbound/outbound logistics management
- **Dock Scheduling** - Appointment management for dock doors
- **Labor Management** - Workforce scheduling and productivity tracking
- **100+ Transaction Screens** - Comprehensive WMS functionality

### AI Intelligence Platform
- **Demand Forecasting** - Ensemble statistical methods (SMA, WMA, exponential smoothing, trend analysis) with confidence intervals
- **Anomaly Detection** - Multi-method detection (Z-score, IQR, MAD) for identifying inventory discrepancies
- **Pattern Recognition** - Temporal, behavioral, and correlation pattern analysis
- **AI Recommendations** - Actionable insights prioritized by severity
- **AI Assistant (Flow)** - Natural language interface for warehouse operations

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Icons**: Lucide React
- **Testing**: Jest, React Testing Library
- **Backend**: Express.js with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/flowlogic-ui.git
cd flowlogic-ui
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd server
npm install
cd ..
```

4. Set up environment variables:
```bash
# Create .env file in root directory
cp .env.example .env

# Create .env file in server directory
cp server/.env.example server/.env
```

### Development

Start the frontend development server:
```bash
npm run dev
```

Start the backend server (in a separate terminal):
```bash
cd server
node index.js
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Running Tests

```bash
npm test
```

## Project Structure

```
flowlogic-ui/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── AIAssistant/      # AI assistant module
│   │   ├── alerts/           # Alert page components
│   │   ├── integrations/     # Integration page components
│   │   ├── Header.tsx        # Application header
│   │   └── Sidebar.tsx       # Navigation sidebar
│   ├── config/
│   │   └── navigation.ts     # Navigation menu configuration
│   ├── constants/            # Application constants
│   │   └── wmsConnectors.ts  # WMS connector definitions
│   ├── hooks/                # Custom React hooks
│   │   ├── useAlerts.ts      # Alert data fetching
│   │   ├── useAIAnalysis.ts  # AI analysis hooks
│   │   └── useIntegrations.ts # Integration hooks
│   ├── pages/                # Page components (100+)
│   ├── routes/
│   │   └── index.tsx         # Route definitions
│   ├── services/
│   │   └── aiService.ts      # AI backend integration
│   ├── store/
│   │   └── useWMSStore.ts    # Zustand global state
│   ├── types/                # TypeScript type definitions
│   │   ├── alerts.ts
│   │   └── integrations.ts
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── __tests__/            # Backend tests
│   │   ├── ai-engine.test.js # AI engine tests
│   │   └── routes/           # Route tests
│   ├── middleware/           # Express middleware
│   │   ├── authMiddleware.js # JWT authentication
│   │   ├── errorHandler.js   # Centralized error handling
│   │   └── validate.js       # Zod validation middleware
│   ├── modules/
│   │   └── ai-engine/        # AI engine implementations
│   │       └── index.js      # Forecasting, anomaly detection, etc.
│   ├── routes/               # API route handlers
│   │   ├── ai.js             # AI endpoints
│   │   ├── alerts.js
│   │   ├── orders.js
│   │   └── tasks.js
│   ├── schemas/              # Zod validation schemas
│   └── index.js              # Express server entry
├── prisma/
│   └── schema.prisma         # Database schema
└── vite.config.ts            # Vite configuration
```

## Key Components

### AI Engine (`server/modules/ai-engine/`)

Production-ready statistical AI engines for warehouse intelligence:

| Engine | Purpose | Methods |
|--------|---------|---------|
| **ForecastingEngine** | Demand prediction | SMA, WMA, Exponential Smoothing, Linear Trend, Seasonality Detection |
| **AnomalyDetectionEngine** | Outlier identification | Z-Score, IQR, MAD (requires 2+ methods for confirmation) |
| **PatternRecognitionEngine** | Behavior analysis | Temporal, Behavioral, Correlation patterns |
| **RecommendationEngine** | Action prioritization | Severity-based recommendations from analysis |

#### API Endpoints

```
POST /api/ai/forecast         # Generate demand forecasts
POST /api/ai/anomaly-detection # Detect inventory anomalies
POST /api/ai/pattern-analysis # Analyze transaction patterns
POST /api/ai/recommendations  # Get AI recommendations
GET  /api/ai/health          # Check AI engine status
GET  /api/ai/dashboard       # AI dashboard summary
```

### AI Assistant (Flow)

The AI assistant provides intelligent warehouse operations support:
- Natural language queries about inventory, orders, and operations
- Proactive alerts and predictions
- Automated action suggestions
- Real-time system insights

Components:
- `index.tsx` - Main orchestration and state management
- `ChatTab.tsx` - Chat interface
- `InsightsTab.tsx` - Analytics dashboard
- `AlertsTab.tsx` - Alert management

### Navigation

The sidebar navigation is configured in `src/config/navigation.ts`:
- 14 menu groups with 100+ pages
- Transaction codes for quick access (Ctrl+K command palette)
- Role-based menu structure

### State Management

Global state is managed with Zustand in `src/store/useWMSStore.ts`:
- Sidebar state
- Dark mode preference
- Alerts
- Selected SKU
- Warehouse metrics
- Filters

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Pages   │  │Components│  │  Hooks   │  │  State (Zustand) │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼─────────────┼─────────────┼─────────────────┼───────────┘
        │             │             │                 │
        └─────────────┴──────┬──────┴─────────────────┘
                             │ HTTP/REST
        ┌────────────────────▼────────────────────────┐
        │              API Gateway                     │
        │         (Express.js + Middleware)            │
        │  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
        │  │   Auth   │  │ Validate │  │  Error    │  │
        │  │Middleware│  │  (Zod)   │  │ Handler   │  │
        │  └──────────┘  └──────────┘  └───────────┘  │
        └────────────────────┬────────────────────────┘
                             │
        ┌────────────────────▼────────────────────────┐
        │              Route Handlers                  │
        │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐  │
        │  │   AI   │ │ Orders │ │ Alerts │ │ Tasks│  │
        │  └───┬────┘ └───┬────┘ └───┬────┘ └──┬───┘  │
        └──────┼──────────┼──────────┼─────────┼──────┘
               │          │          │         │
        ┌──────▼──────────▼──────────▼─────────▼──────┐
        │              AI Engine Module                │
        │  ┌───────────┐ ┌───────────┐ ┌───────────┐  │
        │  │Forecasting│ │ Anomaly   │ │  Pattern  │  │
        │  │  Engine   │ │ Detection │ │Recognition│  │
        │  └───────────┘ └───────────┘ └───────────┘  │
        └─────────────────────┬───────────────────────┘
                              │
        ┌─────────────────────▼───────────────────────┐
        │           Database (PostgreSQL/Prisma)       │
        └─────────────────────────────────────────────┘
```

## Security

The application implements multiple security layers:

### Authentication & Authorization
- JWT-based authentication with secure token handling
- Role-based access control (ADMIN, MANAGER, OPERATOR, VIEWER)
- Company-scoped data isolation

### Input Validation
- Zod schemas for all API request validation
- Parameterized queries via Prisma ORM (SQL injection prevention)
- Request size limits and rate limiting ready

### Security Headers
- Helmet.js middleware for HTTP security headers
- CORS configuration for allowed origins
- XSS protection via content security policy

### Best Practices
- Environment variables for secrets (never committed)
- Secure password hashing with bcrypt
- Audit logging for sensitive operations

## API Validation

The backend uses Zod for request validation:

```typescript
// Example validation schema
import { z } from 'zod';

export const inventoryAdjustmentSchema = z.object({
  locationId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int(),
  reason: z.enum(['CYCLE_COUNT', 'DAMAGE', 'RECEIVING_ERROR', 'OTHER']),
  notes: z.string().optional(),
});
```

## Testing

Tests are written with Jest and React Testing Library:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

## Database

The application uses PostgreSQL with Prisma ORM:

```bash
# Initialize database (first time setup)
npx prisma db push

# Generate Prisma client after schema changes
npx prisma generate

# Seed the database with sample data
node prisma/seed.js

# Open Prisma Studio (database GUI)
npx prisma studio
```

Key models:
- **User** - Authentication and role management
- **Company** - Multi-tenant data isolation
- **Product** - Inventory items with SKU tracking
- **Order** - Customer orders and fulfillment
- **Task** - Warehouse work assignments
- **Alert** - System notifications and warnings

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

### Backend (server/.env)
```
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/flowlogic
JWT_SECRET=your_jwt_secret
ANTHROPIC_API_KEY=your_api_key
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Acknowledgments

- Built with [React](https://react.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)
- Charts powered by [Recharts](https://recharts.org/)
