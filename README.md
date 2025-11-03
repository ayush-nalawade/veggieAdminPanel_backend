# Admin Backend API

Separate backend API for the VeggieFresh Admin Panel.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp env.example .env
```

Update `.env` with your configuration. Note that `MONGO_URI` and `JWT_SECRET` should be the same as your main backend to share the same database and authentication.

3. **Start the development server:**
```bash
npm run dev
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### Authentication
- `POST /auth/login` - Admin login
- `GET /auth/me` - Get admin profile

### Categories
- `GET /categories` - Get all categories
- `GET /categories/:id` - Get category by ID
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Products
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Orders
- `GET /orders` - Get all orders
- `GET /orders/stats` - Get order statistics
- `GET /orders/:id` - Get order by ID
- `PATCH /orders/:id/status` - Update order status

## Security

- All routes require JWT authentication
- Admin role verification for all endpoints
- CORS configured for admin panel origin
- Rate limiting on authentication routes

## Building for Production

```bash
npm run build
npm start
```

