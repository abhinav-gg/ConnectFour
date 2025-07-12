'use client';

import LoadingAnimation from '@/components/boards/LoadingAnimation';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-800 flex justify-center items-center">
      <LoadingAnimation />
    </div>
  );
}