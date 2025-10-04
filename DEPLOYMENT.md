# Deployment Guide - Expense Management System

This guide covers deployment options for both backend and frontend applications.

## Prerequisites

- Node.js 18+ (for local deployment)
- Docker and Docker Compose (for containerized deployment)
- MongoDB Atlas account or MongoDB instance
- OpenAI API key
- Exchange Rate API key

## Environment Configuration

### Backend Environment Variables

Copy `.env.example` to `.env` in the `backend` directory and configure:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_super_secret_key_here
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=5000
NODE_ENV=production
```

### Frontend Environment Variables

Copy `.env.example` to `.env.local` in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For production, update `NEXT_PUBLIC_API_URL` to your backend URL.

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Configure environment variables** in `backend/.env`

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Access the applications:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

5. **Stop the services:**
   ```bash
   docker-compose down
   ```

### Option 2: Individual Docker Containers

**Backend:**
```bash
cd backend
docker build -t expense-backend .
docker run -p 5000:5000 --env-file .env expense-backend
```

**Frontend:**
```bash
cd frontend
docker build -t expense-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://backend:5000/api expense-frontend
```

### Option 3: Local Development/Production

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run build
npm start
```

## Cloud Deployment

### Vercel (Frontend)

1. Install Vercel CLI: `npm i -g vercel`
2. In the `frontend` directory: `vercel`
3. Set environment variable: `NEXT_PUBLIC_API_URL=<your-backend-url>`

### Render/Railway/Heroku (Backend)

1. Create a new web service
2. Connect your repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Configure environment variables from `.env.example`

### AWS/DigitalOcean/VPS

1. Install Docker and Docker Compose on your server
2. Clone the repository
3. Configure environment variables
4. Run: `docker-compose up -d`
5. Configure reverse proxy (Nginx/Caddy) for SSL

## Production Checklist

- [ ] Update all environment variables with production values
- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Configure CORS allowed origins in backend
- [ ] Set up SSL/HTTPS certificates
- [ ] Configure proper MongoDB connection string
- [ ] Set up log monitoring and error tracking
- [ ] Configure backup strategy for uploads directory
- [ ] Set up CI/CD pipeline
- [ ] Configure rate limiting and security headers
- [ ] Test all API endpoints in production environment

## Monitoring & Maintenance

### View Logs
```bash
# Docker Compose
docker-compose logs -f [service-name]

# Individual containers
docker logs -f [container-name]
```

### Restart Services
```bash
docker-compose restart [service-name]
```

### Update Application
```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### Backend won't connect to MongoDB
- Verify MongoDB URI is correct
- Check network connectivity
- Ensure MongoDB Atlas IP whitelist includes your server

### Frontend can't reach backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS configuration in backend
- Ensure backend is running and accessible

### File uploads not working
- Verify uploads directory permissions
- Check Docker volume mounts in docker-compose.yml
- Ensure sufficient disk space

## Security Recommendations

1. **Never commit `.env` files** to version control
2. **Use environment-specific configurations**
3. **Implement rate limiting** on API endpoints
4. **Enable HTTPS** in production
5. **Regularly update dependencies**
6. **Set up automated backups**
7. **Monitor logs** for suspicious activity
8. **Use secrets management** (AWS Secrets Manager, HashiCorp Vault)

## Support

For issues or questions, please create an issue in the repository.
