# Calendar Persistence Setup

This guide will help you set up calendar data persistence using Supabase.

## Database Setup

1. **Go to your Supabase project dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Run the SQL script**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase_calendar_table.sql`
   - Click "Run" to execute the script

3. **Verify the table was created**
   - Go to the Table Editor
   - You should see a new table called `calendar_data`

## Features

✅ **Automatic Persistence**: Calendar data is automatically saved to Supabase whenever you:
- Complete or uncomplete tasks
- Complete or uncomplete individual action steps
- Generate a new calendar

✅ **Cross-Device Sync**: Your calendar data will persist across:
- Browser refreshes
- Different devices
- Different sessions

✅ **User Isolation**: Each user's calendar data is completely separate and secure

## What Gets Saved

- **Form Data**: Your age, family situation, income, goals, risk tolerance, and description
- **Task Completion**: Which tasks you've marked as complete
- **Step Completion**: Which individual action steps you've completed within each task
- **Calendar State**: Whether you're viewing the calendar or still in setup mode

## Privacy & Security

- All data is protected by Row Level Security (RLS)
- Users can only access their own calendar data
- Data is automatically deleted if a user account is deleted
- No sensitive financial information is stored (only the form inputs and completion states)

## Troubleshooting

If you experience any issues:

1. **Calendar not loading**: Check that the SQL script was run successfully
2. **Data not saving**: Ensure you're logged in and have a stable internet connection
3. **Permission errors**: Verify the RLS policies were created correctly

The calendar will work offline but won't sync until you're back online. 