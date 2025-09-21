import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer footer-center p-10 bg-base-200 text-base-content rounded">
      <nav className="grid grid-flow-col gap-4">
        <Link href="/" className="link link-hover">Home</Link>
        <Link href="/experience" className="link link-hover">About</Link>
        <Link href="/projects" className="link link-hover">Projects</Link>
        <Link href="/buffr" className="link link-hover">Buffr</Link>
        <Link href="/namibia" className="link link-hover">Namibia</Link>
      </nav>
      <aside>
        <p>Copyright © 2025 George Nekwaya. All rights reserved.</p>
      </aside>
    </footer>
  );
}
