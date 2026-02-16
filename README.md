# Flight Search Web Application

A modern flight search application similar to Google Flights, built with React, TypeScript, Node.js, and the Amadeus Flight API. Search for flights by date and compare options from 490+ airlines.

## Features

- 🔍 **Flight Search**: Search flights by origin, destination, date, and passenger count
- ✈️ **Multi-Airline Results**: Compare flights from hundreds of airlines via Amadeus API
- 💨 **Fast Performance**: Response caching with 15-minute TTL for optimal speed
- 🎨 **Modern UI**: Clean, responsive interface inspired by Google Flights
- 🔐 **Secure**: API keys never exposed to frontend, rate limiting enabled
- 📊 **Sorting & Filtering**: Sort by price, duration, or departure time

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (React Query) for state management
- Tailwind CSS for styling
- Axios for HTTP requests
- date-fns for date formatting

**Backend:**
- Node.js + Express + TypeScript
- Amadeus Self-Service API for flight data
- In-memory caching (node-cache)
- Rate limiting (express-rate-limit)
- CORS enabled

## Prerequisites

- Node.js 18+ and npm
- Amadeus API credentials (free tier available)

## Getting Started

### 1. Get Amadeus API Credentials

1. Go to [developers.amadeus.com](https://developers.amadeus.com)
2. Create a free account
3. Create a new app in the dashboard
4. Copy your API Key and API Secret

### 2. Clone and Setup Backend

```bash
# Navigate to backend directory
cd flight-search-app/backend

# Install dependencies (already done if you ran initial setup)
npm install

# Create .env file from example
cp .env.example .env

# Edit .env and add your Amadeus credentials
# Required variables:
#   AMADEUS_API_KEY=your_api_key_here
#   AMADEUS_API_SECRET=your_api_secret_here
nano .env  # or use your preferred editor
```

### 3. Setup Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies (already done if you ran initial setup)
npm install

# The .env file is already created with the correct settings
# It points to http://localhost:3001/api by default
```

### 4. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```

The backend will start on [http://localhost:3001](http://localhost:3001)

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will start on [http://localhost:5173](http://localhost:5173)

### 5. Use the Application

1. Open [http://localhost:5173](http://localhost:5173) in your browser
2. Enter flight search details:
   - **From**: 3-letter IATA airport code (e.g., LAX, JFK, ORD)
   - **To**: 3-letter IATA airport code
   - **Date**: Future departure date
   - **Passengers**: Number of adults (1-9)
3. Click "Search Flights"
4. Browse results sorted by price, duration, or departure time

## Project Structure

```
flight-search-app/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── services/          # Amadeus API & cache service
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Error handling, validation, rate limiting
│   │   ├── routes/           # API routes
│   │   ├── types/            # TypeScript interfaces
│   │   ├── utils/            # Response normalizer
│   │   └── server.ts         # Express app setup
│   ├── .env                  # Environment variables (create from .env.example)
│   ├── .env.example          # Example environment variables
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                  # React application
    ├── src/
    │   ├── components/       # React components
    │   ├── hooks/           # Custom hooks (useFlightSearch)
    │   ├── services/        # API client (Axios)
    │   ├── types/           # TypeScript interfaces
    │   ├── utils/           # Formatters and validators
    │   ├── App.tsx          # Main app component
    │   ├── main.tsx         # Entry point
    │   └── index.css        # Tailwind CSS
    ├── .env                  # Frontend environment variables
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

## API Endpoints

### Backend API

**Base URL**: `http://localhost:3001/api`

#### POST `/flights/search`
Search for flights

**Request Body:**
```json
{
  "origin": "LAX",
  "destination": "JFK",
  "departureDate": "2026-03-15",
  "adults": 1,
  "travelClass": "ECONOMY"
}
```

**Response:**
```json
{
  "success": true,
  "data": [/* array of flights */],
  "cached": false,
  "count": 50
}
```

#### GET `/flights/health`
Check API and Amadeus connection health

#### GET `/flights/cache/stats`
Get cache statistics (for debugging)

#### POST `/flights/cache/clear`
Clear cache (for debugging)

## Common IATA Airport Codes

- **LAX** - Los Angeles
- **JFK** - New York (Kennedy)
- **ORD** - Chicago (O'Hare)
- **ATL** - Atlanta
- **DFW** - Dallas/Fort Worth
- **SFO** - San Francisco
- **MIA** - Miami
- **SEA** - Seattle
- **BOS** - Boston
- **LAS** - Las Vegas

[Full list of codes](https://en.wikipedia.org/wiki/List_of_airports_by_IATA_airport_code:_A)

## Configuration

### Backend Environment Variables

See `backend/.env.example` for all available options:

- `AMADEUS_API_KEY` - Your Amadeus API key (required)
- `AMADEUS_API_SECRET` - Your Amadeus API secret (required)
- `AMADEUS_BASE_URL` - API base URL (test or production)
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)

### Cache Configuration

- **TTL**: 15 minutes (900 seconds)
- **Check Period**: 2 minutes
- **Storage**: In-memory (node-cache)

### Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP per window

## Troubleshooting

### "Failed to authenticate with Amadeus API"
- Verify your API credentials in `backend/.env`
- Check if your Amadeus API subscription is active
- Ensure you're using the test environment URL for test credentials

### "Network error" or "Connection failed"
- Ensure backend is running on port 3001
- Check CORS settings in backend/.env
- Verify frontend .env has correct API_BASE_URL

### "No flights found"
- Try different airports or dates
- Verify airport codes are valid 3-letter IATA codes
- Check Amadeus API quota hasn't been exceeded

### Build Errors
```bash
# Backend: Clear node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend: Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Development

### Backend Development
```bash
cd backend
npm run dev    # Start with auto-reload
npm run build  # Compile TypeScript
npm start      # Run compiled version
```

### Frontend Development
```bash
cd frontend
npm run dev    # Start dev server
npm run build  # Build for production
npm run preview # Preview production build
```

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use production Amadeus URL: `https://api.amadeus.com`
3. Switch to production API credentials
4. Deploy to: Heroku, Railway, Render, or AWS

### Frontend
1. Update `VITE_API_BASE_URL` to production backend URL
2. Run `npm run build`
3. Deploy `dist/` folder to: Vercel, Netlify, or CloudFlare Pages

## Amadeus API Limits

**Test Environment (Free Tier):**
- 2,000 API calls/month
- 10 requests/second
- Rate limiting may apply

**Production Environment:**
- Varies by subscription tier
- Higher rate limits
- SLA guarantees

## Future Enhancements

- [ ] Return flights (round-trip)
- [ ] Multi-city searches
- [ ] Filter by airline, stops, price range
- [ ] User accounts and saved searches
- [ ] Price alerts
- [ ] Booking integration
- [ ] Calendar view with price trends
- [ ] Additional APIs (Duffel, Skyscanner) for comparison

## License

MIT

## Support

For issues or questions:
- Amadeus API Documentation: [developer.amadeus.com/docs](https://developer.amadeus.com/docs)
- Report bugs: Create an issue in this repository

---

Built with ❤️ using React, TypeScript, and Amadeus API
