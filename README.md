# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/2efe1bef-1f9d-4a3d-bf63-fa44dfb74dc8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2efe1bef-1f9d-4a3d-bf63-fa44dfb74dc8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2efe1bef-1f9d-4a3d-bf63-fa44dfb74dc8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)




# Project Features & Documentation

## Overview
The **Standup Storyboard** is a comprehensive task management dashboard designed for tracking software development lifecycles. It features a modern, glassmorphic UI and supports various task types including Planning, Dev/QA, Production, Release, and RWT (Release Work Tracking).

## Key Features

### 1. Task Management
- **Multi-Section Board**: Organized into logical sections:
  - **Planning**: Early-stage tasks.
  - **Dev & QA**: Active development and testing.
  - **Production**: Tasks deployed to prod.
  - **Planned Release**: Release-specific tracking.
  - **Planned RWT**: Release Work Tracking.
- **Rich Text Support**: "Task Name", "Feature", and "Remarks" fields support rich text (bold, italics, underline) and embedded links.
- **Drag-and-Drop**:
  - **Reorder Rows**: Drag rows to prioritize tasks.
  - **Reorder Columns**: Drag column headers to customize the table layout per section.

### 2. Data Persistence
- **Local Storage**: Data is automatically saved to the browser's Local Storage.
- **File System Sync**: Supports syncing with a local [DSM.json](file:///Users/manas4.panda/DSMProject/standup-storyboard-main_cursor/DSM.json) file for persistent, shareable storage using the File System Access API.

### 3. Visualizations & Export
- **Dashboard Stats**: Real-time statistics with animated, glassmorphic cards showing task counts by status.
- **PDF Export**: One-click export of the entire board to a formatted PDF.

---

## Date & Color Coding Logic

The application uses intelligent color coding to highlight critical dates and statuses.

### 1. Critical Row Highlighting (Red)
Rows in the Common Task table (Planning, Dev/QA, Prod) turn **Red** (`bg-red-100`) to indicate urgency.
- **Condition**:
  - The task has a `Committed Date`.
  - The status is **NOT** "Ready For Release".
  - The `Committed Date` is **within 5 working days** from today (or in the past).
- **Purpose**: To visually alert the team about approaching or missed deadlines.

### 2. Date Field Highlighting (Yellow)
Individual date pickers (e.g., Dev Due Date, QA Start Date) turn **Yellow** (`bg-yellow-100`) to signal immediate action.
- **Condition**:
  - The selected date is the **Next Working Day** relative to today.
- **Logic**: It skips weekends (Saturday/Sunday) to calculate the next working day.
- **Purpose**: To highlight tasks that are due or starting immediately.

### 3. Status Badges
Status pills are color-coded based on the lifecycle stage:
- **Green**: Success states (e.g., "Complete", "Released To Prod", "Solutioned").
- **Blue/Info**: Active states (e.g., "In Solutioning", "Dev in Progress").
- **Purple**: Handover states (e.g., "Handed Over To QA").
- **Yellow/Orange**: Warning/Waiting states (e.g., "QA In Progress", "On Hold", "Waiting for Approval").
- **Red/Gray**: Negative states (e.g., "Scrapped", "Removed", "Deprioritised").

---

## Azure DevOps (ADO) Integration

The application integrates with Azure DevOps to automatically post updates as comments on work items.

### 1. Configuration
- Requires a **Personal Access Token (PAT)** configured in the environment variables (`VITE_AZURE_PAT`).
- Targets a specific Organization and Project (`JPL-JioMart/Retailer and Distribution Platform`).

### 2. Trigger Logic
Updates are triggered automatically when specific fields are modified.

#### A. Common Tasks (Planning, Dev/QA, Prod)
- **Trigger**: Modifying the **Remarks** field.
- **Action**:
  - The app calculates the **incremental difference** (the new text added).
  - It posts this new text as a comment to the linked ADO Work Item (via `adoId`).
- **Purpose**: To keep the ADO ticket history in sync with daily standup updates without duplicating the entire remarks history.

#### B. Release Tasks
- **Trigger**: Modifying **CR Link**, **JMDB ID**, or **Services**.
- **Action**: Posts a formatted log entry to the ADO Work Item.
- **Format**:
  - **CR Link**: `DD/MM/YYYY : Added CR Link : - <New Link>`
  - **JMDB ID**: `DD/MM/YYYY : Added JMDB ID : - <New ID>`
  - **Services**: `DD/MM/YYYY : Added Services : - <Service1, Service2>`

### 3. Status Change Logging (Internal)
- **Trigger**: Changing the **Status** of any task.
- **Action**: Automatically appends a log entry to the **Remarks** field (internal only, not sent to ADO unless manually added).
- **Format**: `<DD-MMM-YY HH:mm> status changed from "<Old Status>" to "<New Status>"`
- **Order**: Descending (Newest log at the top).

