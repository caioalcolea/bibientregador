# BIBI.track Mobile (Next.js Web Implementation)

This project is a web application built with Next.js, designed to integrate with the BIBI.track delivery management system. It provides a login interface for drivers and embeds the existing BIBI.track PWA within a web view (iframe).

**Note:** The original project proposal requested a native Android application. This implementation uses a Next.js web framework based on the provided scaffold. Features like true background location tracking and deep native integrations are limited in a web environment compared to a native app.

## Core Features

- **User Authentication**: Secure login for drivers using company code, email, and password via Firebase Authentication (placeholder, needs full implementation).
- **PWA Integration**: Displays the existing BIBI.track PWA (e.g., `https://bibitrack.com.br/{codigo_empresa}/app/`) within the application after successful login.
- **Location Tracking (Simulation)**: Simulates location tracking using the browser's Geolocation API and sends data to Firebase Firestore (placeholder). A Cloud Function would be needed to forward this data to the Traccar server.

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- A Firebase project (configure Authentication and Firestore)
- A Traccar server instance

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Configure Environment Variables:**
    - Copy the example environment file:
      ```bash
      cp .env.local.example .env.local
      ```
    - Edit `.env.local` and fill in your Firebase project configuration details and your Traccar server URL. You can find the Firebase details in your Firebase project settings.

4.  **Firebase Setup:**
    - Ensure Firebase Authentication is enabled (Email/Password provider).
    - Set up Firestore and create the necessary collections (`empresas`, `entregadores`, `posicoes`, `entregas`, `dispositivos`) based on the models in `src/lib/types.ts`.
    - Configure Firestore Security Rules to allow appropriate access for authenticated users.
    - (Optional) Set up Firebase Cloud Functions for tasks like syncing data or forwarding positions to Traccar.

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:9002](http://localhost:9002) (or the specified port) with your browser to see the application.

### Building for Production

```bash
npm run build
npm run start
# or
yarn build
yarn start
```

## Project Structure

- `src/app/`: Main application pages (Login, Dashboard).
- `src/components/`: Reusable UI components (LoginPage, ui/*).
- `src/lib/`: Core logic, utilities, type definitions, Firebase setup (`firebase.ts`, `utils.ts`, `types.ts`).
- `src/services/`: Services for interacting with external APIs (Traccar, Location Simulation).
- `src/hooks/`: Custom React hooks (e.g., `useToast`, potentially `useAuth`).
- `public/`: Static assets.
- `src/ai/`: Genkit AI flows (Do not modify).

## Key Files

- `src/app/page.tsx`: Entry point, renders the `LoginPage`.
- `src/components/login-page.tsx`: Handles user login form and logic.
- `src/app/dashboard/page.tsx`: Displays the main interface after login, embedding the PWA.
- `src/lib/firebase.ts`: Firebase initialization (requires configuration).
- `src/services/locationService.ts`: Simulates background location tracking.
- `src/services/traccar.ts`: Contains functions to interact with the Traccar API (sending positions, potentially fetching data).
- `src/lib/types.ts`: Defines the TypeScript interfaces for data models.
- `.env.local`: Environment variables (Firebase keys, API URLs). **Do not commit this file.**

## Important Considerations (Web vs. Native)

- **Background Tracking**: True, persistent background location tracking like a native app service is not reliably possible in a standard web browser. The current implementation uses foreground geolocation. PWAs offer some background capabilities via Service Workers, but they are less robust than native services.
- **Native APIs**: Access to device hardware (beyond basic geolocation, camera, etc.) and deep OS integration (like responding to boot completed) is not possible in a web app.
- **WebView Integration**: While an `iframe` can display the PWA, the deep `JavascriptInterface` communication described for native Android WebView is not directly applicable. Communication might rely on `postMessage` if the PWA is designed to support it.
# bibientregador
# bibientregador
# bibientregador
# bibientregador
# bibientregador
