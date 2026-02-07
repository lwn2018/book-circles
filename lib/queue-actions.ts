'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { initiateHandoff } from './handoff-actions'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

async function sendNotification(type: string, recipientId: string, bookId: string, senderId?: string, metadata?: any) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, recipientId, bookId, senderId, metadata })
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }
}

/**
 * Mark book as ready to pass on to next person
 * Determines next recipient based on queue and owner recall status
 */
export async function markReadyToPassOn(bookId: string, currentHolderId: string) {
  const supabase = await getSupabase()

  // Debug: Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('Auth check:', { 
    userId: user?.id, 
    currentHolderId, 
    match: user?.id === currentHolderId,
    authError 
  })

  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (user.id !== currentHolderId) {
    return { error: `Auth mismatch: logged in as ${user.id} but trying to act as ${currentHolderId}` }
  }

  // 1. Get book details
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*, owner_id')
    .eq('id', bookId)
    .single()

  if (bookError || !book) {
    console.error('Book query error:', bookError)
    return { error: 'Book not found' }
  }

  console.log('Book data:', { 
    bookId: book.id, 
    currentBorrowerId: book.current_borrower_id,
    currentHolderId,
    match: book.current_borrower_id === currentHolderId 
  })

  // Verify current holder
  if (book.current_borrower_id !== currentHolderId) {
    return { error: 'You are not the current holder of this book' }
  }

  // 2. Check for owner recall (takes priority)
  if (book.owner_recall_active) {
    // Initiate handoff back to owner
    const handoffResult = await initiateHandoff(bookId, currentHolderId, book.owner_id)
    
    if (handoffResult.error) {
      return { error: handoffResult.error }
    }

    return {
      success: true,
      nextRecipient: book.owner_id,
      isOwnerRecall: true,
      queueExists: false,
      handoffId: handoffResult.handoff?.id
    }
  }

  // 3. Check queue
  const { data: queue } = await supabase
    .from('book_queue')
    .select('*, profiles(id, full_name, email)')
    .eq('book_id', bookId)
    .order('position', { ascending: true })

  if (queue && queue.length > 0) {
    // Offer to first person in queue
    const nextPerson = queue[0]
    
    // Initiate handoff to next person in queue
    const handoffResult = await initiateHandoff(bookId, currentHolderId, nextPerson.user_id)
    
    if (handoffResult.error) {
      return { error: handoffResult.error }
    }

    return {
      success: true,
      nextRecipient: nextPerson.user_id,
      nextRecipientName: nextPerson.profiles?.full_name,
      isOwnerRecall: false,
      queueExists: true,
      handoffId: handoffResult.handoff?.id
    }
  }

  // 4. No queue, return to owner
  const handoffResult = await initiateHandoff(bookId, currentHolderId, book.owner_id)
  
  if (handoffResult.error) {
    return { error: handoffResult.error }
  }

  return {
    success: true,
    nextRecipient: book.owner_id,
    isOwnerRecall: false,
    queueExists: false,
    handoffId: handoffResult.handoff?.id
  }
}

/**
 * Next person accepts the book offer
 */
export async function handleAcceptResponse(bookId: string, userId: string) {
  const supabase = await getSupabase()

  // Verify this user is the next recipient
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()

  if (!book || book.next_recipient !== userId) {
    return { error: 'This book is not offered to you' }
  }

  // Update status to awaiting handoff
  await supabase
    .from('books')
    .update({
      status: 'awaiting_handoff'
    })
    .eq('id', bookId)

  // Notify current holder that recipient accepted
  if (book.current_borrower_id) {
    await sendNotification('handoff_accepted', book.current_borrower_id, bookId, userId)
  }

  return { success: true }
}

/**
 * Current holder confirms they gave the book to next person
 */
export async function confirmHandoff(bookId: string, currentHolderId: string, nextRecipientId: string) {
  const supabase = await getSupabase()

  // Get book
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()

  if (!book) {
    return { error: 'Book not found' }
  }

  // Verify current holder and next recipient
  if (book.current_borrower_id !== currentHolderId) {
    return { error: 'You are not the current holder' }
  }

  if (book.next_recipient !== nextRecipientId) {
    return { error: 'Recipient mismatch' }
  }

  // Calculate new due date (14 days from now)
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 14)

  // Update book to new holder
  const { error: updateError } = await supabase
    .from('books')
    .update({
      current_borrower_id: nextRecipientId,
      status: book.next_recipient === book.owner_id ? 'available' : 'borrowed',
      borrowed_at: new Date().toISOString(),
      due_date: book.next_recipient === book.owner_id ? null : dueDate.toISOString(),
      next_recipient: null,
      ready_for_pass_on_date: null
    })
    .eq('id', bookId)

  if (updateError) {
    return { error: updateError.message }
  }

  // If returned to owner, mark as available
  if (book.next_recipient === book.owner_id) {
    await supabase
      .from('books')
      .update({
        current_borrower_id: book.owner_id,
        status: 'available',
        owner_recall_active: false
      })
      .eq('id', bookId)
  }

  // Update borrow history
  await supabase
    .from('borrow_history')
    .update({ returned_at: new Date().toISOString() })
    .eq('book_id', bookId)
    .eq('borrower_id', currentHolderId)
    .is('returned_at', null)

  // Create new borrow history if not returning to owner
  if (book.next_recipient !== book.owner_id) {
    await supabase
      .from('borrow_history')
      .insert({
        book_id: bookId,
        borrower_id: nextRecipientId,
        due_date: dueDate.toISOString()
      })
  }

  // Remove from queue if they were in it
  await supabase
    .from('book_queue')
    .delete()
    .eq('book_id', bookId)
    .eq('user_id', nextRecipientId)

  // Reorder remaining queue
  const { data: remainingQueue } = await supabase
    .from('book_queue')
    .select('*')
    .eq('book_id', bookId)
    .order('position', { ascending: true })

  if (remainingQueue && remainingQueue.length > 0) {
    for (let i = 0; i < remainingQueue.length; i++) {
      await supabase
        .from('book_queue')
        .update({ position: i + 1 })
        .eq('id', remainingQueue[i].id)
    }
  }

  // Notify new recipient
  await sendNotification('handoff_confirmed', nextRecipientId, bookId, currentHolderId)

  return { success: true }
}

/**
 * User passes on their turn in queue
 */
export async function handlePassResponse(bookId: string, userId: string, reason: string) {
  const supabase = await getSupabase()

  // Get queue entry
  const { data: queueEntry } = await supabase
    .from('book_queue')
    .select('*')
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .single()

  if (!queueEntry) {
    return { error: 'You are not in this queue' }
  }

  // Increment pass count
  const newPassCount = (queueEntry.pass_count || 0) + 1

  // Update pass info
  await supabase
    .from('book_queue')
    .update({
      pass_count: newPassCount,
      last_pass_reason: reason,
      last_pass_date: new Date().toISOString()
    })
    .eq('id', queueEntry.id)

  // If 3rd pass, move to position 2
  if (newPassCount >= 3 && queueEntry.position === 1) {
    // Get all queue entries that need to shift
    const { data: entriesToShift } = await supabase
      .from('book_queue')
      .select('*')
      .eq('book_id', bookId)
      .gte('position', 2)
      .neq('id', queueEntry.id)

    // Shift each one down
    if (entriesToShift) {
      for (const entry of entriesToShift) {
        await supabase
          .from('book_queue')
          .update({ position: entry.position + 1 })
          .eq('id', entry.id)
      }
    }

    // Move user to position 2
    await supabase
      .from('book_queue')
      .update({
        position: 2,
        pass_count: 0 // Reset count
      })
      .eq('id', queueEntry.id)

    // TODO: Notify user they moved to position 2
  }

  // Offer to next person in queue
  const { data: nextInQueue } = await supabase
    .from('book_queue')
    .select('*')
    .eq('book_id', bookId)
    .eq('position', 1)
    .single()

  if (nextInQueue) {
    await supabase
      .from('books')
      .update({
        next_recipient: nextInQueue.user_id
      })
      .eq('id', bookId)

    // Send offer notification to next person
    const { data: book } = await supabase
      .from('books')
      .select('current_borrower_id')
      .eq('id', bookId)
      .single()
    
    if (book?.current_borrower_id) {
      await sendNotification('book_offered', nextInQueue.user_id, bookId, book.current_borrower_id)
    }
  }

  return { success: true, newPassCount, movedToPosition2: newPassCount >= 3 }
}

/**
 * Join the queue for a book
 */
export async function joinQueue(bookId: string, userId: string) {
  const supabase = await getSupabase()

  // Check if already in queue
  const { data: existing } = await supabase
    .from('book_queue')
    .select('*')
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    return { error: 'You are already in this queue' }
  }

  // Get next position
  const { data: queue } = await supabase
    .from('book_queue')
    .select('position')
    .eq('book_id', bookId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = queue && queue.length > 0 ? queue[0].position + 1 : 1

  // Add to queue
  const { error } = await supabase
    .from('book_queue')
    .insert({
      book_id: bookId,
      user_id: userId,
      position: nextPosition,
      pass_count: 0,
      joined_queue_at: new Date().toISOString()
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true, position: nextPosition }
}

/**
 * Leave the queue
 */
export async function leaveQueue(bookId: string, userId: string) {
  const supabase = await getSupabase()

  const { data: queueEntry } = await supabase
    .from('book_queue')
    .select('*')
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .single()

  if (!queueEntry) {
    return { error: 'You are not in this queue' }
  }

  // Remove from queue
  await supabase
    .from('book_queue')
    .delete()
    .eq('id', queueEntry.id)

  // Get entries that need to shift up
  const { data: entriesToShift } = await supabase
    .from('book_queue')
    .select('*')
    .eq('book_id', bookId)
    .gt('position', queueEntry.position)

  // Shift each one up
  if (entriesToShift) {
    for (const entry of entriesToShift) {
      await supabase
        .from('book_queue')
        .update({ position: entry.position - 1 })
        .eq('id', entry.id)
    }
  }

  // If this was position 1, offer to new position 1
  if (queueEntry.position === 1) {
    const { data: nextInQueue } = await supabase
      .from('book_queue')
      .select('*')
      .eq('book_id', bookId)
      .eq('position', 1)
      .single()

    if (nextInQueue) {
      await supabase
        .from('books')
        .update({ next_recipient: nextInQueue.user_id })
        .eq('id', bookId)

      // Send offer notification
      const { data: book } = await supabase
        .from('books')
        .select('current_borrower_id')
        .eq('id', bookId)
        .single()
      
      if (book?.current_borrower_id) {
        await sendNotification('book_offered', nextInQueue.user_id, bookId, book.current_borrower_id)
      }
    }
  }

  return { success: true }
}

/**
 * Auto-called after 48 hours of no response
 * Treats silence as a pass
 */
export async function handleNoResponse(bookId: string, userId: string) {
  return await handlePassResponse(bookId, userId, 'No response')
}
