# Quick APK Build Guide

## ✅ Pre-build Steps (Already Completed)
- ✅ Web app built successfully
- ✅ Capacitor synced with Android project
- ✅ Android Studio ready

## 📱 Building the APK in Android Studio

### Step 1: Wait for Gradle Sync
- Android Studio will automatically start syncing Gradle dependencies
- Wait for the sync to complete (check bottom status bar)
- If sync fails, click "Sync Project with Gradle Files" button

### Step 2: Build Debug APK (For Testing)

**Using Menu:**
1. Go to `Build` → `Generate App Bundles or APKs...`
2. In the dialog that opens, select **"APK"** (not Android App Bundle)
3. Click **"Next"**
4. Select **"debug"** build variant
5. Click **"Create"**
6. Wait for build to complete
7. Click **"locate"** in the notification when done

**Alternative: Using Terminal in Android Studio**
Open the terminal at the bottom of Android Studio and run:
```bash
cd android
./gradlew assembleDebug
```

**APK Location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 3: Install on Device
- Transfer the APK to your Android device
- Enable "Install from Unknown Sources" in device settings
- Tap the APK file to install

### Step 4: Build Release APK (For Distribution)

**First Time Setup - Create Keystore:**
```bash
cd android
keytool -genkey -v -keystore bodyfatai-release.keystore -alias bodyfatai -keyalg RSA -keysize 2048 -validity 10000
```

**Create `android/keystore.properties`:**
```
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=bodyfatai
storeFile=../bodyfatai-release.keystore
```

**Build Release APK:**
1. Go to `Build` → `Generate App Bundles or APKs...`
2. Select **"APK"**
3. Select **"release"** build variant
4. Click **"Create"**

Or use terminal:
```bash
cd android
./gradlew assembleRelease
```

**Release APK Location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

## 🔄 Updating the App

After making changes to your React code:

```bash
# 1. Build web app
npm run build

# 2. Sync to Android
npm run cap:sync

# 3. Rebuild APK in Android Studio
```

## ⚠️ Troubleshooting

- **Gradle sync fails**: Check internet connection, Android SDK installed
- **Build errors**: Make sure Java JDK 17+ is installed and configured
- **Camera not working**: Verify permissions in AndroidManifest.xml (already configured)
- **API key issues**: Ensure `.env.local` has `GEMINI_API_KEY` set
- **"Generate App Bundles or APKs" not working**: Use terminal method: `./gradlew assembleDebug`

## 📝 Notes

- Debug APK is unsigned and for testing only
- Release APK requires signing with keystore for distribution
- The app requires internet connection for Gemini AI API
- Camera permissions will be requested on first use
