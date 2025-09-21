'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  Home, 
  User, 
  Briefcase, 
  FolderGit2, 
  Flag, 
  Award,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Experiences', href: '/experience', icon: User },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'Buffr', href: '/buffr', icon: FolderGit2 },
  { name: 'Namibia', href: '/namibia', icon: Flag },
  { name: 'Certificates', href: '/certificates', icon: Award },
];


export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost text-xl">
          George Nekwaya
        </Link>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.name === 'Buffr') {
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={`hover:text-primary transition-colors ${
                      pathname === item.href ? 'text-primary' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`hover:text-primary transition-colors ${
                    pathname === item.href ? 'text-primary' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="navbar-end">
        <div className="dropdown dropdown-end lg:hidden">
          <div tabIndex={0} role="button" className="btn btn-ghost">
            <Menu className="w-5 h-5" />
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={pathname === item.href ? 'active' : ''}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
