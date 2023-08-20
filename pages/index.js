import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-200">
      <h1 className="text-3xl font-semibold mb-8">Connect 4 AI</h1>

      {/* Use the Link component with custom CSS classes */}
      <Link href="/ai" passHref>
        <div className="custom-button">
          Play
        </div>
      </Link>

      <style jsx>{`
        .custom-button {
          background-color: #3182ce;
          color: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          text-align: center;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s, transform 0.3s;
        }

        .custom-button:hover {
          background-color: #2c5282;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
