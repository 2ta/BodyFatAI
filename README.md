<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# BodyFatAI - AI-Powered Body Fat Estimation App

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

An AI-powered mobile and web application that estimates body fat percentage using Google's Gemini AI. Upload photos or use your camera to get instant physique analysis.

View your app in AI Studio: https://ai.studio/apps/drive/1Gh57xRzL87hYK_HaHDMEtSXlu6QoKoB5

## Run Locally (Web)

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key
3. Run the app:
   ```bash
   npm run dev
   ```

## Build Android APK

This project uses [Capacitor](https://capacitorjs.com/) to convert the React web app into a native Android application.

### Prerequisites for Android Build

1. **Java Development Kit (JDK) 17 or higher**
   - Download from [Oracle](https://www.oracle.com/java/technologies/downloads/) or use [OpenJDK](https://openjdk.org/)
   - Verify installation: `java -version`

2. **Android Studio**
   - Download from [Android Studio](https://developer.android.com/studio)
   - Install Android SDK (API level 33 or higher recommended)
   - Set up Android SDK path in environment variables

3. **Environment Setup**
   ```bash
   # macOS/Linux - Add to ~/.zshrc or ~/.bashrc
   export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
   # export ANDROID_HOME=$HOME/Android/Sdk  # Linux
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

### Build Steps

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Set your Gemini API Key**:
   Create a `.env.local` file in the root directory:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Build the web app**:
   ```bash
   npm run build
   ```

4. **Sync Capacitor**:
   ```bash
   npm run cap:sync
   ```
   This copies your web build to the Android project.

5. **Open in Android Studio**:
   ```bash
   npm run cap:open:android
   ```
   Or manually:
   ```bash
   npx cap open android
   ```

6. **Build APK in Android Studio**:
   - Wait for Gradle sync to complete
   - Go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - Or use the terminal in Android Studio:
     ```bash
     ./gradlew assembleDebug
     ```
   - The APK will be generated at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Build Release APK (for distribution)

1. **Generate a keystore** (first time only):
   ```bash
   keytool -genkey -v -keystore bodyfatai-release.keystore -alias bodyfatai -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Create `android/keystore.properties`**:
   ```
   storePassword=your_store_password
   keyPassword=your_key_password
   keyAlias=bodyfatai
   storeFile=../bodyfatai-release.keystore
   ```

3. **Update `android/app/build.gradle`** to use the keystore (Capacitor usually handles this automatically)

4. **Build release APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   The release APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Quick Build Command

Use this single command to build and sync:
```bash
npm run cap:build:android
```

### Troubleshooting

- **Java not found**: Install JDK 17+ and ensure it's in your PATH
- **Gradle sync fails**: Open Android Studio and let it sync Gradle automatically
- **Camera not working**: Ensure camera permissions are granted in Android settings
- **API key issues**: Make sure `.env.local` exists and contains `GEMINI_API_KEY`

### Project Structure

```
BodyFatAI/
├── android/              # Android native project
├── components/          # React components
├── services/            # API services (Gemini AI)
├── dist/               # Web build output (synced to Android)
└── capacitor.config.ts # Capacitor configuration
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build web app for production
- `npm run cap:sync` - Sync web build to native projects
- `npm run cap:add:android` - Add Android platform (already done)
- `npm run cap:open:android` - Open Android project in Android Studio
- `npm run cap:build:android` - Build web app, sync, and open Android Studio

### Notes

- The app requires internet connection to use Gemini AI
- Camera permissions will be requested on first use
- For production builds, you'll need to sign the APK with a keystore
- The app uses Capacitor Camera plugin for better mobile camera integration
