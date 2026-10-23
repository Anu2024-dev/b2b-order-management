# Security Architecture, Controls & Threat Mitigation
## Arrowstack Internship — Project 1: B2B Order Management Platform

---

## 1. Authentication & Password Security

### 1.1 Password Hashing Strategy
- Passwords are never stored in plain text.
- Passwords are salted and hashed using **bcryptjs** with a cost factor of **10 rounds** (`bcrypt.hash(password, 10)`).
- Hashes are resistant to rainbow table attacks and pre-computed lookup dictionaries.
- Verification is performed using timing-safe comparisons (`bcrypt.compare(password, user.password_hash)`).
- SQL `SELECT` queries for public profiles explicitly omit the `password_hash` column (`SELECT id, name, email, role, ...`).

### 1.2 Account Enumeration Mitigation
- When an authentication attempt fails during login, the API returns a generic HTTP `401 Unauthorized`:
  ```json
  {
    "success": false,
    "message": "Invalid email or password credentials"
  }
  ```
- The API does not distinguish between a non-existent email and an incorrect password, preventing threat actors from harvesting registered corporate email addresses.

---

## 2. JWT Lifecycle & Server Revocation

### 2.1 Token Construction & Signing
- Tokens are signed using **HMAC SHA-256** with a cryptographically strong secret stored in `JWT_SECRET`.
- Payload contains minimal necessary metadata:
  ```json
  {
    "userId": 2,
    "email": "purchasing@apexsolutions.example.com",
    "role": "customer",
    "jti": "c920f011-e41c-4da8-967f-561b36bb0242",
    "exp": 1792892400
  }
  ```
- Tokens default to a short lifespan of 24 hours (`JWT_EXPIRES_IN=24h`).

### 2.2 Token Revocation & Logout
- Standard stateless JWTs present a security vulnerability: simply deleting a JWT from `localStorage` on the frontend does not invalidate the token if an attacker previously intercepted it.
- **Implemented Solution**: Each token is issued with a unique identifier (`jti` - JWT ID).
- Upon calling `POST /api/v1/auth/logout`, the server records the `jti` into the `token_revocations` table:
  ```sql
  INSERT INTO token_revocations (token_jti, user_id, expires_at)
  VALUES ($1, $2, $3);
  ```
- In the `auth.js` middleware, before authenticating a request, the database checks:
  ```sql
  SELECT id FROM token_revocations WHERE token_jti = $1;
  ```
  If found, the request is immediately rejected with HTTP `401: Session terminated: token has been revoked`.

---

## 3. Role-Based Access Control (RBAC) & Privilege Separation

- Roles are strictly enforced on the server via `role.js` middleware (`authorize('admin')`, `authorize('customer')`).
- Role assignment during registration is hardcoded to `'customer'`. Client payloads attempting to inject `"role": "admin"` are discarded by the Zod registration schema.
- **Bootstrapping Privilege**: Administrative accounts cannot be registered via public endpoints. Administrators are provisioned via the documented CLI seed command (`npm run seed`), reading credentials from environment variables.

---

## 4. Injection & Input Sanitization

### 4.1 SQL Injection Prevention
- All queries executed through `pg` use parameterized query placeholders (`$1, $2, $3`):
  ```javascript
  await client.query('SELECT * FROM products WHERE id = $1;', [productId]);
  ```
- No untrusted user inputs are ever concatenated directly into SQL query strings.
- Sort parameters on the product catalog are validated against an immutable code allowlist:
  ```javascript
  const ALLOWED_SORT_FIELDS = ['name', 'unit_price', 'created_at', 'stock_quantity'];
  const validSort = ALLOWED_SORT_FIELDS.includes(sort) ? `p.${sort}` : 'p.created_at';
  ```

### 4.2 Insecure Direct Object Reference (IDOR) Prevention
- Customers cannot view other companies' orders or invoices.
- In `getOrderById` and `getInvoiceById`, the service layer enforces:
  ```javascript
  if (role !== 'admin' && entity.customer_id !== userId) {
    throw new ForbiddenError('You do not have permission to view this resource');
  }
  ```

### 4.3 HTTP Headers & Rate Limiting
- **Helmet**: Injects security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, `Content-Security-Policy`).
- **CORS**: Enforces origin allowlists, rejecting arbitrary external domains while permitting verified frontend origins.
- **Rate Limiting**: Protects against automated brute-force attacks by limiting login and registration endpoints to 50 attempts per 15 minutes per IP.

---

## 5. Security Residual Risks & Future Roadmap

1. **Token Storage in Browser**: In this learning project, tokens are stored in `localStorage` for ease of setup. For high-security banking or production deployments, httpOnly, SameSite, Secure cookies are recommended to eliminate XSS token exfiltration risks.
2. **Revocation Table Vacuuming**: A recurring cron job should periodically delete expired records from `token_revocations` to maintain high query velocity.
3. **Multi-Factor Authentication (MFA)**: TOTP / SMS verification is recommended for administrative actions in future roadmap milestones.
