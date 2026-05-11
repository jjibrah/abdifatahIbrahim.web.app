# Cinematic Systems Portfolio 🚀

A high-performance, production-grade portfolio platform architected for systems engineers and product founders. This platform is fully dynamic, powered by a custom Firebase CMS, and features a cinematic dark-themed UI.


## 🏗️ Technical Architecture

This project is built with a "Systems First" philosophy, decoupling the content layer from the presentation layer to allow real-time updates without code redeployment.

- **Frontend**: Vanilla JS (ES6+), CSS3 (Custom Design System), Semantic HTML5.
- **Backend/CMS**: 
  - **Firestore**: Real-time NoSQL database for projects, services, and site metadata.
  - **Auth**: Secure session management for the Admin Dashboard.
  - **Storage**: Cloud asset hosting for resumes, profile images, and project media.
  - **Analytics**: Behavioral event tracking.
  - **Functions**: Server-side logic for secure inquiries.

## ✨ Core Features

### 1. Unified CMS Orchestration
The entire site is synchronised with a `meta/global` document. You can update your Hero copy, Profile identity, and Social connectivity metrics via the Admin Dashboard.

### 2. Interactive Systems Visualizations
- **Bento Case Studies**: Interactive project cards with 3D tilt effects and depth-based glow.
- **Cinematic Globe**: A custom Canvas-based particle globe rendering real-time depth.
- **Bento Projects**: A multi-tiered display for "Flagship Systems" and "Core Modules".

### 3. Cloud-Powered Asset Management
The Admin Dashboard features a native file upload pipeline. Selecting a file automatically hosts it on Google's global CDN via Firebase Storage and updates the live site.

### 4. Smart Communication Layer
- **Intent-based Inquiries**: Direct routing for Recruiters, Startup Partners, and Freelance clients.
- **Automated Social Links**: Smart detection for `mailto:` and `wa.me` (WhatsApp) link construction with pre-filled professional messages.

## 📂 Project Structure

```text
├── index.html           # Main Entry Point (Cinematic Frontend)
├── pages/
│   └── admin/           # Secure Administrative Environment
│       ├── admin.html   # CMS Control Surface
│       └── login.html   # Access Control Layer
├── js/
│   ├── main.js          # Production Sync Engine & UI Logic
│   ├── admin.js         # CMS Orchestration & Storage Logic
│   └── firestore.js     # Platform Initialization
├── css/
│   └── main.css         # Global Design System & Animations
└── firebase.json        # Cloud Deployment Configuration
```

## 🚀 Deployment

The project is configured for **Firebase Hosting**.

1.  Initialize Firebase CLI: `firebase init`
2.  Deploy to Production: `firebase deploy`

---

**Designed and Built with focus on Architectural Integrity.**
