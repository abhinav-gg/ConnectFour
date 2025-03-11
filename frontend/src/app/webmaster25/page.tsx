'use client';

import { useState } from 'react';
import { FaCode, FaServer, FaUsers, FaLaptopCode, FaTimes } from 'react-icons/fa';

export default function WebmasterCampaign() {
  const [isHovered, setIsHovered] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const closeModal = () => {
    setSelectedImage(null);
  };

  const initiatives = [
    {
      title: "Restore DocSoc Website",
      description: "Rebuilding the DocSoc website with modern designs and user-centric features including a clear timeline of DocSoc's events and ticket releases! Check out a quick revamp I made from the link above.",
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
      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <button 
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
            onClick={closeModal}
          >
            <FaTimes />
          </button>
          <img
            src={selectedImage}
            alt="Enlarged view"
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/3 static lg:fixed lg:left-0">
          <div className="h-auto lg:h-screen p-4 flex flex-col gap-4 justify-center">
            <img
              src="/Elections.png"
              alt="Campaign Poster for DocSoc Webmaster"
              className="w-full h-auto lg:h-[45vh] object-contain rounded-lg shadow-2xl cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage("/Elections.png")}
            />
            <img
              src="/Web Design... More like LAME Design.png"
              alt="Campaign Poster showing current DocSoc website design"
              className="w-full h-auto lg:h-[45vh] object-contain rounded-lg shadow-2xl cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage("/Web Design... More like LAME Design.png")}
            />
          </div>
        </div>

        <div className="w-full lg:w-2/3 lg:ml-[33.333%] p-4 lg:p-8">
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="text-center mb-8 lg:mb-16">
              <h1 className="text-4xl lg:text-6xl font-bold mb-4 animate-pulse">
                Vote Abhinav For
                <br />DocSoc Webmaster 2025
              </h1>
              <p className="text-lg lg:text-xl text-purple-200 animate-fadeIn">
                Building the Future of DocSoc's Digital Presence
              </p>
            </div>

            <div className="mb-8 lg:mb-16">
              <h2 className="text-3xl font-bold mb-6 text-center">My Experience</h2>
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
                <p className="text-purple-200 mb-4">
                  I've already demonstrated commitment by developing this Connect Four website in just one month for ICH25
                  (December 2024 - January 2025). Did you know that this site's backend is currently hosted on DocSoc's infrastructure!
                </p>
                <div className="mt-6 p-4 bg-purple-800/30 rounded-lg border-2 border-purple-400/30 transform hover:scale-105 transition-all duration-300 animate-bounce-slow">
                  <p className="text-center text-lg font-medium">
                    Check out a potential idea for the{' '}
                    <a 
                      href="/webmaster25/newdocsoc" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-300 hover:text-purple-200 underline font-bold"
                    >
                      new DocSoc website
                    </a>
                    {' '}to see what I can bring to the role!
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:gap-8 mb-8 lg:mb-16">
              {initiatives.map((initiative, index) => (
                <div
                  key={index}
                  className={`
                    bg-white/10 backdrop-blur-lg rounded-lg p-4 lg:p-6 cursor-pointer
                    transition-all duration-300 ease-in-out
                    hover:scale-105 hover:bg-white/15
                    animate-slideUp
                  `}
                  style={{ animationDelay: `${index * 200}ms` }}
                  onMouseEnter={() => setIsHovered(index)}
                  onMouseLeave={() => setIsHovered(null)}
                >
                  <div className="flex items-center mb-3 lg:mb-4">
                    {initiative.icon}
                    <h3 className="text-xl lg:text-2xl font-semibold ml-4">{initiative.title}</h3>
                  </div>
                  <p className="text-sm lg:text-base text-purple-200">{initiative.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center animate-fadeIn px-4" style={{ animationDelay: '1000ms' }}>
              <h2 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6">Ready to Transform DocSoc's Web Presence?</h2>
              <a 
                href="https://vote.union.ic.ac.uk/"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-block
                  bg-purple-500 hover:bg-purple-600 text-white
                  px-6 lg:px-8 py-2 lg:py-3 rounded-full text-base lg:text-lg font-semibold
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
