# PIN Verification System for Nexus Inventory

This document explains the PIN verification system implemented for the Nexus Inventory application, which adds an additional layer of security for accessing inventory features.

## Overview

The PIN verification system requires users to enter a 6-digit PIN after signing in to access inventory-related features. This provides an extra security layer beyond standard authentication.

## Features

- **6-Digit PIN Verification**: Users must enter a valid 6-digit PIN to access inventory features
- **Session-Based Verification**: PIN verification is maintained for the session duration
- **Secure Cookie Storage**: PIN verification status is stored in secure HTTP-only cookies
- **Automatic Redirects**: Users are automatically redirected to PIN verification when accessing protected routes
- **Middleware Protection**: Server-side middleware protects inventory routes
- **Visual Feedback**: Clear UI indicators show verification status

## How It Works

### Authentication Flow

1. **User Signs In**: User authenticates via Google OAuth or credentials
2. **PIN Verification Required**: After successful authentication, user is redirected to `/verify-pin`
3. **PIN Entry**: User enters their 6-digit PIN (default: `123456` for demo)
4. **Verification**: System validates PIN and sets secure cookies
5. **Access Granted**: User can now access inventory features

### Protected Routes

The following routes are protected by PIN verification:

- `/dashboard` - Main inventory dashboard
- `/inventory/*` - Inventory management pages
- `/products/*` - Product management pages
- `/orders/*` - Order management pages
- `/warehouse/*` - Warehouse management pages
- `/reports/*` - Reporting pages

## API Endpoints

### POST `/api/validate-pin`

Validates a 6-digit PIN.

**Request Body:**

```json
{
   "pin": "123456"
}
```

**Response (Success):**

```json
{
   "ok": true,
   "message": "PIN verified successfully"
}
```

**Response (Error):**

```json
{
   "ok": false,
   "error": "Invalid PIN"
}
```

### GET `/api/validate-pin`

Checks current PIN verification status.

**Response:**

```json
{
   "verified": true,
   "verifiedAt": "2024-01-15T10:30:00.000Z"
}
```

### POST `/api/validate-pin/clear`

Clears PIN verification (used during logout).

**Response:**

```json
{
   "ok": true,
   "message": "PIN verification cleared"
}
```

## Configuration

### Environment Variables

No additional environment variables are required for the PIN system.

### PIN Configuration

- **Default PIN**: `123456` (for demo purposes)
- **PIN Length**: 6 digits
- **Cookie Expiry**: 24 hours
- **Security**: HTTP-only, secure cookies in production

## Security Features

### Cookie Security

- **HTTP-only**: Prevents client-side JavaScript access
- **Secure**: HTTPS-only in production
- **SameSite**: Lax policy for CSRF protection
- **Expiry**: 24-hour session validity

### Route Protection

- **Middleware**: Server-side route protection
- **Session Validation**: Checks both authentication and PIN verification
- **Automatic Redirects**: Seamless user experience

## Usage Examples

### Basic PIN Verification

```javascript
const response = await fetch("/api/validate-pin", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ pin: "123456" }),
});

const result = await response.json();
if (result.ok) {
   // PIN verified, proceed to dashboard
   window.location.href = "/dashboard";
}
```

### Check Verification Status

```javascript
const response = await fetch("/api/validate-pin");
const status = await response.json();

if (status.verified) {
   // User has valid PIN verification
   console.log("Verified at:", status.verifiedAt);
}
```

### Clear Verification (Logout)

```javascript
await fetch("/api/validate-pin/clear", { method: "POST" });
// Clear local storage
localStorage.removeItem("pinVerified");
localStorage.removeItem("pinVerifiedAt");
```

## UI Components

### PIN Verification Page (`/verify-pin`)

- Clean, secure interface for PIN entry
- Visual PIN dots showing input progress
- Error handling and loading states
- Responsive design

### Dashboard Integration

- PIN verification status indicator
- Conditional content display
- Security notices for unverified users
- Easy access to PIN verification

## Production Considerations

### PIN Storage

For production use, implement proper PIN storage:

- Store hashed PINs in database
- Use bcrypt or Argon2 for hashing
- Implement PIN reset functionality
- Add rate limiting for PIN attempts

### Security Enhancements

- Implement PIN attempt limits
- Add PIN expiry policies
- Enable two-factor authentication
- Add audit logging for PIN attempts

### Cookie Configuration

```javascript
// Production cookie settings
response.cookies.set("pinVerified", "true", {
   httpOnly: true,
   secure: true, // Always HTTPS in production
   sameSite: "strict",
   maxAge: 24 * 60 * 60,
   path: "/",
});
```

## Testing

### Manual Testing Steps

1. Sign in to the application
2. Verify redirect to `/verify-pin`
3. Enter valid PIN (`123456`)
4. Confirm access to dashboard
5. Check PIN verification indicator
6. Test logout and PIN clearing

### Automated Testing

```javascript
// Example test for PIN validation
describe("PIN Validation", () => {
   test("valid PIN should return success", async () => {
      const response = await request(app).post("/api/validate-pin").send({ pin: "123456" });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
   });

   test("invalid PIN should return error", async () => {
      const response = await request(app).post("/api/validate-pin").send({ pin: "000000" });

      expect(response.status).toBe(401);
      expect(response.body.ok).toBe(false);
   });
});
```

## Troubleshooting

### Common Issues

1. **Stuck on PIN Verification**
   - Clear browser cookies
   - Check cookie settings
   - Verify middleware configuration

2. **PIN Not Accepted**
   - Confirm correct PIN (`123456` for demo)
   - Check for leading/trailing spaces
   - Verify API endpoint is accessible

3. **Redirect Loops**
   - Check middleware matcher patterns
   - Verify authentication status
   - Clear browser cache

### Debug Information

- Check browser developer tools for cookie values
- Verify API responses in network tab
- Check server logs for middleware errors

## Future Enhancements

- **Database PIN Storage**: Store PINs securely in database
- **PIN Reset Functionality**: Allow users to reset forgotten PINs
- **Multiple PIN Attempts**: Implement attempt limits and lockouts
- **PIN History**: Track PIN verification history
- **Biometric Integration**: Support fingerprint/face recognition
- **PIN Expiry**: Implement PIN expiration policies

## Support

For issues with the PIN verification system:

1. Check this documentation
2. Review browser console for errors
3. Verify API endpoints are responding
4. Check middleware configuration
5. Clear browser cache and cookies

The PIN verification system provides an additional security layer while maintaining a smooth user experience for accessing inventory features.
