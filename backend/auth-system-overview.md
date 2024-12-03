# Authentication System Overview

## Table of Contents
1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Database Structure](#database-structure)
4. [Authentication Flows](#authentication-flows)
5. [Security Considerations](#security-considerations)
6. [Implementation Details](#implementation-details)

## Overview

```
backend/
├── src/
│   ├── auth/
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts       # JWT verification, role checks
│   │   │   └── validateRequest.ts      # Request validation
│   │   ├── controllers/
│   │   │   └── authController.ts       # Login, register, password reset logic
│   │   ├── services/
│   │   │   ├── authService.ts          # JWT creation, password hashing
│   │   │   └── emailService.ts         # Email verification, password reset emails
│   │   └── routes/
│   │       └── authRoutes.ts           # Auth-related route definitions
│   │
│   ├── users/
│   │   ├── controllers/
│   │   │   └── userController.ts       # User CRUD operations
│   │   ├── services/
│   │   │   └── userService.ts          # User business logic
│   │   ├── models/
│   │   │   └── userModel.ts            # User type definitions
│   │   └── routes/
│   │       └── userRoutes.ts           # User-related route definitions
│   │
│   ├── db/
│   │   ├── connection.ts               # Database connection setup
│   │   └── repositories/
│   │       └── userRepository.ts       # Database queries for users
│   │
│   ├── utils/
│   │   ├── errors/
│   │   │   └── customErrors.ts         # Custom error classes
│   │   ├── constants.ts                # App constants
│   │   └── validation.ts               # Input validation helpers
│   │
│   ├── types/
│   │   └── index.ts                    # Shared TypeScript types
│   │
│   └── app.ts                          # Express app setup
```

An authentication system is like a nightclub's security system (of course this is helpful for you):
- **Registration** = Getting a membership card
- **Login** = Showing your membership card
- **JWT Token** = Getting a wristband to move around freely
- **Protected Routes** = VIP areas that check for wristbands

## Core Components

### 1. User Model
```typescript
interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  last_login?: Date;
}
```

### 2. Database Tables
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

## Authentication Flows

### Registration Process
1. **Input Validation**
   - Validate email format
   - Check password strength
   - Verify required fields

2. **Security Steps**
```typescript
// 1. Hash password
const hashedPassword = await argon2.hash(password);

// 2. Save user
const user = await db.users.create({
  email,
  password_hash: hashedPassword,
  name
});

// 3. Generate token
const token = jwt.sign({ userId: user.id }, JWT_SECRET);
```

### Login Process
1. **Verification Steps**
   - Find user by email
   - Compare password hash
   - Generate new JWT token

2. **Code Flow**
```typescript
async function login(email: string, password: string) {
  // Find user
  const user = await db.users.findOne({ email });
  if (!user) throw new AuthError('User not found');

  // Verify password
  const isValid = await argon2.verify(user.password_hash, password);
  if (!isValid) throw new AuthError('Invalid password');

  // Generate token
  const token = generateJWT(user);
  
  return { user, token };
}
```

## Security Considerations

### Password Security
- Never store plain text passwords
- Use Argon2 for hashing
- Implement password strength requirements
  - follow [owasp guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#implement-proper-password-strength-controls)
  - min 8 characters
  - no restrictions on special characters, upper/lower case, numbers etc.
  - max length 1024 characters to prevent long-password DoS


### Token Security
- Short expiration times (24h typical)
- Secure signing with JWT_SECRET
- Include minimal payload data
- Implement token refresh strategy

### Artifical Intelligence
- Never use AI-generated code for security-critical services
- Avoid AI slop on the backend

### Route Protection
```typescript
const protectRoute = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) throw new AuthError('No token provided');

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await db.users.findById(decoded.userId);
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
```

## Implementation Details

### Error Handling
```typescript
class AuthError extends Error {
  constructor(message: string, public statusCode = 401) {
    super(message);
  }
}
```

### Database Interactions
```typescript
class UserRepository {
  async findByEmail(email: string) {
    return await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
  }

  async createUser(userData: UserCreateDTO) {
    return await this.db.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *',
      [userData.email, userData.password_hash, userData.name]
    );
  }
}
```

## Best Practices

1. **Input Validation**
   - Validate all user inputs
   - Sanitize data before storage
   - Use prepared statements for queries

2. **Error Handling**
   - Provide clear error messages
   - Log security events
   - Implement rate limiting

3. **Security Measures**
   - Use HTTPS only
   - Implement CORS properly
   - Set secure cookie flags
   - Regular security audits
   - No AI slop

## Testing

```typescript
describe('AuthService', () => {
  it('should register new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'secure123',
      name: 'Test User'
    };
    
    const result = await authService.register(userData);
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
  });
});
```

## Maintenance

1. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Update password hashing strength as needed

2. **Monitoring**
   - Track failed login attempts
   - Monitor token usage
   - Log suspicious activities

## Additional Features

1. **Password Reset Flow**
2. **Email Verification**
3. **Two-Factor Authentication**
4. **Session Management**
5. **Account Lockout**

---

This system provides a secure, scalable, and maintainable authentication solution for modern web applications. 
