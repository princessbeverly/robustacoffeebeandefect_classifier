# Robusta Coffee Defect Classifier ☕📱

An intelligent mobile application designed to help coffee producers, roasters, and enthusiasts identify and classify defects in Robusta coffee beans using image processing and automated reporting.

## 🌟 Overview

The Robusta Coffee Defect Classifier streamlines the quality control process of green coffee beans. By analyzing images of coffee batches, the app detects bean counts and identifies specific defects, allowing users to save digital records and export professional PDF quality reports.

### Key Features

* **Batch Scanning:** Uses image analysis to detect total bean count and defect types.
* **Local Storage:** Save, rename, and manage historical batch reports locally on the device.
* **Meta-Data Management:** Attach producer details, origin (e.g., Caraga, Philippines), and weight to specific batches.
* **PDF Export:** Generate professional PDF reports including batch statistics and metadata for sharing with buyers or quality inspectors.
* **Clean UI:** A minimalist, user-friendly interface built with React Native and Poppins typography.

## 🚀 Technical Stack

* **Framework:** React Native (TypeScript)
* **Navigation:** React Navigation
* **Storage:** Custom local storage utility for persistent report management.
* **PDF Generation:** react-native-html-to-pdf (or similar service) via reportService.
* **Styling:** StyleSheet with custom Poppins fonts.

## 📂 Project Structure (Highlights)

```
src/
├── assets/             # Icons, images, and brand assets
├── screens/            
│   ├── savedBatchReportPage.tsx  # View & manage saved reports (Files screen)
│   ├── reportPage.tsx            # Detailed view of a specific scan
│   └── ...
├── services/           
│   └── reportService.ts          # Logic for PDF creation and sharing
└── utils/              
    ├── reportStorage.ts          # CRUD operations for local report files
    └── reportHtml.ts             # HTML templates for PDF rendering
```

## 🛠️ Installation & Setup

### Prerequisites

* Node.js (v16+)
* React Native CLI or Expo CLI
* Android Studio (for Android) / Xcode (for iOS)

### Steps

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/RobustaCoffeeDefectClassifier.git
cd RobustaCoffeeDefectClassifier
```

2. **Install dependencies:**

```bash
npm install
# or
yarn install
```

3. **Install CocoaPods (iOS only):**

```bash
cd ios && pod install && cd ..
```

4. **Run the application:**

```bash
# For Android
npx react-native run-android

# For iOS
npx react-native run-ios
```

## 📖 How to Use

1. **Scan:** Navigate to the scan screen and capture/upload an image of your coffee beans.
2. **Review:** View the detected defect count and total bean stats on the `reportPage`.
3. **Save:** Save the report to your device.
4. **Manage:** Go to the Files screen (`savedBatchReportPage`) to:

   * Rename reports for better organization.
   * Export to PDF by adding metadata like Producer and Origin.
   * Delete old records.

## 🎨 Design Assets

The app uses a specific color palette for status and branding:

* **Primary Brown:** #775242 (Branding & Confirmation)
* **Export Green:** #14AE5C (PDF Export)
* **Delete Red:** #A71E22 (Destructive Actions)
* **Text/Meta:** #333333 / #A7A7A2
