# Ekdant Dental Clinic - Patient Management System

A comprehensive dental clinic management system built with Next.js and Convex.

## 🏗️ Architecture

```
┌─────────────────────┐
│    Next.js App      │ (Port 3000)
│ (UI + API routes)   │
└──────────┬──────────┘
           │ Convex SDK
           │
┌──────────▼──────────┐
│      Convex DB      │
│   (Data + logic)    │
└─────────────────────┘
```

## 📋 Features

- **Patient Management**: Register and manage patient records
- **Prescription System**: Create and manage prescriptions with teeth charts
- **Clinical Images**: Client-side image storage (IndexedDB/localStorage)
- **Billing**: Generate and track bills with payment status
- **Inventory**: Manage medicines and medical inventory
- **Authentication**: Email OTP login with 4-digit OTP, resend support, and 12-hour OTP validity

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Convex project/deployment
- Gmail account with App Password (for OTP email delivery via Nodemailer)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables** in `.env.local`:
   ```env
   NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   CONVEX_DEPLOYMENT=dev:your-deployment

   AUTH_LOGIN_EMAIL=drlalit@ekdantdentalclinics.com
   AUTH_LOGIN_PASSWORD=Admin@123
   AUTH_OTP_TO_EMAIL=drlalit@ekdantdentalclinics.com

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-16-char-gmail-app-password
   SMTP_FROM=your-gmail@gmail.com
   ```

3. **Push Convex functions/schema**:
   ```bash
   npx convex dev --once
   ```

4. **Start the app**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - App: http://localhost:3000

## Getting Started

Run the Next.js development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication (OTP)

- Login credentials are verified first.
- A 4-digit OTP is sent to the configured email using Nodemailer.
- OTP validity is 12 hours.
- Users can resend OTP from the login screen.
- When a new OTP is sent, previous active OTP sessions are invalidated.
- If OTP is expired, the UI/API shows `OTP expired`.

## 📁 Project Structure

```
Ekdant-Admin/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin pages (inventory, patients, prescriptions, etc.)
│   ├── api/               # Next.js API routes (pdf + auth OTP)
│   └── auth/              # Authentication pages
├── components/            # React components
├── services/              # API service layer
│   ├── adminuser.ts       # Auth services
│   ├── patients.ts        # Patient management
│   ├── prescription.ts    # Prescription services
│   ├── bills.ts          # Billing services
│   └── medicine.ts       # Medicine/inventory
├── convex/               # Convex schema/functions
├── lib/                  # Utilities
│   └── apiClient.ts      # Generic API utilities
└── .env.local           # Frontend environment variables
```

## 📡 API Endpoints

### Quick Reference
- **OTP Request**: `POST /api/auth/request-otp`
- **OTP Verify**: `POST /api/auth/verify-otp`
- **Generate Bill PDF**: `POST /api/generate-bill`
- **Generate Prescription PDF**: `POST /api/generate-prescription`

## 🗄️ Database Schema

- **users** - User authentication records
- **auth_otps** - OTP sessions for login
- **patients** - Patient records  
- **prescriptions** - Prescription data with teeth chart (JSON)
- **bills** - Billing with items (JSON)
- **medicines** - Inventory management
- **reference_counter** - Auto-incrementing reference numbers

## 📚 Notes

- This repository currently uses Convex for data storage and backend function execution.
- If SMTP variables are missing, OTP email delivery will fail with `Missing SMTP_USER or SMTP_PASS for OTP email delivery`.

## 🚢 Deployment

### Frontend (Next.js)
- Build: `npm run build`
- Deploy to Vercel, Netlify, or custom server
- Set production Convex and SMTP environment variables

### Database
- Use Convex production deployment
- Keep secrets in your host's environment manager

## Learn More

### About Next.js

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## 📝 Development Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npx convex dev --once` - Push Convex schema/functions once

You can check out the [Next.js GitHub repository](https://github.com/vercel/next.js) for more examples and updates.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Clinical Images Storage System

### Overview
The application uses a client-side image storage system that supports multiple storage methods:

1. **Primary Storage**: IndexedDB (for modern browsers)
2. **Fallback Storage**: localStorage (for compatibility)
3. **Database Storage**: Only prescription metadata stored in Convex (images are NOT stored in database)

### Key Features
- **Client-side only**: Images are stored locally on the user's device
- **Cross-browser compatibility**: Works on devices that don't support IndexedDB
- **Automatic fallback**: Seamlessly switches to localStorage if IndexedDB fails
- **Error handling**: Comprehensive error handling with user-friendly messages
- **Storage management**: Automatic cleanup of old data when storage limits are reached
- **Debug tools**: Built-in debugging component for troubleshooting

### Important Notes
- **Images are NOT stored in the database** - they are stored locally on each device
- **Images are device-specific** - they won't sync between different devices
- **Images persist between sessions** - they are saved in browser storage
- **Storage limits apply** - browser storage has size limits (typically 5-10MB for localStorage, much more for IndexedDB)

### Recent Fixes
- **Removed database storage for images** to avoid schema issues
- Fixed image loading issues when editing prescriptions
- Added proper error handling for storage operations
- Implemented fallback storage mechanism for unsupported browsers
- Added image removal functionality
- Improved file validation (size and type checking)
- Enhanced cross-device compatibility

### Build Status
- ✅ **Production build successful** - All TypeScript and ESLint errors resolved
- ✅ **Image storage working** - No database schema dependencies 
- ✅ **Cross-browser compatibility** - Supports all modern browsers
- ✅ **Error handling robust** - Comprehensive fallback mechanisms

### Usage
Images are automatically saved when:
- A prescription is created or updated
- Images are uploaded through the clinical images interface
- The form is submitted successfully

### Troubleshooting
If you encounter image-related issues:
1. Check browser console for detailed error messages
2. Use the "Debug Images" button in the clinical images section
3. Verify that the browser supports either IndexedDB or localStorage
4. Check available storage space
5. Remember that images are device-specific and won't appear on other devices
