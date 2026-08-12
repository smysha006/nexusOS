# Mini Inventory System (Nexus)

An ultra-modern, lightweight Inventory Management System built for the MongoDB Learning Sprint & Mini Hackathon. 
Demonstrates core MongoDB usage, schema design, and aggregation pipelines without bloated dependencies.

## Architecture

- **Backend:** Node.js, Express, Mongoose
- **Database:** Local MongoDB (`mongod` on `mongodb://127.0.0.1:27017`)
- **Frontend:** Vanilla HTML, CSS, JavaScript (Zero build tools, purely aesthetic and responsive)

## Setup Instructions

1. **Start MongoDB Locally:** Ensure your local `mongod` service is running on the default port `27017`.
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Environment Variables:** Create a `.env` file in the root directory (already included in this repo) with:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/mini_inventory
   PORT=3000
   ```
4. **Start the Server:**
   ```bash
   npm start
   ```
   Or for development mode (if `nodemon` is installed):
   ```bash
   npm run dev
   ```
5. **Open Application:** Open your browser and navigate to `http://localhost:3000`.

## Schema Design: The Two-Collection Approach

This application utilizes a two-collection schema to effectively model inventory data and trace historical actions.

1. **`products` Collection**: Stores the core inventory data (name, category, price, quantity, thresholds). It utilizes appropriate Mongoose schemas with validation and creates targeted MongoDB indexes (Text, Ascending, Descending) to optimize search and filtering query performance.
2. **`activity_logs` Collection**: Operates as an append-only audit trail. Instead of embedding history inside product documents (which could cause unbound document growth and exceed the 16MB limit), every Create/Update/Delete action on a product writes a standalone log entry here.
   - It references the `products._id` using an `ObjectId` reference.
   - It denormalizes the `productName` into the log document. This is a crucial MongoDB design pattern: because product documents might be deleted, keeping a hard reference would break historical logs. By duplicating just the product name in the log, the history remains readable even if the source product ceases to exist.

## Features & MongoDB Usage

- **Aggregations:** Computes dashboard KPIs (Total Value, Category Distribution) using `$group`, `$project`, `$sum`, and `$multiply`.
- **Text Search:** Implements `$regex` search combined dynamically with field filters.
- **Advanced Querying:** Employs `$expr`, `$and`, `$gt`, and `$lte` to implement smart, dynamic "Low Stock" logic where the threshold is defined per-document rather than a hardcoded constant.
- **Sorting & Filtering:** API supports comprehensive sorting (`.sort()`) and filtering combined in single query objects.
