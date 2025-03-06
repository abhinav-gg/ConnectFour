'use client';

import { useState } from 'react';
import { FaCode, FaServer, FaUsers, FaLaptopCode } from 'react-icons/fa';

export default function WebmasterCampaign() {
  const [isHovered, setIsHovered] = useState<number | null>(null);

  const initiatives = [
    {
      title: "Restore DocSoc Website",
      description: "Rebuilding the DocSoc website up with modern designs and user-centric features including a clear timeline of DocSoc's events and ticket releases!",
      icon: <FaCode className="text-3xl" />,
    },
    {
      title: "Upgrade ICHack Website",
      description: "Enhancing the hacker and organiser experience with the ICHack website to allow for smoother event management. Thoroughly testing the website to eliminate last minute errors.",
      icon: <FaLaptopCode className="text-3xl" />,
    },
    {
      title: "Maintain Web Presence",
      description: "Ensuring that the DocSoc websites are up-to-date and secure, with regular updates and maintenance to keep the society running smoothly.",
      icon: <FaServer className="text-3xl" />,
    },
    {
      title: "Open Collaboration",
      description: "Fostering a community of students to contribute your ideas and insights to DocSoc projects",
      icon: <FaUsers className="text-3xl" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white">
      <div className="flex">
        {/* Left Side - Fixed Poster */}
        <div className="w-1/3 h-screen sticky top-0">
          <div className="h-full p-4">
            <img
              src="/Elections.png"
              alt="Campaign Poster for DocSoc Webmaster"
              className="w-full h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>

        {/* Right Side - Scrollable Content */}
        <div className="w-2/3 p-8">
          <div className="max-w-4xl mx-auto animate-fadeIn">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-6xl font-bold mb-4 animate-pulse">
                Vote Abhinav For
                <br />DocSoc Webmaster 2025
              </h1>
              <p className="text-xl text-purple-200 animate-fadeIn">
                Building the Future of DocSoc's Digital Presence
              </p>
              <div className="mt-6">
                <p className="text-lg text-purple-300 animate-bounce inline-block">
                  More Campaign Information Coming Soon
                  <span className="animate-ellipsis">...</span>
                </p>
              </div>
            </div>

            {/* Initiatives Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {initiatives.map((initiative, index) => (
                <div
                  key={index}
                  className={`
                    bg-white/10 backdrop-blur-lg rounded-lg p-6 cursor-pointer
                    transition-all duration-300 ease-in-out
                    hover:scale-105 hover:bg-white/15
                    animate-slideUp
                  `}
                  style={{ animationDelay: `${index * 200}ms` }}
                  onMouseEnter={() => setIsHovered(index)}
                  onMouseLeave={() => setIsHovered(null)}
                >
                  <div className="flex items-center mb-4">
                    {initiative.icon}
                    <h3 className="text-2xl font-semibold ml-4">{initiative.title}</h3>
                  </div>
                  <p className="text-purple-200">{initiative.description}</p>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="text-center animate-fadeIn" style={{ animationDelay: '1000ms' }}>
              <h2 className="text-3xl font-bold mb-6">Ready to Transform DocSoc's Web Presence?</h2>
              <a 
                href="https://vote.union.ic.ac.uk/"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-block
                  bg-purple-500 hover:bg-purple-600 text-white
                  px-8 py-3 rounded-full text-lg font-semibold
                  transition-transform duration-300 ease-in-out
                  hover:scale-110 active:scale-95
                "
              >
                Vote Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
