import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="menu-container">
      <div className="title-container">
        <h1 className="main-title">CONNECT 4 AI</h1>
        <div className="title-underline"></div>
      </div>

      <Link href="/ai" passHref>
        <div className="play-button">
          PLAY
        </div>
      </Link>

      <style jsx>{`
        .menu-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 2rem;
        }

        .title-container {
          margin-bottom: 3rem;
          text-align: center;
        }

        .main-title {
          font-family: 'Inter', sans-serif;
          font-size: 4rem;
          font-weight: 800;
          background: linear-gradient(45deg, #e94560, #ff4757);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          margin-bottom: 1rem;
        }

        .title-underline {
          width: 100px;
          height: 4px;
          background: linear-gradient(90deg, #e94560, #ff4757);
          margin: 0 auto;
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(233, 69, 96, 0.3);
        }

        .play-button {
          background: #0f3460;
          color: white;
          padding: 1rem 4rem;
          border-radius: 8px;
          font-size: 1.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid #2541b2;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2),
                     inset 0 0 20px rgba(0, 0, 0, 0.2);
          text-align: center;
          letter-spacing: 2px;
        }

        .play-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3),
                     inset 0 0 20px rgba(0, 0, 0, 0.2);
          background: #2541b2;
          border-color: #e94560;
        }

        .play-button:active {
          transform: translateY(-1px);
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2),
                     inset 0 0 20px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .main-title {
            font-size: 2.5rem;
          }

          .play-button {
            padding: 0.8rem 3rem;
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}
