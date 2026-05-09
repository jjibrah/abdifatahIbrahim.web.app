# 🛠️ Universal CMS & Admin Portal: Architecture & Execution Plan

This document outlines the engineering roadmap to transform the static portfolio into a dynamic, scaleable platform managed by a secure administrative interface.

---

## 1. Core Architecture
- **Infrastructure:** Firebase (Firestore + Auth + Storage).
- **Backend-as-a-Service:** Firestore will act as the "Source of Truth" replacing static JS objects.
- **Security:** Firebase Security Rules will ensure only authenticated "Admin" users can write to the database.

---

## 2. Infrastructure Setup (Phase 1)

### A. Database Collections
We will establish three primary collections in Firestore:
1. `projects`: Title, subtitle, tech stack, description, liveUrl, repoUrl, and imagePath.
2. `services`: Tier name, features list, pricing, and system level.
3. `config`: Site-wide settings (SEO Meta, resume link, contact email).

### B. Security Implementation
**Firestore Rules:**
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    // Public can READ everything, only ADMIN can WRITE
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == "YOUR_ADMIN_UID";
    }
  }
}
```

---

## 3. The Backend Engine: Migration (Phase 2)

**Step 1: The Migration Script**
We will create a temporary `migrate.js` to push your current `projectsData` into Firestore to ensure we have a working baseline.

**Step 2: Frontend Data Fetching**
We will update `js/main.js` to replace:
```javascript
const projectsData = { ... }; // Static
```
with:
```javascript
import { collection, getDocs } from "firebase-firestore";
const querySnapshot = await getDocs(collection(db, "projects"));
const projectsData = {};
querySnapshot.forEach(doc => { projectsData[doc.id] = doc.data(); });
```

---

## 4. The Admin Portal: `/admin/dashboard.html` (Phase 3)

### Features to Build:
1.  **Auth Gateway:** A glassmorphism login page using `Firebase Auth`.
2.  **Project Content Manager:**
    - A table list of current projects.
    - "Add New Project" modal with form fields.
    - "Edit/Delete" functionality.
3.  **Image Uploader:** Integrated `Firebase Storage` drag-and-drop for project thumbnails.
4.  **Real-time Preview:** A "View Draft" mode to see changes before publishing.

---

## 5. Execution Steps (Checklist)

### 🟩 Step 1: Authentication Setup
- [ ] Enable **Email/Password** authentication in Firebase Console.
- [ ] Create your Admin account.
- [ ] Record your `UID` and lock firestore rules to that UID.

### 🟩 Step 2: Database Hybridization
- [ ] Create `js/cms-engine.js` to handle all Firestore CRUD operations.
- [ ] Integrate the engine into the main site logic.

### 🟩 Step 3: UI Construction
- [ ] Create `pages/admin/login.html`.
- [ ] Create `pages/admin/dashboard.html`.
- [ ] Implement the Project Editor Form.

### 🟩 Step 4: Maintenance & Deployment
- [ ] Update `firebase.json` cleanup logic.
- [ ] Final `firebase deploy` for the Admin Portal.

---

## 6. Success Metrics
- **Dynamic Content:** Adding a project in the CMS updates the homepage in < 2 seconds.
- **Security:** Verified 403 Forbidden errors for unauthorized write attempts.
- **Autonomy:** Zero code changes required for monthly content updates.
