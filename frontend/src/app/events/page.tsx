'use client'

import Dashboard from '@/components/dashboard'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  link: string;
}

// Mock data - replace with actual data from your backend
const upcomingEvents: Event[] = [
  {
    id: '1',
    name: 'IC Hack 25',
    startDate: '2025-02-01',
    endDate: '2025-02-02',
    description: 'The largest student-run hackathon in Europe',
    link: '/events/ichack25'
  }
]

const currentEvents: Event[] = [
  {
    id: '2',
    name: 'Example Current Event',
    startDate: '2024-03-01',
    endDate: '2024-03-31',
    description: 'This is an example of a currently running event',
    link: '/events/example-current'
  }
]

const pastEvents: Event[] = [
  {
    id: '3',
    name: 'Example Past Event',
    startDate: '2024-01-15',
    endDate: '2024-01-16',
    description: 'This is an example of a past event',
    link: '/events/example-past'
  }
]

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function EventTable({ events, title, isPast }: { events: Event[], title: string, isPast?: boolean }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="bg-white shadow-md rounded-lg p-4">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Event</th>
              <th className="px-4 py-2 text-left">Start Date</th>
              <th className="px-4 py-2 text-left">End Date</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-gray-200">
                <td className="px-4 py-4">{event.name}</td>
                <td className="px-4 py-4">{formatDate(event.startDate)}</td>
                <td className="px-4 py-4">{formatDate(event.endDate)}</td>
                <td className="px-4 py-4">{event.description}</td>
                <td className="px-4 py-4 text-center">
                  <Link 
                    href={event.link}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  >
                    {isPast ? 'View Result' : 'View Event'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                  No events to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Events() {
  return (
    <div className="flex min-h-screen bg-white">
      <Dashboard/>
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Events</h1>
        
        <EventTable events={upcomingEvents} title="Upcoming Events" />
        <EventTable events={currentEvents} title="Current Events" />
        <EventTable events={pastEvents} title="Past Events" isPast={true} />
      </div>
    </div>
  )
}
