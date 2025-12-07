EAS / OTA Setup Notes
=====================

What I added
- Template `eas.json` at the project root with `production` and `development` build profiles.
- Updated `app.json` to include `runtimeVersion` (policy: `appVersion`) and an `expo.updates` block with a placeholder `url`.

Next steps (you must complete these to enable OTA updates)
1. Get your Expo EAS Project ID:
   - Run `eas project:create` or find the project id in the Expo Dashboard.
   - Replace `<YOUR_PROJECT_ID>` in `app.json` with your project id. The `updates.url` value should look like `https://u.expo.dev/<YOUR_PROJECT_ID>`.
2. Install and login EAS CLI (if not installed):
   - `npm install -g eas-cli`
   - `eas login` (use your Expo account credentials)
3. Configure projectId in `app.json` (optional but recommended):
   - Add `"projectId": "<YOUR_PROJECT_ID>"` under the top-level `expo` object in `app.json`.
4. Build or publish updates:
   - To create production builds: `eas build --profile production --platform all`
   - To publish an OTA update to the `production` branch: `eas update --branch production --message "My update message"`
5. If you use channels/branches, pick a branch name and use `eas update --branch <branch>` accordingly.

Notes and recommendations
- I set `runtimeVersion.policy` to `appVersion` so OTA updates match your app version. If you'd prefer a different strategy (e.g., an explicit runtime string), tell me and I can change it.
- `fallbackToCacheTimeout: 0` makes the app use cached update immediately if network update check takes longer; change this value (milliseconds) if you want different behavior.
- After you set the `projectId`, I can finish by updating `app.json` `projectId` field and the `updates.url` for you and optionally run additional validation steps.

If you want, I can insert your `projectId` now (you can paste it here) and finish the final edits and provide exact commands tailored to your release flow.
