import { createClient } from '@/lib/supabase/client';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';

export interface CalendarData {
  calendar_form: any;
  task_statuses: Record<string, boolean>;
  step_statuses: Record<string, boolean>;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'task' | 'goal' | 'reminder';
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export async function saveCalendarData(userId: string, calendarData: CalendarData): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('user_calendar_data')
      .upsert({
        user_id: userId,
        calendar_data: calendarData,
        updated_at: new Date().toISOString()
      });

    if (error) {
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

export function generateWeeklyCalendar(startDate: Date, events: CalendarEvent[]): CalendarEvent[][] {
  const weekStart = startOfWeek(startDate);
  const weekEnd = endOfWeek(startDate);
  
  const days: CalendarEvent[][] = [];
  
  for (let i = 0; i < 7; i++) {
    const currentDay = addDays(weekStart, i);
    const dayEvents = events.filter(event => 
      format(event.date, 'yyyy-MM-dd') === format(currentDay, 'yyyy-MM-dd')
    );
    days.push(dayEvents);
  }
  
  return days;
}

export function formatCalendarDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
}

export function getCalendarWeekDays(startDate: Date): Date[] {
  const weekStart = startOfWeek(startDate);
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
} 