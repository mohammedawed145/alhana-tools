# مؤسسة الهنا لتجارة العدد وارد الامارات REST API

Base URL: `http://localhost:5000/api`

All responses use `{ success, message, data }`; errors use `{ success: false, message }`.

## Authentication

- `POST /auth/login` — admin credentials only: `{ email, password }`, returns `{ token, user }`.
- `POST /auth/register` — intentionally disabled; customers use guest checkout.
- `GET /auth/me` — Bearer token required.

Send `Authorization: Bearer <token>`. JWT contains `userId` and `role`. Passwords are bcrypt-hashed and never returned.

## Products

- `GET /products?page=1&limit=12&search=&category=&brand=&minPrice=&maxPrice=&stock=in&featured=true&sort=-createdAt`
- `GET /products/:id`
- `POST /products` (admin, multipart form: `images` up to 8)
- `PUT /products/:id` (admin)
- `DELETE /products/:id` (admin, soft delete)

## Categories

- `GET /categories`
- `POST|PUT|DELETE /categories/:id` (admin; POST has no id)

## Orders

- `POST /orders` (public guest checkout; includes optional `governorate`)
- `GET /orders/my-orders` (authenticated)
- `GET /orders/:id` (owner or admin)
- `POST /orders/:id/payment-receipt` (authenticated owner or admin when customer accounts are enabled; guest customers send receipts through WhatsApp)
- `GET /orders/:id/payment-receipt` (admin)
- `GET /orders` (admin)
- `PUT /orders/:id/status` (admin)
- `PUT /orders/:id/payment-status` (admin)
- `PUT /orders/:id/shipment` (admin)

The server re-reads product prices, applies `discountPrice` when present, validates stock, and reserves stock inside a MongoDB transaction before creating an order.

## Users and messages (admin)

- `GET /users`, `PUT /users/:id`, `DELETE /users/:id`
- `POST /messages` (public contact form)
- `GET /messages`, `PUT /messages/:id`

## Payment policy

Shipping costs are paid in advance through InstaPay or Vodafone Cash. Product balance can be cash on delivery or paid in full. Automatic bank verification is not implemented.

## Uploads

Images accept jpg, jpeg, png, webp, max 5 MB. Receipts accept jpg, png, webp, PDF, max 8 MB. Configure persistent storage such as Cloudinary, S3, or a persistent disk before production deployment.

## Run

1. Copy `.env.example` to `.env` and fill the values.
2. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
3. Run `npm install`, then `npm run seed`, then `npm run dev`.
