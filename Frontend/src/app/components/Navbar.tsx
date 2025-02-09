'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface NavbarProps {
  isAuthenticated: boolean;
  displayName?: string | null; // Optional display name for the user's initial.
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, displayName }) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Extract the first letter of the user's name, or default to "P" if not provided.
  const initialLetter = displayName ? displayName.charAt(0).toUpperCase() : 'P';

  return (
    <nav className="absolute top-0 left-0 w-full bg-white bg-opacity-90 shadow-md px-6 py-4 flex items-center justify-between z-50">
      {/* Left - Logo (Always visible) */}
      <Link href="/">
        <Image
          src="/logo.jpg"
          alt="Company Logo"
          width={200}
          height={80}
          className="cursor-pointer"
        />
      </Link>

      {/* Only render navigation items if we're NOT on the login page */}
      {pathname !== '/login' && (
        <>
          {/* Center - Navigation Links (only if logged in) */}
          {isAuthenticated && (
            <ul className="hidden md:flex space-x-6 text-green-800 font-semibold">
              <li>
                <Link 
                  href="/map" 
                  className={pathname === '/map' ? 'text-green-600' : ''}
                >
                  Map
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className={pathname === '/about' ? 'text-green-600' : ''}
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  href="/image" 
                  className={pathname === '/image' ? 'text-green-600' : ''}
                >
                  Image
                </Link>
              </li>
            </ul>
          )}

          {/* Right side - Profile / Dropdown (only if logged in) */}
          {isAuthenticated && (
            <div className="relative flex items-center space-x-4">
              {/* Dropdown Toggle Button (V-shaped icon) */}
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                <svg
                  className="w-4 h-4 text-green-700 hover:text-green-800"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 20 10"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline
                    points="0,0 10,10 20,0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Profile Button with User Initial */}
              <Link href="/profile">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-700 hover:bg-green-800 text-white font-bold">
                  {initialLetter}
                </div>
              </Link>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-green-700 rounded-md shadow-lg z-50">
                  <ul>
                    <li>
                      <Link
                        href="/map"
                        onClick={() => setMenuOpen(false)}
                        className={`block px-4 py-2 hover:bg-green-100 ${
                          pathname === '/map' ? 'text-green-600' : 'text-green-800'
                        }`}
                      >
                        Map
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/about"
                        onClick={() => setMenuOpen(false)}
                        className={`block px-4 py-2 hover:bg-green-100 ${
                          pathname === '/about' ? 'text-green-600' : 'text-green-800'
                        }`}
                      >
                        About
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </nav>
  );
};

export default Navbar;
