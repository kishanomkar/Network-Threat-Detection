import React from 'react';
import mob1 from '../assets/home-mob1.png';
import mob2 from '../assets/home-mob2.png';
import { FaStarOfLife } from "react-icons/fa6";
import { FaLocationArrow } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

const Landing = () => {

    const navigate = useNavigate()

  return (
    <div className="min-h-screen  font-sans p-2 md:p-4 lg:p-6">
      {/* Navigation */}
      <nav className="max-w-[1400px] mx-auto flex items-center justify-between px-2 md:px-8 bg-transparent">
        <div className="flex items-center text-xl font-bold tracking-tight">
          Netra
          <span className="relative z-10 inline-block ml-2">
            AI
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#D6F84D] rounded-full -z-10"></span>
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-800">
          <a href="#about" className="hover:text-black">About Us</a>
          <a href="#work" className="hover:text-black">Work</a>
          <a href="#price" className="hover:text-black">Price</a>
          <a href="#help" className="hover:text-black">Help</a>
        </div>

        <div className="flex items-center space-x-4">
          <button className="hidden sm:block px-6 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            Log In
          </button>
          <button className="cursor-pointer flex items-center space-x-2 px-6 py-2.5 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors">
Contact Us
          </button>
        </div>
      </nav>

      {/* Main Hero Card */}
      <main className="max-w-[1400px] mx-auto mt-6 bg-[#D6F84D] rounded-[48px] px-8 py-16 md:px-16 lg:px-24 lg:py-24 relative overflow-hidden flex flex-col lg:flex-row items-center max-h-[710px]">
        
        {/* Left Content Area */}
        <div className="lg:w-[55%] relative z-20">
                        
          <h1 className="text-6xl md:text-[85px]  font-semibold tracking-tight text-black relative inline-block">
            AI Based <br />
            Network Forcast<br />
            the Future
            
            {/* Sparkle Icon */}
            <span className=" absolute top-20 -right-10">
<FaStarOfLife size={35} />
            </span>
          </h1>

          <p className="mt-20 text-lg md:text-xl text-gray-900 max-w-md font-medium leading-relaxed">
            Predict and prevent network attacks before they happen using AI-powered forecasting from real-time network traffic data, with NetraAI!
          </p>

          <div className="mt-10 relative inline-block">
            <button onClick={() => navigate('/network')} className="flex items-center space-x-3 px-8 py-4 bg-black text-white text-lg font-medium rounded-2xl cursor-pointer transition-colors z-20 relative">
              <span>Let's Start</span>
              <FaLocationArrow />
            </button>

            {/* Exactly Anchored Arrow with strict physical dimensions */}
            <div className="absolute bottom-10 left-[180px] w-[350px] h-[300px] z-10 pointer-events-none hidden lg:block">
              <SquigglyArrowIcon />
            </div>
          </div>

          <div className="mt-[70px] flex items-center space-x-2 text-sm font-semibold cursor-pointer hover:opacity-70 transition-opacity">
            <span>Find Out More</span>
            <ArrowDownIcon />
          </div>
        </div>

        {/* Right Content Area (Mobile Images) */}
        <div className="lg:w-[45%] w-full h-[800px] lg:h-full relative mt-16 lg:mt-0 flex justify-center items-center">
          <img 
            src={mob1} 
            alt="ProFinance Market App" 
            className="absolute z-20 h-[600px] -rotate-[0.25rad] left-[3%]"
          />
          <img 
            src={mob2} 
            alt="ProFinance Trading App" 
            className="absolute z-10 :w-[320px] w-[360px] -rotate-4 -bottom-80 right-[-20%] "
          />
        </div>
      </main>
    </div>
  );
};

export default Landing;

/* --- Icons & Vectors --- */



const ArrowDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M19 12l-7 7-7-7"/>
  </svg>
);

// Fixed SVG path: Physical 350x300 boundaries. Tail starts top-left, loops, points bottom-left.
const SquigglyArrowIcon = () => (
<svg
  width="336"
  height="398"
  viewBox="0 0 420 460"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M285 12
       C390 40 430 100 400 210
       C375 300 315 365 295 425
       C285 455 285 470 300 475
       C320 480 325 450 305 425
       C245 385 150 365 55 370"
    stroke="black"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  />

  <path
    d="M70 355 L52 372 L70 388"
    stroke="black"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>
);