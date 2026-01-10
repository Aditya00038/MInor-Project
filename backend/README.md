# README for Backend Setup
# CitizenApp FastAPI Backend

## Quick Start

1. Create virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create .env file:
```bash
copy .env.example .env
# Edit .env with your database credentials
```

5. Run server:
```bash
python -m uvicorn main:app --reload
```

6. Open in browser:
```
http://localhost:8000/docs  # API Documentation
```

## Project Structure

```
backend/
├── main.py              # FastAPI app configuration
├── database.py          # MySQL connection management
├── schemas.py           # Pydantic data models
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
├── .env                 # Your configuration (create from .env.example)
└── routes/
    ├── __init__.py
    ├── auth.py          # Authentication endpoints
    ├── users.py         # User endpoints
    ├── reports.py       # Report CRUD endpoints
    └── donations.py     # Donation CRUD endpoints
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user

### Users
- `GET /api/users/` - Get all users
- `GET /api/users/{user_id}` - Get user by ID
- `GET /api/users/email/{email}` - Get user by email
- `GET /api/users/role/worker` - Get all workers
- `GET /api/users/leaderboard/top` - Get leaderboard
- `POST /api/users/{user_id}/points/{points}` - Add points to user

### Reports
- `GET /api/reports/` - Get all reports (with filtering)
- `GET /api/reports/{report_id}` - Get report by ID
- `GET /api/reports/city/{city}` - Get reports by city
- `POST /api/reports/` - Create new report
- `PUT /api/reports/{report_id}` - Update report
- `DELETE /api/reports/{report_id}` - Delete report
- `GET /api/reports/leaderboard/top` - Get leaderboard from reports

### Donations
- `GET /api/donations/` - Get all donations (with filtering)
- `GET /api/donations/{donation_id}` - Get donation by ID
- `GET /api/donations/category/{category}` - Get donations by category
- `GET /api/donations/available/all` - Get all available donations
- `POST /api/donations/` - Create new donation
- `PUT /api/donations/{donation_id}` - Update donation
- `DELETE /api/donations/{donation_id}` - Delete donation

## Environment Variables

Create a `.env` file with:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=citizen_app_db
DB_PORT=3306

# Backend Configuration
PORT=8000
ENV=development

# JWT Configuration (Optional)
JWT_SECRET_KEY=your_secret_key_here_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176
```

## Database Connection

The backend connects to MySQL using `mysql-connector-python`. Make sure:

1. MySQL Server is running
2. Database `citizen_app_db` is created
3. Tables are created using `database/schema.sql`
4. Environment variables are set correctly in `.env`

## Testing API

Open http://localhost:8000/docs for interactive API documentation and testing.

Or use curl:

```bash
# Get all users
curl http://localhost:8000/api/users/

# Get leaderboard
curl http://localhost:8000/api/users/leaderboard/top

# Create report
curl -X POST http://localhost:8000/api/reports/ \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Pothole",
    "description": "Large pothole",
    "location_text": "Mumbai, Maharashtra, India"
  }'
```

## Security Notes

- Replace JWT_SECRET_KEY in production
- Use strong database password
- Never commit .env file to git
- Use environment-specific configurations
- Implement proper authentication before deployment

## Troubleshooting

### ModuleNotFoundError
```bash
pip install -r requirements.txt
```

### DatabaseError
- Check MySQL service is running: `net start MySQL80`
- Verify .env credentials
- Check database exists: `mysql -u root -p citizen_app_db -e "SHOW TABLES;"`

### Port Already in Use
```bash
python -m uvicorn main:app --reload --port 8001
```

## Next Steps

1. Implement JWT authentication
2. Add data validation
3. Add error handling
4. Add logging
5. Add unit tests
6. Add production configurations
7. Deploy to production server

---

**API Documentation**: http://localhost:8000/docs
**Health Check**: http://localhost:8000/health
**Root Endpoint**: http://localhost:8000/
