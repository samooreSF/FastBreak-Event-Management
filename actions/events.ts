'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { EventInsert, EventUpdate } from '@/types/database.types'

export async function createEvent(eventData: EventInsert) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('events')
      .insert([{ ...eventData, created_by: user.id }])
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/events')
    revalidatePath('/')
    
    return { data, error: null }
  } catch (error) {
    return { error: 'Failed to create event' }
  }
}

export async function getEvents() {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })

    if (error) {
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error) {
    return { error: 'Failed to fetch events', data: null }
  }
}

export async function getEventById(id: string) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error) {
    return { error: 'Failed to fetch event', data: null }
  }
}

export async function updateEvent(id: string, eventData: EventUpdate) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Check if user owns the event
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError || existingEvent?.created_by !== user.id) {
      return { error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('events')
      .update({ ...eventData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/events')
    revalidatePath(`/events/${id}`)
    revalidatePath('/')
    
    return { data, error: null }
  } catch (error) {
    return { error: 'Failed to update event' }
  }
}

export async function deleteEvent(id: string) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Check if user owns the event
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError || existingEvent?.created_by !== user.id) {
      return { error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/events')
    revalidatePath('/')
    
    return { error: null }
  } catch (error) {
    return { error: 'Failed to delete event' }
  }
}

