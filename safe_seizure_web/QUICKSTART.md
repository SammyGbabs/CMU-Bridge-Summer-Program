# SafeSeizure Dashboard - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- Node.js 18+ installed
- pnpm package manager

### Getting Started

```bash
# The project is already set up! Just start it:
cd /vercel/share/v0-project
pnpm dev

# Navigate to http://localhost:3000 in your browser
```

## 🔑 Demo Credentials

Use these credentials to log into the dashboard:

```
Email:    dr.sarah@safseizure.com
Password: demo123
```

These credentials are pre-filled in the login form.

## 📍 What You Can Access

After logging in, you have full access to:

### 1. Dashboard (`http://localhost:3000/dashboard`)
- **4 Key Metrics**: Total Patients, Active Alerts, Online Devices, Appointments
- **Active Alerts Panel**: Real-time seizure and medication alerts
- **Patient Roster**: Quick view of all managed patients
- **Quick Overview**: Pending messages, device status, doctor availability

### 2. Patients (`http://localhost:3000/patients`)
- **Search & Filter**: Find patients by name, risk level, or status
- **Patient Table**: Complete roster with diagnoses and medication adherence
- **Summary Stats**: Total patients, requiring attention, average adherence
- **Export Button**: Export patient data

### 3. Alerts (`http://localhost:3000/alerts`)
- **Alert Statistics**: Critical, High Priority, and Active Alert counts
- **Alert Tabs**: View Active, Acknowledged, or Resolved alerts
- **Alert Management**: Acknowledge or resolve alerts with one click
- **Alert Details**: Severity, timestamp, and description for each alert

### 4. Seizure Records (`http://localhost:3000/seizures`)
- **Analytics**: Total events, this week, average duration
- **Advanced Filtering**: Search by patient, seizure type, date range
- **Seizure Table**: Complete record of all seizure events
- **Export CSV**: Download records for analysis

## 🎨 Exploring the Interface

### Navigation Sidebar
- Click any menu item to navigate to that section
- Notice the badge counts on Alerts (3) and Messages (5)
- Collapse the sidebar by clicking the menu icon (responsive mobile view)

### Search Bar
- Use the search bar at the top to find patients or alerts
- Type any patient name or diagnosis term

### Status Indicators
- **Green**: Stable/Online
- **Amber**: Monitoring/Pending
- **Red**: Alert/Critical
- **Gray**: Offline

### Patient Avatars
- Hover over patient names to see their avatar with initials
- Status dots show patient online/offline/idle status

## 🧪 Interactive Features

### Try These Actions:

1. **Dashboard - Acknowledge Alert**
   - Click the "Acknowledge" button on the "Active Seizure Alert"
   - Watch the alert move to a different style
   - Return to Alerts page to see it in "Acknowledged" tab

2. **Dashboard - Click Patient Row**
   - Click any patient row in the roster
   - You'll be directed to the patient details page (coming in Phase 2)

3. **Patients - Apply Filters**
   - Use the Risk Level filter to show only High Risk patients
   - Use Status filter to show only "Alert" status patients
   - Use Search to find "James Chen"

4. **Alerts - Switch Tabs**
   - Click between "Active", "Acknowledged", and "Resolved" tabs
   - Each tab shows different alert states
   - Notice the count updates as you acknowledge/resolve

5. **Seizures - Filter by Date**
   - Use date pickers to filter seizure records
   - See the table update with filtered results

## 📊 Understanding the Mock Data

The dashboard comes with realistic mock data:

### Patients
- **James Chen** - High Risk (Temporal Lobe Epilepsy)
- **Maria Garcia** - Low Risk (Generalized Tonic-Clonic)
- **David Okafor** - Medium Risk (Absence Seizures)
- **Emily Roberts** - Low Risk (Focal Seizures)

### Alerts
- **Critical**: Active Seizure Alert (James Chen)
- **High**: Device Offline (David's phone not syncing)
- **Medium**: Medication Refill Due (Maria's prescription)
- **Low**: Upcoming Appointment (James consultation today)

### Recent Seizures
- **2024-07-19**: James Chen - Tonic-Clonic seizure (52 seconds)
- **2024-07-16**: David Okafor - Absence episode (8 seconds)

## 🎯 Next Steps

### For Developers
1. **Review the Code**:
   - Check `/lib/types.ts` for data structures
   - Check `/lib/mock-data.ts` for example data
   - Review components in `/components` for patterns

2. **Modify Mock Data**:
   - Edit `/lib/mock-data.ts` to change patient data
   - Changes will hot-reload in the browser

3. **Add New Features**:
   - Create new page in `app/[section]/page.tsx`
   - Use existing components for consistency
   - Import mock data and display

### For Clinicians
1. **Understand Workflows**:
   - Login → Dashboard overview
   - Monitor active alerts
   - Review patient roster
   - Access seizure history

2. **Explore Patient Data**:
   - Note medication adherence tracking
   - Observe risk stratification
   - Check device connectivity
   - Review seizure frequency

## ❓ FAQ

### Q: Can I edit patient data?
A: In this demo, data is read-only. Phase 2 will add editing capabilities.

### Q: How do I add a new patient?
A: The "Add Patient" button is visible but non-functional in the demo. This will be implemented in Phase 2.

### Q: Can I export reports?
A: Export buttons are present but send data to console in the demo. Full export will be in Phase 2.

### Q: How do I access patient details?
A: Click on any patient row to view their profile (Phase 2 feature).

### Q: What about messaging and appointments?
A: These are coming in Phase 2. Currently, message and appointment counts are shown but pages aren't implemented yet.

## 🔧 Development

### Build for Production
```bash
pnpm build
pnpm start
```

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
pnpm lint
```

## 📚 Documentation

- **README.md** - Complete project documentation
- **IMPLEMENTATION_SUMMARY.md** - Detailed technical overview
- **Type Definitions** - `/lib/types.ts` (200+ lines)
- **Mock Data** - `/lib/mock-data.ts` (all example data)

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -- -p 3001
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Styling Issues
```bash
# Rebuild Tailwind CSS
pnpm dev
# (CSS rebuilds automatically in dev mode)
```

## 📞 Support

This is a demonstration application created with Next.js 16, TypeScript, and Tailwind CSS.

For issues or questions:
1. Check the README.md for detailed documentation
2. Review the component source code
3. Check console for error messages
4. Review IMPLEMENTATION_SUMMARY.md for architecture details

---

**Enjoy exploring SafeSeizure! This is Phase 1 of a comprehensive clinical dashboard system.**
