# MM Torres Optical - Clinic Management System

A comprehensive full-stack web application for managing optical clinic operations, including inventory management, user administration, and authentication.

## 🎯 Project Overview

MM Torres Optical Clinic Management System is designed to streamline daily operations of an optical clinic. The system provides functionality for managing product inventory (eyeglasses, contact lenses, accessories), user management with role-based access control, and secure authentication.

## 🏗️ Architecture

This project follows a **client-server architecture** with a clear separation between frontend and backend:

- **Backend**: RESTful API built with Spring Boot
- **Frontend**: Single Page Application (SPA) built with React
- **Database**: PostgreSQL for persistent data storage
- **Authentication**: JWT-based stateless authentication

## 📚 Tech Stack

### Backend (`backend-spring`)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Java** | 17+ (Target: 25) | Programming Language |
| **Spring Boot** | 3.5.7 | Application Framework |
| **Spring Security** | - | Authentication & Authorization |
| **Spring Data JPA** | - | Database ORM |
| **PostgreSQL** | 42.7.3 | Relational Database |
| **JWT (JJWT)** | 0.11.5 | Token-based Authentication |
| **Lombok** | - | Reduce Boilerplate Code |
| **Maven** | - | Build Tool & Dependency Management |
| **Hibernate** | - | ORM Implementation |

### Frontend (`frontend-react`)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.1 | UI Library |
| **TypeScript** | 5.9.3 | Type Safety |
| **Vite** | 7.1.7 | Build Tool & Dev Server |
| **React Router** | 7.9.5 | Client-side Routing |
| **TanStack Query** | 5.90.7 | Server State Management |
| **Axios** | 1.13.2 | HTTP Client |
| **React Hook Form** | 7.66.0 | Form Management |
| **Zod** | 4.1.12 | Schema Validation |
| **Tailwind CSS** | 4.1.17 | Utility-first CSS Framework |
| **Radix UI** | - | Accessible UI Components |
| **Lucide React** | 0.553.0 | Icon Library |
| **Sonner** | 2.0.7 | Toast Notifications |

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Secure password hashing with BCrypt
- Role-based access control (Admin/Staff)
- Protected API endpoints

### 📦 Product/Inventory Management
- **CRUD Operations**: Create, Read, Update, Delete products
- **Product Information**:
  - Product name, category, supplier
  - Unit price and quantity tracking
  - Product images
  - Stock level thresholds (low-level and overstocked)
- **Soft Delete**: Archive products instead of permanent deletion
- **Search & Filter**: Find products easily
- **Stock Alerts**: Visual indicators for low stock and overstocked items

### 👥 User Management
- **User CRUD Operations**: Manage staff and admin accounts
- **User Information**:
  - Username, email, contact details
  - Personal information (name, gender, birthdate)
  - Role assignment (Admin/Staff)
- **User Archiving**: Soft delete for user accounts
- **Secure Password Management**: Encrypted password storage

### 🎨 User Interface
- **Modern Design**: Clean, responsive UI with Tailwind CSS
- **Component Library**: Reusable UI components (buttons, forms, cards, etc.)
- **Form Validation**: Real-time validation with React Hook Form and Zod
- **Navigation**: Sidebar navigation with protected routes
- **Feedback**: Toast notifications for user actions
- **Dark Mode Support**: Theme switching capability

## 📁 Project Structure

```
mm-torres-optical/
│
├── backend-spring/              # Spring Boot Backend
│   ├── src/main/java/com/mmtorresoptical/OpticalClinicManagementSystem/
│   │   ├── config/              # Configuration classes
│   │   │   ├── CorsConfig.java           # CORS configuration
│   │   │   ├── DataSeeder.java           # Initial data seeding
│   │   │   └── SecurityConfig.java       # Spring Security config
│   │   ├── controller/          # REST API Controllers
│   │   │   ├── AuthController.java       # Authentication endpoints
│   │   │   ├── ProductController.java    # Product CRUD endpoints
│   │   │   └── UserController.java       # User CRUD endpoints
│   │   ├── dto/                 # Data Transfer Objects
│   │   │   ├── LoginRequest.java
│   │   │   ├── LoginResponse.java
│   │   │   ├── ProductRequest.java
│   │   │   └── UserRequest.java
│   │   ├── exception/           # Custom Exceptions
│   │   │   └── ResourceNotFoundException.java
│   │   ├── model/               # JPA Entity Models
│   │   │   ├── Product.java              # Product entity
│   │   │   └── User.java                 # User entity
│   │   ├── repository/          # JPA Repositories
│   │   │   ├── ProductRepository.java
│   │   │   └── UserRepository.java
│   │   ├── security/            # Security Components
│   │   │   ├── JwtAuthenticationFilter.java  # JWT filter
│   │   │   └── JwtTokenProvider.java         # JWT utility
│   │   └── service/             # Business Logic Layer
│   ├── src/main/resources/
│   │   └── application.yml      # Application configuration
│   └── pom.xml                  # Maven dependencies
│
└── frontend-react/              # React Frontend
    ├── src/
    │   ├── components/          # Reusable Components
    │   │   ├── forms/           # Form components
    │   │   │   ├── ProductForm.tsx
    │   │   │   └── UserForm.tsx
    │   │   ├── layout/          # Layout components
    │   │   │   ├── MainLayout.tsx
    │   │   │   └── Sidenav.tsx
    │   │   ├── ui/              # UI component library
    │   │   └── ProductSearchBar.tsx
    │   ├── pages/               # Page Components
    │   │   ├── Login.tsx
    │   │   ├── ManageInventory.tsx
    │   │   ├── AddProduct.tsx
    │   │   ├── EditProduct.tsx
    │   │   ├── ManageUsers.tsx
    │   │   ├── AddUser.tsx
    │   │   └── EditUser.tsx
    │   ├── lib/                 # Utility functions
    │   ├── assets/              # Static assets
    │   ├── types.ts             # TypeScript type definitions
    │   ├── App.tsx              # Main App component
    │   └── main.tsx             # Application entry point
    ├── package.json             # NPM dependencies
    └── vite.config.ts           # Vite configuration
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login (returns JWT token)

### Products
- `GET /api/products` - Get all non-archived products
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Archive product (soft delete)

### Users
- `GET /api/users` - Get all non-archived users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Archive user (soft delete)

## 💾 Database Schema

### Products Table
- `product_id` (UUID, Primary Key)
- `product_name` (String, Required)
- `image_dir` (String, Optional)
- `category` (String, Required)
- `supplier` (String, Required)
- `unit_price` (Decimal, Required)
- `quantity` (Integer, Required)
- `low_level_threshold` (Integer, Required)
- `overstocked_threshold` (Integer, Required)
- `date_added` (Timestamp)
- `is_archived` (Boolean, Default: false)

### Users Table
- `user_id` (UUID, Primary Key)
- `username` (String, Unique, Required)
- `password_hash` (String, Required)
- `first_name` (String, Required)
- `middle_name` (String, Optional)
- `last_name` (String, Required)
- `gender` (String, Required)
- `birth_date` (Date, Required)
- `email` (String, Unique, Required)
- `contact_number` (String, Required)
- `role` (String, Required: "Admin" or "Staff")
- `created_at` (Timestamp)
- `is_archived` (Boolean, Default: false)

## 🛠️ Setup & Installation

### Prerequisites
- Java 17 or higher
- Node.js 18+ and npm
- PostgreSQL 12+
- Maven 3.6+

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend-spring
   ```

2. **Configure Database**:
   - Create PostgreSQL database: `mmtorresoptical`
   - Update credentials in `src/main/resources/application.yml`

3. **Install dependencies & run**:
   ```bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```
   The backend will start on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend-react
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`

## 🔑 Environment Configuration

### Backend (`application.yml`)
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mmtorresoptical
    username: postgres
    password: your_password
  jpa:
    hibernate:
      ddl-auto: create-drop
app:
  jwt:
    secret: your_jwt_secret_key
    expiration-ms: 86400000
```

## 🧪 Testing

### Backend
```bash
cd backend-spring
./mvnw test
```

### Frontend
```bash
cd frontend-react
npm run lint
```

## 📝 Development Notes

### Security Features
- **Password Encryption**: BCrypt password encoder
- **JWT Token**: 24-hour expiration
- **CORS**: Configured for cross-origin requests
- **Protected Routes**: Authentication required for all CRUD operations

### Data Management
- **Soft Deletes**: Products and users are archived, not permanently deleted
- **UUID Primary Keys**: For better security and scalability
- **Timestamp Tracking**: Automatic date tracking for records
- **Validation**: Server-side and client-side validation

### Key Design Patterns
- **MVC Pattern**: Model-View-Controller architecture
- **Repository Pattern**: Data access abstraction
- **DTO Pattern**: Data transfer between layers
- **Component-based**: Reusable React components

## 🚦 Running in Production

### Backend
```bash
./mvnw clean package
java -jar target/OpticalClinicManagementSystem-0.0.1-SNAPSHOT.jar
```

### Frontend
```bash
npm run build
# Serve the 'dist' folder with your preferred web server
```

## 📄 License

This project is proprietary software for MM Torres Optical.

## 👥 Contributors

Developed for MM Torres Optical Clinic Management

---

**Last Updated**: November 2025
