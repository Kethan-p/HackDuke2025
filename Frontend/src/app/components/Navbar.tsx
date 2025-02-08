'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface NavbarProps {
  isAuthenticated: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated }) => {
  const pathname = usePathname();

  return (
    <nav className="absolute top-0 left-0 w-full bg-white bg-opacity-90 shadow-md px-6 py-4 flex items-center justify-between z-50">
      {/* Left - Logo (Always Show) */}
      <Link href="/">
        <Image
          src="/logo.jpg"
          alt="Company Logo"
          width={200} // ✅ Larger logo
          height={80}
          className="cursor-pointer"
        />
      </Link>

      {/* ✅ Ensure NOTHING appears on the right side if on Login Page */}
      {pathname !== '/login' && (
        <>
          {/* Center - Navigation Links (Only Show After Login) */}
          {isAuthenticated && (
            <ul className="hidden md:flex space-x-6 text-green-800 font-semibold">
              <li>
                <Link href="/map" className={pathname === '/map' ? 'text-green-600' : ''}>
                  Map
                </Link>
              </li>
              <li>
                <Link href="/about" className={pathname === '/about' ? 'text-green-600' : ''}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/research" className={pathname === '/research' ? 'text-green-600' : ''}>
                  Research
                </Link>
              </li>
            </ul>
          )}

          {/* Right - Profile Button (Only Show After Login) */}
          {isAuthenticated && (
            <Link href="/profile">
              <button className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded">
                Profile
              </button>
            </Link>
          )}

          
        </>
      )}
    </nav>
  );
};

export default Navbar;
