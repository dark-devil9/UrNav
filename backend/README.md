# URNAV Backend

## Setup

### Environment Variables

To use the full functionality, you need to set these environment variables:

```bash
# Foursquare API Configuration
# Get your API key from: https://developer.foursquare.com/
FOURSQUARE_API_KEY=your_foursquare_api_key_here

# Mistral AI API Configuration  
# Get your API key from: https://console.mistral.ai/
MISTRAL_API_KEY=your_mistral_api_key_here
```

### Without API Keys

If you don't have API keys, the application will still work but will use fallback demo data for:
- Place recommendations
- AI-generated responses
- Location-based services

### Running the Backend

```bash
# Using Docker Compose (recommended)
docker compose up -d

# Or build and run manually
docker build -t urnav-backend backend/
docker run -p 8000:8000 urnav-backend
```

## API Endpoints

- `GET /docs` - Interactive API documentation
- `POST /auth/signup` - User registration
- `POST /auth/login` - User authentication
- `GET /modes/explorer` - Explore nearby attractions, food, and parks
- `GET /modes/free-places` - Find free places nearby
- `POST /modes/plan-day` - Plan your day with AI
- `POST /modes/meet-friend` - Find meeting spots
- `GET /places/search` - Search for places
- `GET /places/{place_id}` - Get place details
- `GET /places/{place_id}/photos` - Get place photos
- `GET /places/{place_id}/tips` - Get place tips
- `GET /ws/chat` - WebSocket chat endpoint

## Features

- **Authentication**: JWT-based user management
- **Geolocation**: Location-aware place recommendations
- **AI Integration**: LLM-powered responses and task parsing
- **Place Discovery**: Foursquare API integration for real places
- **Fallback Data**: Demo data when APIs are unavailable
- **Real-time Chat**: WebSocket-based chat interface
