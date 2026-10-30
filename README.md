# Study Buddy

Study Buddy is an Expo mobile app for student profiles, course-based buddy matches, study scheduling, course chat, and campus study-space reservations.

## Open the app in Expo Go from Replit

1. Open the **Study Buddy** preview and make sure its Expo workflow is running.
2. In Replit, open **Preview on your phone** to display the project's QR code.
3. Install **Expo Go** on your iPhone or Android device, then scan that QR code.
4. Keep the Replit project running while you use the preview. Code changes refresh in the app automatically.

The QR code is generated for the running development preview. It is not a permanent install link.

## Open the source in VS Code

Open this project folder in VS Code. To start the Expo Go preview, install the packages and run:

```bash
npm install
npx expo start --tunnel
```

Then scan the new QR code with Expo Go. The first device launch asks for calendar access only when you choose **Sync**.

## Deploy to Netlify

Connect this GitHub repository to Netlify and use the repository root as the base directory. The included `netlify.toml` configures the production build (`npm run build`) and publishes the generated `dist` folder. The build exports the app as a static Expo web site.

## Main source files

- `app/(tabs)/index.tsx` — home and upcoming session
- `app/(tabs)/matches.tsx` — course and availability matching
- `app/(tabs)/calendar.tsx` — month view, scheduling, and device-calendar sync
- `app/(tabs)/chat.tsx` — course rooms and local message history
- `app/(tabs)/locations.tsx` — study-space search and saved reservations
- `app/profile.tsx` — name, major, courses, availability, and study preference
- `context/StudyData.tsx` — shared state and on-device persistence
- `components/study-ui.tsx` — shared app controls and visual components
- `constants/colors.ts` — app color palette
- `assets/images/icon.png` — Study Buddy app icon
- `app.json`, `package.json`, `tsconfig.json`, and `metro.config.js` — app setup

## Current prototype data

Profiles, matches, chat messages, sessions, and reservations are saved on the device. The buddy directory and campus locations are sample data, so they are not visible to other users and do not reserve a real campus room. Calendar sync writes sessions to a writable calendar on the phone.
