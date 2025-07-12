'use client'

import Dashboard from '@/components/sidebar'
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

]

const pastEvents: Event[] = [

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
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-300">{title}</h2>
      <div className="bg-gray-900 shadow-lg rounded-lg p-6">
        <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-700">
              <th className="px-4 py-2 text-left text-blue-400">Event</th>
              <th className="px-4 py-2 text-left text-blue-400">Start Date</th>
              <th className="px-4 py-2 text-left text-blue-400">End Date</th>
              <th className="px-4 py-2 text-left text-blue-400">Description</th>
              <th className="px-4 py-2 text-center text-blue-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-gray-600">
                <td className="px-4 py-4 text-white">{event.name}</td>
                <td className="px-4 py-4 text-white">{formatDate(event.startDate)}</td>
                <td className="px-4 py-4 text-white">{formatDate(event.endDate)}</td>
                <td className="px-4 py-4 text-white">{event.description}</td>
                <td className="px-4 py-4 text-center">
                  <Link 
                    href={event.link}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-md"
                  >
                    {isPast ? 'View Result' : 'View Event'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-gray-300">
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
    <div className="bg-gray-800 min-h-screen flex text-white">
      <Dashboard />
      <div className="flex-1 p-6 text-white">
        <h1 className="text-4xl font-bold mb-6 text-center text-blue-300">Events</h1>
        
        <EventTable events={upcomingEvents} title="Upcoming Events" />
        <EventTable events={currentEvents} title="Current Events" />
        <EventTable events={pastEvents} title="Past Events" isPast={true} />
      </div>
    </div>
  )
}
