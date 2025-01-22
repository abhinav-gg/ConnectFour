'use client'
/*
Usage:
<ErrorPopup
        message={error || ''}
        isVisible={!!error}
        onClose={() => setError(null)}
        autoHideDelay={5000} // Optional: auto-hide after 5 seconds
      />
*/

import React, { useEffect } from 'react'
import { IoClose  } from 'react-icons/io5'

interface ErrorPopupProps {
  message: string
  isVisible: boolean
  onClose: () => void
  autoHideDelay?: number // Optional delay in milliseconds before auto-hiding
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({
  message,
  isVisible,
  onClose,
  autoHideDelay = 5000 // Default 5 seconds
}) => {
  useEffect(() => {
    if (isVisible && autoHideDelay) {
      const timer = setTimeout(() => {
        onClose()
      }, autoHideDelay)

      return () => clearTimeout(timer)
    }
  }, [isVisible, autoHideDelay, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center p-4 z-50">
      <div className="transform transition-transform duration-300 ease-in-out translate-y-0">
        <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between max-w-md">
          <span className="mr-4">{message}</span>
          <button
            onClick={onClose}
            className="text-white hover:text-red-100 transition-colors duration-200"
          >
            <IoClose className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorPopup