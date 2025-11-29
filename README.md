# FlowLogic WMS UI

A modern, feature-rich Warehouse Management System (WMS) user interface built with React, TypeScript, and Vite. This application provides comprehensive warehouse operations management including inventory control, order fulfillment, receiving, shipping, labor management, and AI-assisted operations.

## Features

- **Dashboard** - Real-time warehouse metrics and KPIs
- **Inventory Management** - Track stock levels, locations, and movements
- **Order Processing** - Manage customer orders and fulfillment
- **Receiving & Shipping** - Inbound/outbound logistics management
- **Dock Scheduling** - Appointment management for dock doors
- **Labor Management** - Workforce scheduling and productivity tracking
- **AI Assistant (Flow)** - Intelligent assistant for warehouse operations
- **100+ Transaction Screens** - Comprehensive WMS functionality

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
│   │   ├── AIAssistant/      # AI assistant module (refactored)
│   │   ├── Header.tsx        # Application header
│   │   └── Sidebar.tsx       # Navigation sidebar
│   ├── config/
│   │   └── navigation.ts     # Navigation menu configuration
│   ├── pages/                # Page components (100+)
│   ├── routes/
│   │   └── index.tsx         # Route definitions
│   ├── services/
│   │   └── aiService.ts      # AI backend integration
│   ├── store/
│   │   └── useWMSStore.ts    # Zustand global state
│   ├── __tests__/            # Test files
│   │   ├── components/
│   │   └── store/
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── middleware/           # Express middleware
│   │   ├── errorHandler.js   # Centralized error handling
│   │   └── validate.js       # Zod validation middleware
│   ├── schemas/              # Zod validation schemas
│   │   ├── common.js
│   │   ├── inventory.js
│   │   ├── orders.js
│   │   └── docks.js
│   └── index.js              # Express server entry
├── jest.config.js            # Jest configuration
└── vite.config.ts            # Vite configuration
```

## Key Components

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
- `MessageBubble.tsx` - Message rendering
- `AnalysisResultCard.tsx` - Analysis display
- `SuggestedActionsCard.tsx` - Action buttons

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

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

### Backend (server/.env)
```
PORT=3001
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
