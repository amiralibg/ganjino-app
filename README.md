# Ganjino App

Mobile client for Ganjino (گنجینو), a savings-first app focused on goal tracking, gold-price-based planning, and personal progress visibility. The app is built with Expo and React Native and targets iOS, Android, and web from a single codebase.

## Highlights

- Authenticated savings experience with onboarding and protected tabs
- Goal creation flow tied to live 18K gold pricing
- Savings log management with offline queueing and sync support
- Wishlist and progress tracking views
- User profile management and session-aware auth state
- Persian-first UI with custom typography and RTL support
- Local notifications for savings reminders and queued actions

## Tech Stack

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript
- Expo Router for file-based navigation
- TanStack Query for server state
- Zustand for local auth state
- Axios for API communication
- Expo Notifications, Haptics, and Linear Gradient

## Project Structure

```text
.
├── app/                  # Route definitions and screens
│   ├── (auth)/           # Public authentication screens
│   └── (tabs)/           # Protected application tabs
├── components/           # Shared UI and feature components
├── constants/            # Localized strings and display helpers
├── contexts/             # Theme and global React providers
├── lib/
│   ├── api/              # API client and endpoint modules
│   ├── hooks/            # Query hooks and feature hooks
│   ├── utils/            # Utility functions
│   ├── notifications.ts  # Local notification helpers
│   └── savingsQueue.ts   # Offline savings queue persistence
├── store/                # Zustand stores
└── assets/               # Icons, fonts, and static assets
```

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- Xcode for iOS simulator support on macOS
- Android Studio for Android emulator support
- A running instance of the Ganjino backend API

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Review backend connection settings.

The current API base URL is configured in `lib/api/client.ts`. The included `.env.example` is informational and documents the URLs you should use by platform:

- iOS simulator: `http://localhost:3000/api`
- Android emulator: `http://10.0.2.2:3000/api`
- Physical device: `http://<your-local-ip>:3000/api`

3. Start the Expo development server:

```bash
npm run dev
```

4. Run on a target platform:

- Press `i` for iOS
- Press `a` for Android
- Open in Expo Go on a physical device
- Use the web target from the Expo dev UI if needed

## Available Scripts

```bash
npm run dev
npm run dev:production
npm run ios
npm run android
npm run typecheck
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## Core Flows

### Authentication

The app uses token-based authentication backed by the API. Auth state is stored locally with Zustand and persisted via AsyncStorage so sessions survive app restarts.

### Savings Goals

Users can create goals based on current gold prices, track progress over time, and review gold price movement directly from the app.

### Offline Support

Savings log actions can be queued locally and synced later, allowing users to continue recording progress during unstable or unavailable network conditions.

### Theming and Localization

The UI includes light and dark theme support, Persian text content, and RTL-aware presentation for a localized native experience.

## Development Notes

- API hooks are organized under `lib/hooks`.
- Shared API modules live under `lib/api`.
- The root route wiring and providers are defined in `app/_layout.tsx`.

## Related Projects

- Mobile client: this repository
- Backend API: [github.com/amiralibg/ganjino-backend](https://github.com/amiralibg/ganjino-backend)
- Admin dashboard: [github.com/amiralibg/ganjino-admin](https://github.com/amiralibg/ganjino-admin)

## Contributing

Contributions are easiest to review when they are focused and include:

- A short summary of the user-facing change
- Screenshots or screen recordings for UI changes
- Notes about any API contract changes
- Passing `lint` and `typecheck` results

## License

No license file is currently included in this repository. Add one before distributing the project as open source.
