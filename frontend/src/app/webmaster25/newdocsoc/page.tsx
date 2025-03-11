'use client';

import { useState, useEffect } from 'react';
import { FaCalendar, FaTicketAlt, FaUsers, FaChevronLeft, FaChevronRight, FaDiscord, FaGithub, FaChevronDown } from 'react-icons/fa';

export default function NewDocSocHome() {
  const [activeTab, setActiveTab] = useState('events');
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [nodes, setNodes] = useState<Array<{ x: number; y: number }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Generate random nodes for the background
  useEffect(() => {
    const generateNodes = () => {
      const newNodes = [];
      for (let i = 0; i < 300; i++) {
        newNodes.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight
        });
      }
      setNodes(newNodes);
    };

    generateNodes();
    window.addEventListener('resize', generateNodes);
    return () => window.removeEventListener('resize', generateNodes);
  }, []);

  const events = [
    {
      title: "ICHack 26",
      date: "February 3-4, 2024",
      location: "Queen's Tower Rooms",
      description: "London's biggest student hackathon! Join us for 24 hours of hacking, workshops, and prizes.",
      content: (
        <div className="w-full h-48 overflow-hidden bg-[#0066FF]">
          <img
            src="/regular.png"
            alt="ICHack 24"
            className="w-full h-full object-contain"
          />
        </div>
      )
    },
    {
      title: "Bar Night",
      date: "February 8, 2024",
      location: "Union Bar",
      description: "Monthly social at the Union Bar! Free drinks for members.",
      content: (
        <div className="w-full h-48 overflow-hidden">
          <img
            src="/premium_photo-1670984940156-c7f833fe8397.jpg"
            alt="Bar Night"
            className="w-full h-full object-cover"
          />
        </div>
      )
    },
    {
      title: "Tech Interview Prep",
      date: "February 15, 2024",
      location: "Huxley 308",
      description: "Practice technical interviews with peers and industry mentors.",
      content: (
        <div className="w-full h-48 overflow-hidden">
          <img
            src="/job-interview-illustration-free-vector.jpg"
            alt="Tech Interview Prep"
            className="w-full h-full object-cover"
          />
        </div>
      )
    }
  ];

  const nextEvent = () => {
    setActiveEventIndex((prev) => (prev + 1) % events.length);
  };

  const prevEvent = () => {
    setActiveEventIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900">
      {/* Network Background */}
      <div className="fixed inset-0 z-0">
        <svg className="w-full h-full">
          {nodes.map((node, i) => (
            <g key={i}>
              <circle
                cx={node.x}
                cy={node.y}
                r="1.5"
                fill="#8b5cf6"
                className="animate-pulse"
              />
              {nodes.slice(i + 1).map((node2, j) => {
                const distance = Math.hypot(node.x - node2.x, node.y - node2.y);
                if (distance < 100) {
                  return (
                    <line
                      key={j}
                      x1={node.x}
                      y1={node.y}
                      x2={node2.x}
                      y2={node2.y}
                      stroke="#8b5cf6"
                      strokeWidth="0.3"
                      strokeOpacity={1 - distance / 100}
                    />
                  );
                }
                return null;
              })}
            </g>
          ))}
        </svg>
      </div>

      {/* Navigation Tabs with Logo - Mobile Responsive */}
      <div className="sticky top-0 z-30 bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center">
            <img
              src="/imperial-docsoc-logo.png"
              alt="DocSoc Logo"
              className="h-12 w-auto py-2"
            />
            <div className="flex flex-wrap w-full lg:w-auto">
              <TabButton 
                active={activeTab === 'events'} 
                onClick={() => setActiveTab('events')}
                className="flex-1 lg:flex-none"
              >
                Events
              </TabButton>
              <TabButton 
                active={activeTab === 'sponsors'} 
                onClick={() => setActiveTab('sponsors')}
                className="flex-1 lg:flex-none"
              >
                Sponsors
              </TabButton>
              <TabButton 
                active={activeTab === 'portal'} 
                onClick={() => setActiveTab('portal')}
                className="flex-1 lg:flex-none"
              >
                Portal
              </TabButton>
              <TabButton 
                active={activeTab === 'blog'} 
                onClick={() => setActiveTab('blog')}
                className="flex-1 lg:flex-none"
              >
                Blog
              </TabButton>
            </div>
          </div>
        </div>
      </div>

      {/* Event Showcase - Mobile Responsive */}
      <div className="max-w-7xl mx-auto px-4 py-12 z-10 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Previous Event Preview - Hidden on mobile */}
          <button 
            onClick={prevEvent}
            className="hidden lg:block relative group flex-shrink-0 w-1/4 opacity-50 hover:opacity-75 transition-opacity bg-white/5 rounded-lg overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-start">
              <FaChevronLeft className="text-4xl text-white ml-4" />
            </div>
            <div className="h-32 overflow-hidden">
              {events[(activeEventIndex - 1 + events.length) % events.length].content}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white">
              <div className="text-sm font-semibold">
                {events[(activeEventIndex - 1 + events.length) % events.length].title}
              </div>
              <div className="text-xs text-gray-300">
                {events[(activeEventIndex - 1 + events.length) % events.length].date}
              </div>
            </div>
          </button>

          {/* Current Event */}
          <div className="w-full lg:flex-grow lg:max-w-2xl">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden">
              {events[activeEventIndex].content}
              <div className="p-4 lg:p-6">
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">{events[activeEventIndex].title}</h3>
                <p className="text-purple-200 mb-2">{events[activeEventIndex].date}</p>
                <p className="text-purple-200 mb-4">{events[activeEventIndex].location}</p>
                <p className="text-purple-300">{events[activeEventIndex].description}</p>
              </div>
            </div>
            {/* Mobile Navigation Arrows */}
            <div className="flex justify-between mt-4 lg:hidden">
              <button 
                onClick={prevEvent}
                className="p-2 bg-white/10 rounded-full"
              >
                <FaChevronLeft className="text-2xl text-white" />
              </button>
              <button 
                onClick={nextEvent}
                className="p-2 bg-white/10 rounded-full"
              >
                <FaChevronRight className="text-2xl text-white" />
              </button>
            </div>
          </div>

          {/* Next Event Preview - Hidden on mobile */}
          <button 
            onClick={nextEvent}
            className="hidden lg:block relative group flex-shrink-0 w-1/4 opacity-50 hover:opacity-75 transition-opacity bg-white/5 rounded-lg overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-end">
              <FaChevronRight className="text-4xl text-white mr-4" />
            </div>
            <div className="h-32 overflow-hidden">
              {events[(activeEventIndex + 1) % events.length].content}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white">
              <div className="text-sm font-semibold">
                {events[(activeEventIndex + 1) % events.length].title}
              </div>
              <div className="text-xs text-gray-300">
                {events[(activeEventIndex + 1) % events.length].date}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Sponsors Section - Mobile Responsive */}
      <section className="mb-16 px-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-8">Our Sponsors</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
          {[1, 2, 3, 4].map((sponsor) => (
            <div
              key={sponsor}
              className="bg-white/5 rounded-lg p-4 lg:p-8 flex items-center justify-center"
            >
              <div className="w-20 h-20 lg:w-32 lg:h-32 bg-white/10 rounded-lg" />
            </div>
          ))}
        </div>
      </section>

      {/* Footer - Mobile Responsive */}
      <footer className="border-t border-white/10 pt-8 mt-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg lg:text-xl font-bold text-white mb-4">Contact Us</h3>
            <p className="text-purple-200">docsoc@imperial.ac.uk</p>
          </div>
          <div>
            <h3 className="text-lg lg:text-xl font-bold text-white mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-purple-200 hover:text-white">
                <FaDiscord className="text-2xl" />
              </a>
              <a href="#" className="text-purple-200 hover:text-white">
                <FaGithub className="text-2xl" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-lg lg:text-xl font-bold text-white mb-4">Location</h3>
            <p className="text-purple-200">Department of Computing</p>
            <p className="text-purple-200">Imperial College London</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TabButton({ children, active, onClick, className = '' }: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-2 lg:px-6 lg:py-4 text-sm lg:text-lg font-medium transition-all duration-300
        ${active 
          ? 'text-white border-b-2 border-purple-500 bg-white/10' 
          : 'text-gray-300 hover:text-white hover:bg-white/5'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}
