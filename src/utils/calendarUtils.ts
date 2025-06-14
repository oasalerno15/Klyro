import { createClient } from '@/lib/supabase/client';

export interface CalendarData {
  calendar_form: any;
  task_statuses: Record<string, boolean>;
  step_statuses: Record<string, boolean>;
}

export async function saveCalendarData(userId: string, data: CalendarData) {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('calendar_data')
      .upsert({
        user_id: userId,
        calendar_form: data.calendar_form,
        task_statuses: data.task_statuses,
        step_statuses: data.step_statuses,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.warn('Calendar table does not exist. Please run the SQL script in supabase_calendar_table.sql');
        return false;
      }
      console.error('Error saving calendar data:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error saving calendar data:', error);
    return false;
  }
}

export async function loadCalendarData(userId: string): Promise<CalendarData | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('calendar_data')
      .select('calendar_form, task_statuses, step_statuses')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return null
        console.log('No saved calendar data found for user');
        return null;
      }
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.warn('Calendar table does not exist. Please run the SQL script in supabase_calendar_table.sql to create the calendar_data table.');
        return null;
      }
      if (error.code === '42P01') {
        console.warn('Calendar table does not exist. Please run the SQL script in supabase_calendar_table.sql to create the calendar_data table.');
        return null;
      }
      console.error('Error loading calendar data:', error);
      return null;
    }

    return {
      calendar_form: data.calendar_form,
      task_statuses: (data.task_statuses as Record<string, boolean>) || {},
      step_statuses: (data.step_statuses as Record<string, boolean>) || {}
    };
  } catch (error) {
    console.error('Error loading calendar data:', error);
    return null;
  }
} 