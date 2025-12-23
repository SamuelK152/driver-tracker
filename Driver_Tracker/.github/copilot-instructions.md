# Driver Tracker - Copilot Instructions

## Project Overview
This is a MERN stack application (MongoDB, Express, React, Node.js) for tracking delivery driver metrics, scheduling, and fleet management.
- **Client**: React (Vite), Tailwind CSS, React Router.
- **Server**: Node.js, Express, Mongoose.
- **Shared**: Common logic in `shared/` used by both client and server.

## Architecture & Patterns

### Client-Side (`client/`)
- **Data Fetching**:
  - ALWAYS use the `useApi` hook (`client/src/lib/useApi.js`) for API interactions in components.
  - `useApi` provides `get`, `post`, `put`, `del` methods along with `loading` and `error` states.
  - `apiClient.js` handles the base Axios instance and authentication interceptors.
- **Routing**:
  - Routes are defined in `App.jsx`.
  - Protected routes are wrapped in `ProtectedRoute` and `Navigation`.
- **Components**:
  - Use `PageShell` (if available) or consistent layout wrappers for pages.
  - Use `DetailedView` for master-detail layouts (list on left, details on right).
- **Styling**:
  - Use Tailwind CSS utility classes. Avoid custom CSS files unless necessary.

### Server-Side (`server/`)
- **Route Handlers**:
  - ALWAYS wrap route handlers with `asyncHandler` (`server/utils/asyncHandler.js`) to handle async errors automatically.
  - Do not use try-catch blocks in controllers unless specific error handling logic is needed beyond the default.
- **Models**:
  - Mongoose models are in `server/models/`.
  - Use `ref` for relationships (e.g., `userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }`).
- **Middleware**:
  - `auth.js` for protecting routes.
  - `errorHandler.js` for centralized error responses.

### Shared Code (`shared/`)
- Logic that is platform-agnostic (e.g., date formatting, route code parsing) should be placed in `shared/`.
- Import these in both client and server as needed.

## Developer Workflow

### Running the Project
- **Server**: `cd server && npm run dev` (Runs on port 5000 by default).
- **Client**: `cd client && npm run dev` (Runs via Vite).

### Environment Variables
- Client: `VITE_API_BASE_URL` (defaults to http://localhost:5000).
- Server: `MONGO_URI`, `PORT`, `JWT_SECRET`.

## Coding Conventions
- **Dates**: Use `date-fns` for date manipulation on the client.
- **Imports**: Use absolute paths or consistent relative paths.
- **Error Handling**:
  - Server: Throw errors with status codes (e.g., `res.status(404); throw new Error('Not found');`).
  - Client: `useApi` captures errors; display them via UI alerts or toast notifications.

## Key Files
- `client/src/lib/useApi.js`: Primary hook for API calls.
- `server/utils/asyncHandler.js`: Wrapper for async route handlers.
- `server/index.js`: Server entry point and middleware setup.
- `client/src/App.jsx`: Main routing configuration.
