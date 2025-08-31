# UrNav Startup Instructions

## Quick Start with Docker

### Prerequisites
- Docker Desktop installed and running
- Ports 5432 and 8000 available

### Start the Application

1. **Start Backend & Database:**
   ```bash
   cd backend
   docker-compose up
   ```
   This will start:
   - PostgreSQL database on port 5432
   - FastAPI backend on port 8000

2. **Start Frontend:**
   ```bash
   cd urnav-app
   pnpm install
   pnpm dev
   ```
   Frontend will be available at: http://localhost:3000

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Test API Page**: http://localhost:3000/test-api
- **Test Select Component**: http://localhost:3000/test-select

## Docker Commands

### Start Services
```bash
cd backend
docker-compose up
```

### Start in Background
```bash
cd backend
docker-compose up -d
```

### View Logs
```bash
cd backend
docker-compose logs -f
```

### Stop Services
```bash
cd backend
docker-compose down
```

### Rebuild and Start
```bash
cd backend
docker-compose up --build
```

## Troubleshooting

### Docker Issues
- Ensure Docker Desktop is running
- Check if ports 5432 and 8000 are available
- Restart Docker Desktop if needed
- Check Docker logs: `docker-compose logs`

### Backend Issues
- Verify containers are running: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`
- Check database logs: `docker-compose logs db`

### Frontend Issues
- Ensure backend is running on port 8000
- Check browser console for API errors
- Verify all dependencies are installed

## API Testing

Visit http://localhost:3000/test-api to test the backend API endpoints:
- Geocoding API
- Meet Friend API
- Other endpoints

## Features

- **Meet a Friend**: Find meeting spots between two locations
- **Plan Day**: Create optimized day plans
- **Explorer**: Discover places around you
- **Free Places**: Find free activities and venues

## Support

If you encounter issues:
1. Check Docker container status: `docker-compose ps`
2. View container logs: `docker-compose logs [service-name]`
3. Test API endpoints using the test page
4. Check browser developer tools for frontend errors
5. Restart services: `docker-compose restart`
