import ichack from "@/assets/ichack.svg";
import duck from "@/assets/duck.svg";

import React from 'react';
import Image from 'next/image';

const IchackBanner: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-2">
      <a href="https://ichack.org/"><Image src={ichack.src} alt="ichack" width={50} height={50} className="drop-shadow-md transition-transform hover:scale-110" /></a>
      <div className="flex space-x-4">
        <Image src={duck.src} alt="duck" width={50} height={50} className="drop-shadow-md" />
        <Image src={duck.src} alt="duck" width={50} height={50} className="drop-shadow-md scale-x-[-1]" />
        <Image src={duck.src} alt="duck" width={50} height={50} className="drop-shadow-md" />
      </div>
    </div>
  );
};

export default IchackBanner;