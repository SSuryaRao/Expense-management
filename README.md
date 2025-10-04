<div align="center">

# 💰 **Expense Management System** 💼

### *Smart, AI-Powered Expense Tracking with Multi-Level Approval Workflows*

<img src="https://img.shields.io/badge/Next.js-13.5-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
<img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
<img src="https://img.shields.io/badge/Express-4.19-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
<img src="https://img.shields.io/badge/MongoDB-8.4-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
<img src="https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/TailwindCSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind"/>
<img src="https://img.shields.io/badge/Tesseract.js-6.0-blue?style=for-the-badge" alt="Tesseract"/>

---

### 🚀 **[Live Prototype](https://expense-management-ecru-one.vercel.app/)** 🚀

---

</div>

## <span style="color:#6c5ce7;">📖 Overview</span>

The **Expense Management System** is a cutting-edge solution built for the **IIT Gandhinagar Hackathon 2025**, addressing the **Odoo Problem Statement** for streamlined expense tracking and approval. This platform leverages **AI-powered categorization**, **OCR receipt scanning**, and **hybrid approval workflows** to automate and simplify organizational expense management—reducing manual errors, improving compliance, and providing real-time analytics.

**Problem Solved**: Traditional expense management is time-consuming, error-prone, and lacks transparency. Our solution automates receipt processing, intelligently routes approvals, and provides actionable insights—all in one unified platform.

---

## <span style="color:#6c5ce7;">✨ Features</span>

- 🤖 **AI-Powered Categorization** – Automatically classifies expenses using Google Gemini AI
- 📸 **OCR Receipt Scanning** – Extracts data from receipt images using Tesseract.js
- 🔄 **Multi-Level Approval Workflow** – Configurable approval chains with conditional routing
- ⚡ **Hybrid Rules Engine** – Combines role-based and amount-based approval logic
- 📊 **Real-Time Analytics Dashboard** – Visual insights with charts, trends, and spending breakdowns
- 👥 **Role-Based Access Control** – Separate views for Employees, Managers, and Admins
- 🔔 **Instant Notifications** – Real-time updates on expense status changes
- 🎨 **Modern UI/UX** – Clean, responsive interface built with Next.js and Tailwind CSS
- 🔐 **Secure Authentication** – JWT-based auth with encrypted passwords
- 📱 **Responsive Design** – Works seamlessly across desktop, tablet, and mobile devices

---

## <span style="color:#6c5ce7;">🏗️ Architecture</span>

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  Next.js 13 + TypeScript + Tailwind CSS + Radix UI         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard  │  │  Expense Form │  │  Analytics   │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (Axios)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│  Node.js + Express + Mongoose                               │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐    │
│  │  Controllers │  │  Middleware   │  │  Routes      │    │
│  └──────────────┘  └───────────────┘  └──────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE & EXTERNAL APIs                 │
│  MongoDB Atlas  │  Google Gemini AI  │  Tesseract.js       │
└─────────────────────────────────────────────────────────────┘
```

**Flow**: Users submit expenses via the frontend → Backend validates and processes with AI/OCR → Data stored in MongoDB → Approval workflow triggered → Real-time updates pushed to dashboard

---

## <span style="color:#6c5ce7;">🎬 Prototype / Demo</span>

### 🌐 **[Access Live Demo Here](https://expense-management-ecru-one.vercel.app/)**

<!-- Uncomment and add your screenshots below -->
<!--
### Screenshots
![Dashboard](./screenshots/dashboard.png)
![Expense Form](./screenshots/expense-form.png)
![Analytics](./screenshots/analytics.png)
![Approval Workflow](./screenshots/workflow.png)
-->

---

## <span style="color:#6c5ce7;">⚙️ Installation & Setup</span>

### Prerequisites
- Node.js 18+
- MongoDB instance (local or MongoDB Atlas)
- npm or yarn

### Clone Repository
```bash
git clone https://github.com/SSuryaRao/Expense-management.git
cd Expesence-management
```

### Backend Setup
```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
PORT=5000
EOF

# Run backend
npm run dev
```

### Frontend Setup
```bash
cd ../frontend
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF

# Run frontend
npm run dev
```

**Default Ports**: Frontend runs on `http://localhost:3000`, Backend on `http://localhost:5000`

---

## <span style="color:#6c5ce7;">🛠️ Tech Stack</span>

### **Frontend**
![Next.js](https://img.shields.io/badge/Next.js-13.5-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?logo=tailwind-css)
![Radix UI](https://img.shields.io/badge/Radix_UI-Components-purple)
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-7.53-EC5990)
![Recharts](https://img.shields.io/badge/Recharts-2.12-8884d8)

### **Backend**
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-8.4-47A248?logo=mongodb)
![Mongoose](https://img.shields.io/badge/Mongoose-8.4-darkred)
![JWT](https://img.shields.io/badge/JWT-Auth-black?logo=json-web-tokens)

### **AI & Tools**
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?logo=google)
![Tesseract.js](https://img.shields.io/badge/Tesseract.js-OCR-blue)
![Axios](https://img.shields.io/badge/Axios-1.7-5A29E4)

---

## <span style="color:#6c5ce7;">📘 Usage</span>

### Demo Credentials
You can test the system with these role-based accounts:

| Role       | Username/Email       | Password       | Access                              |
|------------|---------------------|----------------|-------------------------------------|
| **Admin**  | admin@company.com   | admin123       | Full system access, workflow config |
| **Manager**| manager@company.com | manager123     | Approve/reject expenses             |
| **Employee**| user@company.com   | user123        | Submit and track expenses           |

### Main User Flows

1. **Employee Submits Expense**
   - Upload receipt (image/PDF)
   - OCR auto-fills amount, vendor, date
   - AI categorizes expense type
   - Submit for approval

2. **Manager Reviews Expense**
   - View pending approvals in dashboard
   - Approve/reject with comments
   - Auto-routes to next approver if needed

3. **Admin Analytics**
   - View spending trends by category
   - Monitor approval bottlenecks
   - Configure approval workflows
   - Manage users and roles

---

## <span style="color:#6c5ce7;">🧠 AI & OCR Functionality</span>

### **OCR (Optical Character Recognition)**
- Powered by **Tesseract.js** for client-side and server-side processing
- Extracts: Amount, Vendor Name, Date, Line Items
- Supports: JPG, PNG, PDF formats
- Accuracy: ~85-95% on clear receipts

### **AI Categorization**
- Uses **Google Gemini AI** for intelligent expense classification
- Categories: Travel, Food, Office Supplies, Entertainment, etc.
- Context-aware: Analyzes vendor names and descriptions
- Fallback: Manual categorization if confidence is low

**Workflow**: Receipt Upload → OCR Parsing → AI Analysis → Pre-filled Form → User Verification → Submission

---

<!-- ## <span style="color:#6c5ce7;">📸 Screenshots</span>

<!-- Add your screenshots here -->
<!--
![Login Page](./screenshots/login.png)
![Employee Dashboard](./screenshots/employee-dashboard.png)
![Expense Submission](./screenshots/expense-form.png)
![Manager Approvals](./screenshots/approvals.png)
![Analytics Dashboard](./screenshots/analytics.png)
![Admin Workflow Config](./screenshots/workflow-config.png)
-->

<!-- *Screenshots will be added soon!*

--- --> 

## <span style="color:#6c5ce7;">🚀 Future Enhancements</span>

- 📱 **Mobile App** – Native iOS/Android apps with offline support
- 🛡️ **Fraud Detection** – ML-based anomaly detection for suspicious expenses
- 🎤 **Voice Input** – Submit expenses via voice commands
- 🌐 **Multi-Currency Support** – Automatic currency conversion for international teams
- 🔗 **Integrations** – Connect with Slack, Teams, QuickBooks, SAP
- 📧 **Email Receipts** – Forward receipts to expense@yourcompany.com for auto-processing
- 🤝 **Approval Delegation** – Assign approvers during vacations
- 📊 **Advanced Reports** – Custom report builder with export to Excel/PDF

---

<!-- ## <span style="color:#6c5ce7;">👥 Team</span>

<div align="center">

| Name                | Role                     |                                           
|---------------------|--------------------------|--------------------------------------------------|
| **S Surya Rao**     | Full Stack Developer     | 
| **Subham Kumar Sahu** | Backend Developer        | 
| **Manab Behera** | Frontend Developer       | 
| **Suvam Mishra** | UI/UX Designer           |

</div>


--- -->

## <span style="color:#6c5ce7;">🙏 Acknowledgements</span>

- **IIT Gandhinagar Hackathon 2025** – For providing the platform and problem statement
- **Odoo** – For the inspiring expense management challenge
- **Google Gemini AI** – For powering intelligent expense categorization
- **Tesseract.js** – For robust OCR capabilities
- **Vercel** – For seamless deployment and hosting

---

## <span style="color:#6c5ce7;">📄 License</span>

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### ⭐ **If you like this project, give it a star on GitHub!** ⭐

Built with ❤️ for **IIT Gandhinagar Hackathon 2025**

[🔗 Live Demo](https://expense-management-ecru-one.vercel.app/) | [📧 Contact](mailto:your-email@example.com) | [🐛 Report Issues](https://github.com/SSuryaRao/Expense-management/issues)

</div>
