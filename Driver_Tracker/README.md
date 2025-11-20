# Driver Tracker

A Node.js, React + Vite app for tracking delivery driver metrics.

## Prerequisites

- Node.js
- MongoDB (running locally or URI provided in server/.env)

## Setup

1.  **Server Setup**
    ```bash
    cd server
    npm install
    # Create .env file if not exists (already created)
    npm run dev
    ```

2.  **Client Setup**
    ```bash
    cd client
    npm install
    npm run dev
    ```

## Features

- User Registration & Login
- Excel Import of Driver Metrics
- Dashboard to view imported data
- History view to track driver performance over time
