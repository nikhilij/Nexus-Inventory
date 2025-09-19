# Navigation Behavior for Authenticated Users

This document explains the navigation system modifications implemented for the Nexus Inventory application, which dynamically shows different menu items based on user authentication status.

## Overview

The navigation system has been updated to provide a tailored experience for different user types:

- **Non-authenticated users**: See public marketing pages (About, Platform, Services, Contact)
- **Authenticated subscribers**: See business-relevant pages (Dashboard, Products, Inventory, Orders, etc.)

## Navigation Structure

### Public Pages (Non-authenticated Users)

These pages are shown only to users who haven't signed in:

- **About** (`/about`) - Company information and story
- **Platform** (`/platform`) - Technical platform details
- **Services** (`/services`) - Service offerings
- **Contact** (`/contact`) - Contact information and forms

### Subscriber Pages (Authenticated Users)

These pages are shown only to signed-in users:

- **Dashboard** (`/dashboard`) - Main inventory overview
- **Products** (`/products`) - Product management
- **Inventory** (`/inventory`) - Stock levels and tracking
- **Orders** (`/orders`) - Purchase and sales orders
- **Suppliers** (`/suppliers`) - Supplier management
- **Reports** (`/reports`) - Analytics and reporting
- **Settings** (`/settings`) - User and system settings

## Implementation Details

### Header Component (`components/Header.js`)

#### Navigation Item Structure

```javascript
navItems = [
   // Public pages - shown to non-authenticated users only
   { key: "about", label: "About", href: "/about", public: true },
   { key: "platform", label: "Platform", href: "/platform", public: true },
   { key: "services", label: "Services", href: "/services", public: true },
   { key: "contact", label: "Contact", href: "/contact", public: true },

   // Subscriber pages - shown to authenticated users only
   { key: "dashboard", label: "Dashboard", href: "/dashboard", subscriber: true },
   { key: "products", label: "Products", href: "/products", subscriber: true },
   // ... more subscriber pages
];
```

#### Filtering Logic

```javascript
navItems.filter((item) => {
   // Show public pages only to non-authenticated users
   if (item.public && isAuthenticated) {
      return false;
   }
   // Show subscriber pages only to authenticated users
   if (item.subscriber && !isAuthenticated) {
      return false;
   }
   // Legacy support for protected pages
   if (item.protected && !isAuthenticated) {
      return false;
   }
   return true;
});
```

### Footer Component (`components/Footer.js`)

#### Footer Navigation Groups

```javascript
navGroups = [
   {
      title: "Product",
      links: [
         { label: "Platform", href: "/platform", public: true },
         { label: "Pricing", href: "/pricing", public: true },
         // ... more public links
      ],
   },
   {
      title: "Company",
      links: [
         { label: "About Us", href: "/about", public: true },
         { label: "Contact Us", href: "/contact", public: true },
         // ... more public links
      ],
   },
   // ... more groups
];
```

#### Footer Filtering Logic

```javascript
navGroups
   .filter((group) => {
      // Filter out groups that have only public links for authenticated users
      if (isAuthenticated) {
         return group.links.some((link) => !link.public);
      }
      return true;
   })
   .map((group) =>
      // Render group with filtered links
      group.links.filter((link) => {
         // Show public links only to non-authenticated users
         if (link.public && isAuthenticated) {
            return false;
         }
         return true;
      })
   );
```

### Logo Link Behavior

#### Header Logo

- **Non-authenticated users**: Links to `/` (home page)
- **Authenticated users**: Links to `/dashboard` (main dashboard)

#### Footer Logo

- **Non-authenticated users**: Links to `/` (home page)
- **Authenticated users**: Links to `/dashboard` (main dashboard)

## User Experience Flow

### Non-authenticated User Journey

1. **Visit website** → Sees public navigation (About, Platform, Services, Contact)
2. **Sign in** → Redirected to PIN verification
3. **Enter PIN** → Navigation switches to subscriber pages
4. **Access granted** → Can use Dashboard, Products, Inventory, etc.

### Authenticated User Journey

1. **Already signed in** → Sees subscriber navigation immediately
2. **Browse system** → Access to all business-relevant features
3. **Sign out** → Navigation switches back to public pages

## Security Considerations

### Route Protection

- **Middleware protection** for subscriber routes
- **PIN verification** required for inventory access
- **Session management** with secure cookies

### Access Control

- **Role-based filtering** in navigation
- **Authentication state** determines visible menu items
- **Clean separation** between public and private content

## Testing

### Automated Tests

Run the navigation behavior test:

```bash
npm run test:nav
```

This test verifies:

- Non-authenticated users see correct public pages
- Authenticated users see correct subscriber pages
- Logo links point to appropriate destinations

### Manual Testing Steps

1. **Test as guest user**:
   - Visit website without signing in
   - Verify public navigation is visible
   - Check that subscriber pages are not accessible

2. **Test as authenticated user**:
   - Sign in and complete PIN verification
   - Verify subscriber navigation is visible
   - Check that public pages are hidden
   - Test logo link points to dashboard

3. **Test sign out**:
   - Sign out from authenticated session
   - Verify navigation switches back to public pages
   - Check logo link points to home page

## Configuration

### Adding New Navigation Items

#### For Public Pages

```javascript
{ key: "new-page", label: "New Page", href: "/new-page", public: true }
```

#### For Subscriber Pages

```javascript
{ key: "new-feature", label: "New Feature", href: "/new-feature", subscriber: true }
```

### Modifying Existing Items

- Add `public: true` for public-only pages
- Add `subscriber: true` for authenticated-user-only pages
- Remove flags for pages visible to all users

## Browser Behavior

### Caching Considerations

- Navigation state changes immediately on authentication
- No browser caching issues due to client-side filtering
- Session persistence maintained across page refreshes

### Mobile Responsiveness

- Same filtering logic applied to mobile navigation
- Hamburger menu respects authentication state
- Touch-friendly interface maintained

## Performance Impact

### Minimal Overhead

- Client-side filtering with negligible performance cost
- No additional API calls for navigation state
- Efficient rendering with React's virtual DOM

### Bundle Size

- No significant increase in bundle size
- Reuses existing authentication state
- Optimized conditional rendering

## Future Enhancements

### Planned Features

- **Role-based navigation** (Admin, Manager, Operator, etc.)
- **Feature flags** for conditional menu items
- **Dynamic menu configuration** from backend
- **Customizable user preferences** for menu layout

### Extensibility

- Easy to add new navigation categories
- Support for nested menu structures
- Plugin system for third-party menu items

## Troubleshooting

### Common Issues

1. **Navigation not updating after sign in**:
   - Check authentication state in React context
   - Verify session persistence
   - Clear browser cache if needed

2. **Wrong menu items visible**:
   - Check `public` and `subscriber` flags on nav items
   - Verify filtering logic in components
   - Test with different authentication states

3. **Logo link not working**:
   - Check conditional logic for logo href
   - Verify authentication state detection
   - Test both authenticated and non-authenticated states

### Debug Information

- Use browser dev tools to inspect authentication state
- Check React dev tools for component state
- Review server logs for authentication issues

## Support

For issues with the navigation system:

1. Check this documentation
2. Run the automated tests: `npm run test:nav`
3. Verify authentication state in browser
4. Check component props and state
5. Review filtering logic in Header/Footer components

The navigation system provides a seamless experience that adapts to user authentication status, ensuring appropriate content visibility for different user types.
