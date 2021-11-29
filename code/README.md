# Open Personal Archive™ - Codebase

The folders contained within this folder comprise the Open Personal Archive™ (OPA) codebase.

## Configuring the Code

To configure this code to run with your own Google Firebase project, you must update the configuration values in the following files:
1. [.firebaserc](./.firebaserc)
1. [test-config.json](./domainlogic/test-config.json)
2. [open-personal-archive-firebase-adminsdk-credential.json](./functions/open-personal-archive-firebase-adminsdk-credential.json)
3. [firebase_config.js](./webapp/firebase_config.js)

When you see a value such as "[YOUR_FIREBASE_PROJECT_NAME_HERE]" in the files, please replace that entire value (including the brackets) with the name of your own Google Firebase project as shown in your Google Firebase console (see https://console.firebase.google.com/project/[PROJECT_NAME]/overview replacing "[PROJECT_NAME]" with your project name).

Otherwise, please follow the direction in the file (if specified) as to how to obtain the correct values for your own Google Firebase project.

## Running the Code

After configuring this code, before you can run this code, you must:
1. Install the Google Firebase CLI (see [Google Firebase CLI Docs](https://firebase.google.com/docs/cli))
2. Open a new command prompt and navigate to this folder (the "code" folder of your local OPA base folder)
3. Run "firebase login", specifying the credentials of the Google account that manages your Google Firebase project
4. Run "firebase init", specifying:
    * Specify you are ready using "Y"
    * Select Firestore, Functions, Hosting (the first option, without GitHub), Storage, and optionally Emulators (if you desire to use them)
    * Otherwise, accept the default value by pressing enter
5. Run "firebase deploy"
6. Navigate to the URL of your Google Firebase Hosting site where you deployed the code


Copyright © 2021 Open Personal Archive™
