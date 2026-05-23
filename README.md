DevPulse API 🚀

A collaborative platform for software teams to report bugs, suggest features, and manage issue resolution workflows.
---
🌐 Live Links

Live API: https://b7-a2-three.vercel.app/
GitHub Repository: https://github.com/yourusername/devpulse
---
📌 Features
User Authentication with JWT
Role-based Authorization
Create Bug Reports & Feature Requests
Maintainer Issue Management
Filter & Sort Issues
PostgreSQL Database Integration
Password Hashing using bcrypt
Centralized Error Handling
Modular Express Architecture
TypeScript Support
Raw SQL Queries using pg
🛠️ Tech Stack
Technology	Usage
Node.js	Backend Runtime
Express.js	REST API Framework
TypeScript	Type Safety
PostgreSQL	Relational Database
pg	PostgreSQL Driver
bcrypt	Password Hashing
jsonwebtoken	JWT Authentication
dotenv	Environment Variables
cors	Cross-Origin Resource Sharing
tsup	Build Tool

# 📂 Project Structure

```bash
src
│
├── config
│   ├── db.ts
│   └── dotenv.ts
│
├── modules
│   │
│   ├── auth
│   │   ├── auth.controller.ts
│   │   ├── auth.route.ts
│   │   ├── auth.service.ts
│   │   
│   │
│   ├── issues
│   │   ├── issues.controller.ts
│   │   ├── issues.route.ts
│   │   ├── issues.service.ts
│   │  
│   │
│   └── middleware
│       ├── auth.middleware.ts
│      
│

│   ├── response.ts
│ 
│
├── app.ts
└── server.ts
```
