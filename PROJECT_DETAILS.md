# Casting Platform - Technical Specification & Documentation

## 1. Project Overview
This project is a centralized platform for collecting and managing a database of **actors, actresses, and brand faces** in **Uzbekistan** who are available for video shoots (Instagram Reels, commercials, and other video content).

**Workflow:**
1.  **User (Actor/Model)**: Contacts the Telegram bot, completes a registration questionnaire, and is added to the database.
2.  **Administrator**: Accesses the web-based Admin Dashboard to filter, search, and manage the database to find suitable candidates for specific projects.

## 2. Technical Stack

### Backend
-   **Framework**: [NestJS](https://nestjs.com/) (Node.js)
-   **Language**: TypeScript
-   **Database**: PostgreSQL
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Bot Framework**: `nestjs-telegraf` (Telegraf wrapper)
-   **Storage**: Local filesystem (`./uploads`) for photos.

### Frontend
-   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **UI Library**: [Material UI (MUI)](https://mui.com/)
-   **State Management**: [TanStack Query](https://tanstack.com/query/latest)

### Infrastructure
-   **Containerization**: Docker & Docker Compose

## 3. System Roles

### 3.1 User (Actor / Actress / Brand Face)
-   Registers via the Telegram Bot.
-   Fills out a profile questionnaire.
-   Uploads photos.
-   Sets their price for participation.

### 3.2 Administrator
-   Accesses the database via the Admin Dashboard.
-   Filters and searches for candidates.
-   Views profiles and contact details.

## 4. Functional Specifications

### 4.1 Telegram Bot (Registration Flow)

#### Start Information
-   **Command**: `/start`
-   **Description**: "This bot is designed for registering actors and brand faces for video and commercial shoots. Fill out the questionnaire to join our database."
-   **Action**: "Start Registration" button.

#### Questionnaire (Wizard Scene)
The bot asks questions sequentially with input validation.

1.  **Full Name**
    -   Type: Text (e.g., Ivan Ivanov)
2.  **Age**
    -   Type: Number
    -   Validation: Minimum 16/18 years.
3.  **Gender**
    -   Type: Buttons (Male / Female)
4.  **City / Region**
    -   Type: Text or Selection List (Uzbekistan regions).
5.  **Photos**
    -   Type: File Upload
    -   Constraints: Minimum 2, Maximum 5 photos.
    -   Requirement: Good quality, visible face.
6.  **Phone Number**
    -   Type: Contact (via "Share Contact" button or text `+998 XX XXX XX XX`).
7.  **Price per Video (Reels)**
    -   Type: Number
    -   Currency: UZS (Sum) (e.g., 300,000)
8.  **Experience**
    -   Type: Buttons (No Experience / Has Experience / Professional Actor/Model)

#### Confirmation
-   Bot displays a summary of collected data.
-   **Actions**:
    -   ✅ Confirm (Saves to database)
    -   ✏️ Edit Data (Restart mechanism)
-   **Success Message**: "Thank you! You have been added to our database. We will contact you for suitable projects."

### 4.2 Admin Panel (Web Dashboard)

#### Authorization
-   Login and Password protection.
-   Access restricted to Administrators only.

#### Profile List
-   Table or Grid view displaying:
    -   Photo Preview
    -   Name
    -   Age
    -   Gender
    -   City
    -   Price
    -   Phone Number

#### Filtering & Search
Admins must be able to filter the database by:
-   **Gender**: Male / Female
-   **Age**: Range (From - To)
-   **Price**: Range (From - To)
-   **City**: Text match
-   **Experience**: Level
-   **Search**: By Name

#### User Card (Detailed View)
Clicking a profile opens a modal/page with:
-   Full Photo Gallery (Carousel)
-   Complete Profile Information
-   Contact Number
-   Telegram ID
-   Social Media Links (if applicable)
-   **Actions**:
    -   "Contact" (Link to Telegram chat preferred)
    -   "Hide" (Change status to Hidden)
    -   "Delete" (Remove from database)

## 5. Data Architecture
Each user entity stores the following fields:
-   `Telegram ID` (Unique Identifier)
-   `Name`
-   `Age`
-   `Gender`
-   `City`
-   `Photos` (File paths or URLs)
-   `Phone`
-   `Price` (per video)
-   `Experience`
-   `Social Links`
-   `Registration Date`
-   `Status` (Active / Hidden)

## 6. Project Structure
```
CastingBot/
├── backend/                # NestJS (Bot & API)
│   ├── src/auth/           # Admin Authentication
│   ├── src/bot/            # Telegram Wizard & Updates
│   ├── src/users/          # User CRUD & Filtering logic
│   └── uploads/            # Local photo storage
├── frontend/               # React Admin Dashboard
│   ├── src/pages/          # Login & Dashboard views
│   └── src/components/     # Filters, User Cards, Dialogs
├── docker-compose.yml      # Orchestration
└── README.md               # Setup Guide
```

## 7. Setup & Configuration
See `README.md` for detailed Docker usage instructions.

to run the project:
```bash
docker-compose up -d --build
```
