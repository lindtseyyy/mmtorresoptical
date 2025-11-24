# Frontend Documentation - Source Directory Structure

This document provides a comprehensive overview of the `/src` directory structure and the purpose of each folder in the MM Torres Optical frontend application.

---

## 📁 Directory Overview

```
src/
├── api/              # API communication layer
├── assets/           # Static assets (images, fonts, etc.)
├── components/       # Reusable React components
├── lib/              # Utility libraries and configurations
├── pages/            # Top-level page components
├── query/            # TanStack Query configurations
├── index.css         # Global CSS styles
├── main.tsx          # Application entry point
└── types.ts          # TypeScript type definitions
```

---

## 📂 Detailed Folder Descriptions

### `/api` - API Communication Layer

**Purpose**: Contains all HTTP API calls to the backend server. This layer abstracts the communication with the Spring Boot REST API.

**Key Files**:

- `productApi.ts` - Product-related API calls (CRUD operations)
- `userApi.ts` - User-related API calls (CRUD operations)

**Responsibilities**:

- Define API endpoints for products and users
- Handle HTTP requests using the configured Axios instance
- Return strongly-typed data using TypeScript interfaces
- Implement error handling for API calls

**Example Functions**:

```typescript
// Product API functions
-fetchProducts() - // GET /api/products
  fetchProduct(id) - // GET /api/products/:id
  addProduct(data) - // POST /api/products
  updateProduct(id) - // PUT /api/products/:id
  archiveProduct(id) - // DELETE /api/products/:id
  // User API functions
  fetchUsers() - // GET /users
  fetchUser(id) - // GET /users/:id
  registerUser(data) - // POST /api/users
  updateUser(id, data) - // PUT /users/:id
  archiveUser(id); // DELETE /users/:id
```

**Design Pattern**: Repository Pattern - Separates data access logic from business logic.

---

### `/assets` - Static Assets

**Purpose**: Stores static files such as images, icons, fonts, and other media resources used throughout the application.

**Typical Contents**:

- Product images
- Logo and branding assets
- Icon files
- Background images
- SVG graphics

**Usage**: Assets are imported directly into components using ES6 imports:

```typescript
import logo from "@/assets/logo.png";
```

---

### `/components` - Reusable React Components

**Purpose**: Contains all reusable UI components organized by functionality. This is the heart of the component-based architecture.

**Subfolders**:

#### `/components/forms/`

Specialized form components for data entry and editing.

- **`ProductForm.tsx`**
  - Handles product creation and editing
  - Implements validation with Zod schema
  - Uses React Hook Form for form state management
  - Supports both add and edit modes
- **`UserForm.tsx`**
  - Manages user registration and profile editing
  - Includes password field with conditional validation
  - Handles role assignment (Admin/Staff)
  - Validates personal and account information

#### `/components/layout/`

Layout components that define the application structure.

- **`MainLayout.tsx`**
  - Provides the main application shell
  - Renders the sidebar navigation
  - Contains the `<Outlet>` for nested route rendering
  - Implements protected route logic
- **`Sidenav.tsx`**
  - Left sidebar navigation menu
  - Route links for Inventory and Users
  - Active route highlighting
  - Logout functionality

#### `/components/ui/`

Low-level, reusable UI primitives based on Radix UI and styled with Tailwind CSS.

**Components**:

- `badge.tsx` - Status indicators (stock levels, roles)
- `button.tsx` - Customizable button component with variants
- `card.tsx` - Container component for content sections
- `checkbox.tsx` - Accessible checkbox input
- `form.tsx` - Form wrapper with context providers
- `input.tsx` - Text input with validation states
- `label.tsx` - Accessible form labels
- `select.tsx` - Dropdown select component
- `sonner.tsx` - Toast notification wrapper

**Design System**: These components follow a consistent design language and are composable.

#### `/components/` (Root Level)

- **`ProductSearchBar.tsx`**
  - Search and filter interface for products
  - Filters by name, category, and stock level
  - Real-time search functionality
  - Used in the Manage Inventory page

---

### `/lib` - Utility Libraries and Configurations

**Purpose**: Houses utility functions, helper methods, and shared configurations used across the application.

**Key Files**:

- **`axiosInstance.ts`**

  - Configures a custom Axios instance for HTTP requests
  - Sets base URL from environment variables
  - Implements request/response interceptors
  - Automatically attaches JWT token to all requests
  - Handles authentication headers

  ```typescript
  // Auto-attach JWT token to every request
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  ```

- **`utils.ts`**
  - Utility functions for common operations
  - CSS class name merging (using `clsx` and `tailwind-merge`)
  - Helper functions for data transformation
  - Common validation helpers

**Why Separate?**: Centralizing utilities promotes code reuse and makes maintenance easier.

---

### `/pages` - Top-Level Page Components

**Purpose**: Contains page-level components that correspond to specific routes in the application. Each page represents a distinct view or screen.

**Page Components**:

- **`Login.tsx`**

  - User authentication page
  - Login form with username/email and password
  - JWT token handling and storage
  - Redirects to inventory after successful login

- **`ManageInventory.tsx`**

  - Main inventory management dashboard
  - Product listing with search and filters
  - Stock level indicators (low, normal, overstocked)
  - Quick actions: edit, archive products
  - Navigation to add/edit product pages

- **`AddProduct.tsx`**

  - Create new product entry
  - Uses `ProductForm` component
  - Handles product creation mutation
  - Success redirect to inventory page

- **`EditProduct.tsx`**

  - Update existing product
  - Fetches product data by ID from URL params
  - Pre-populates form with current values
  - Implements update mutation

- **`ManageUsers.tsx`**

  - User management dashboard
  - List all staff and admin accounts
  - Role-based filtering
  - User archiving functionality
  - Navigation to add/edit user pages

- **`AddUser.tsx`**

  - User registration page
  - Creates new staff or admin accounts
  - Password field required for new users
  - Implements user creation mutation

- **`EditUser.tsx`**
  - Update existing user profile
  - Fetches user data by ID
  - Optional password update (edit mode)
  - Handles partial updates

**Routing Pattern**: Pages are mapped to routes in `main.tsx` using React Router.

---

### `/query` - TanStack Query Configurations

**Purpose**: Centralizes all TanStack Query (React Query) configurations for data fetching, caching, and mutations. This folder implements the server state management layer.

**Key Files**:

- **`productQuery.ts`**

  - Query options for fetching products
  - Mutation options for add/edit/archive products
  - Cache invalidation strategies
  - Success/error toast notifications

  **Functions**:

  - `createProductsListQueryOptions()` - Fetch all products
  - `createEditProductQueryOptions(id)` - Fetch single product
  - `createAddProductMutationOptions()` - Create product mutation
  - `createEditProductMutationOptions()` - Update product mutation
  - `createArchiveProductMutationOptions()` - Archive product mutation

- **`userQuery.ts`**

  - Query options for fetching users
  - Mutation options for add/edit/archive users
  - Cache management and invalidation
  - User-specific success/error handling

  **Functions**:

  - `createUsersListQueryOptions()` - Fetch all users
  - `createEditUserQueryOptions(id)` - Fetch single user
  - `createAddUserMutationOptions()` - Create user mutation
  - `createEditUserMutationOptions()` - Update user mutation
  - `createArchiveUserMutationOptions()` - Archive user mutation

**Benefits**:

- **Automatic Caching**: Reduces unnecessary API calls
- **Background Refetching**: Keeps data fresh
- **Optimistic Updates**: Better UX with instant feedback
- **Automatic Retries**: Handles transient failures
- **Cache Invalidation**: Ensures data consistency

**Design Pattern**: Factory Pattern - Functions create configured query/mutation objects.

---

## 📄 Root-Level Files

### `main.tsx` - Application Entry Point

**Purpose**: The main entry point of the React application. Bootstraps the entire app.

**Responsibilities**:

- Renders the root React component to the DOM
- Sets up React Router with route definitions
- Configures TanStack Query Client
- Wraps app with necessary providers (QueryClientProvider)
- Defines the complete routing structure

**Route Structure**:

```typescript
/login                    → Login page (public)
/                         → MainLayout (protected)
  ├── /inventory          → Manage Inventory
  ├── /inventory/add      → Add Product
  ├── /inventory/edit/:id → Edit Product
  ├── /users              → Manage Users
  ├── /users/add          → Add User
  └── /users/edit/:id     → Edit User
```

### `types.ts` - TypeScript Type Definitions

**Purpose**: Centralized location for all TypeScript interfaces, types, and Zod schemas used across the application.

**Contents**:

#### Form Schemas (Zod)

- `productFormSchema` - Validation schema for product forms
- `productSchema` - Transformed schema with number conversions
- `userSchema` - Validation schema for user forms with optional password

#### Form Types

- `ProductFormValues` - Type for product form inputs
- `ProductFormData` - Type for product form after transformation
- `UserFormData` - Type for user form inputs
- `LoginFormData` - Type for login form

#### API Response Types

- `Product` - Product data from backend (includes productId, dateAdded)
- `User` - User data from backend (includes userId, createdAt)

#### Utility Types

- `ProductSearchFilters` - Search/filter state for inventory

**Why Centralized?**:

- Single source of truth for types
- Easier refactoring and maintenance
- Prevents type inconsistencies
- Enables better IDE autocomplete

### `index.css` - Global Styles

**Purpose**: Contains global CSS styles, Tailwind directives, and CSS custom properties.

**Typical Contents**:

- Tailwind CSS imports (`@tailwind base`, `@layer components`, etc.)
- CSS custom properties for theming (colors, spacing)
- Global resets and base styles
- Animation keyframes
- Root-level styling

---

## 🔄 Data Flow Architecture

### Request Flow

```
User Action (Page)
    ↓
Form Component
    ↓
Query/Mutation Hook (query/)
    ↓
API Function (api/)
    ↓
Axios Instance (lib/axiosInstance)
    ↓
Backend API
```

### Response Flow

```
Backend API Response
    ↓
Axios Instance (auto-attaches token)
    ↓
API Function (api/)
    ↓
TanStack Query (cache update)
    ↓
Component Re-render
    ↓
UI Update
```

---

## 🛠️ Key Technologies & Patterns

### State Management

- **Server State**: TanStack Query (`/query`)
- **Form State**: React Hook Form (`/components/forms`)
- **Local State**: React useState/useReducer

### Validation

- **Schema Validation**: Zod schemas in `types.ts`
- **Form Validation**: React Hook Form + Zod resolver
- **Runtime Validation**: TypeScript type checking

### Styling

- **CSS Framework**: Tailwind CSS
- **Component Library**: Radix UI (`/components/ui`)
- **Utility Functions**: `cn()` from `/lib/utils.ts`

### Routing

- **Client-side Routing**: React Router v7
- **Protected Routes**: MainLayout wrapper
- **Dynamic Routes**: `:id` params for edit pages

---

## 📝 Best Practices

1. **Component Organization**: Keep components small and focused on a single responsibility
2. **Type Safety**: Always define TypeScript types for props and API responses
3. **Reusability**: Extract common UI patterns into `/components/ui`
4. **API Abstraction**: Never call Axios directly in components; use `/api` functions
5. **Query Keys**: Use consistent naming in query options for cache management
6. **Error Handling**: Implement error boundaries and toast notifications
7. **Code Splitting**: Use lazy loading for page components if needed

---

## 🚀 Development Workflow

### Adding a New Feature

1. **Define Types** → Add types to `types.ts`
2. **Create API Functions** → Add to `/api` folder
3. **Setup Queries** → Create query options in `/query`
4. **Build Components** → Create in `/components` or `/pages`
5. **Add Routes** → Update `main.tsx` routing configuration
6. **Test** → Verify functionality end-to-end

### Modifying Existing Features

1. Check `types.ts` for type definitions
2. Update API functions if backend changes
3. Adjust query configurations if caching needs change
4. Modify components with new logic
5. Update routes if navigation changes

---

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zod Documentation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)

---

**Last Updated**: November 2025
