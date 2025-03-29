# FinExpert Backend

FinExpert is a financial management system that helps users track their expenses, analyze spending patterns, and receive AI-based financial advice. This repository contains the backend implementation using **Node.js**, **Express**, and **PostgreSQL**.

## Features
- User Authentication (Register, Login with JWT Authentication)
- Expense Tracking
- Category Management
- Budget Planning
- Notification System
- AI-based Financial Insights
- Secure password hashing using **bcryptjs**
- Database managed with **PostgreSQL**

## Technologies Used
- **Node.js** (Backend Runtime)
- **Express.js** (Framework for API)
- **PostgreSQL** (Database)
- **Sequelize** (ORM for database interaction)
- **JWT (JSON Web Token)** (Authentication)
- **bcryptjs** (Password Hashing)
- **dotenv** (Environment Variables)

## Project Structure
```
finexpert-backend/
├── server.js
├── routes/
│   ├── authRoutes.js
│   ├── expenseRoutes.js
│   ├── budgetRoutes.js
│   ├── notificationRoutes.js
├── controllers/
│   ├── authController.js
│   ├── expenseController.js
│   ├── budgetController.js
│   ├── notificationController.js
├── models/
│   ├── User.js
│   ├── Expense.js
│   ├── Category.js
│   ├── Budget.js
│   ├── Notification.js
├── config/
│   ├── db.js
├── middleware/
│   ├── authMiddleware.js
├── .env
├── .gitignore
├── package.json
├── README.md
```

## Installation & Setup
### Prerequisites
Make sure you have the following installed:
- **Node.js** (v14 or higher)
- **PostgreSQL** (Latest Version)

### Clone the Repository
```sh
git clone https://github.com/yourusername/finexpert-backend.git
cd finexpert-backend
```

### Install Dependencies
```sh
npm install
```

### Set Up Environment Variables
Create a **.env** file in the root directory and configure it as follows:
```
PORT=5000
DB_USER=your_db_user
DB_PASS=your_db_password
DB_HOST=localhost
DB_NAME=FinExpert
DB_PORT=5432
JWT_SECRET=your_jwt_secret
```

### Run Database Migrations
If using **Sequelize**, run:
```sh
npx sequelize-cli db:migrate
```

Or manually create the tables using:
```sql
-- Users Table
CREATE TABLE users (
    user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Start the Server
```sh
npm run dev
```

## API Endpoints

### Authentication
#### Register a New User
**POST** `/api/auth/register`
```json
{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "password": "password123"
}
```

#### Login
**POST** `/api/auth/login`
```json
{
  "email": "johndoe@example.com",
  "password": "password123"
}
```

### Expenses
#### Add Expense
**POST** `/api/expenses/add`
```json
{
  "user_id": "user-uuid",
  "amount": 150.50,
  "category": "Food"
}
```

#### Get User Expenses
**GET** `/api/expenses/:user_id`

### Budget
#### Set Budget
**POST** `/api/budget/set`
```json
{
  "user_id": "user-uuid",
  "total_amount": 2000.00
}
```

### Notifications
#### Get User Notifications
**GET** `/api/notifications/:user_id`

## Running in Production
To run the application in production mode, use:
```sh
npm start
```
Consider using **PM2** for process management:
```sh
npm install -g pm2
pm start
pm2 start server.js --name finexpert-backend
```

## Contributing
Feel free to submit issues or pull requests to improve the project!

## License
This project is licensed under the MIT License.

