# Study Session Tracker

## What It does
The app is a moobile study session tracker that lets you time focused study session by subject and review your study history. I chose this idead because I thought this would be a cool app which I would actually use, and it is a simple way to see where one's study time goes each week.


## Screens
The first screen is the main page where the user can type a new subject, or select an existing subject which they have used before, then they can start a study session to begin the live timer on the screen. Then the user can press "Stop Session" when they are ready and the session will automatically be saved, unlesss it is <10s, then it will be discarded.

The second screen shows all of the past sessions grouped by date, showing the most recent on top. A weekly summary card is displayed at the top of the screen showing the total study time over the past 7 days, with a breakdown per-subject. Each session row shows the session subject, start time, and duration. The user can long-press any session to delete and pull down to refresh,


## Setup
Prerequisites:
Node.js v18 or later
Expo Go app installed on your phone (iOS or Android)

Install & Run:
npm install
npx expo start
Scan the QR code in the terminal with Expo Go (Android) or the Camera app (iOS) to open the app on your device. You can also press i to open in the iOS Simulator or a for the Android Emulator if you have those configured.

Dependencies
All dependencies install via npm install. The only addition beyond the default Expo template is @react-native-async-storage/async-storage for persisting study sessions and subjects to local device storage. No API keys, backend services, accounts, or environment variables are needed, the app is fully offline.


## One Thing That Surprised Me
I was surprised by some of the formatting issues faced. I was impressed with how well Expo Go worked with ease of use for testing the app, however, when the app was first created there were numbers being covered, unclear interaction, and issues with a poor UI which mainly occured as a result of the model strictly limiting itself to the spec.md. I had to go in and make modifications to allow the AI to create a better UI through the formatting for the app, and enhancing modifications.