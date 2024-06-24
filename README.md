Connect4AI
Welcome to Connect4AI, a Connect Four game built using Next.js, utilizing the MiniMax algorithm with alpha-beta pruning and caching to create a challenging AI opponent. You can play the game online here.

Overview
Connect4AI is an engaging and interactive Connect Four game that pits players against an AI opponent. The AI uses the MiniMax algorithm with alpha-beta pruning for efficient decision-making and caching for optimized performance.

Demo
Try the game here.

Technologies Used
Next.js: A React framework for building server-side rendered and statically generated web applications.
MiniMax Algorithm: A decision rule for minimizing the possible loss for a worst-case scenario. In this game, it helps the AI determine the best move.
Alpha-Beta Pruning: An optimization technique for the MiniMax algorithm that reduces the number of nodes evaluated.
LRU Cache: A caching mechanism to store and retrieve board states efficiently, limiting the memory usage.
Getting Started
To run the development server locally, follow these steps:

Clone the repository:

bash
git clone https://github.com/your-username/connect4ai.git
cd connect4ai
Install dependencies:

bash

npm install
# or
yarn install
# or
pnpm install
Run the development server:

bash

npm run dev
# or
yarn dev
# or
pnpm dev
Open your browser: Visit http://localhost:3000 to see the game.

How to Play
Start a new game: Click the "NEW GAME: YOU FIRST" button to start a game where you make the first move, or click the "NEW GAME: AI FIRST" button to let the AI start.
Make a move: Click on the desired column to drop your piece.
AI Move: The AI will make its move after you. The AI's decision-making is powered by the MiniMax algorithm with alpha-beta pruning and caching for improved performance.
Folder Structure
plaintext

  connect4ai/
  ├── public/
  ├── src/
  │   ├── components/
  │   │   ├── Cell.js
  │   │   └── Grid.js
  │   ├── pages/
  │   │   └── index.js
  │   └── styles/
  ├── .gitignore
  ├── package.json
  ├── README.md
  └── next.config.js
Contributing
Contributions are welcome! If you have suggestions for improvements or find any issues, please open an issue or submit a pull request.

License
This project is licensed under the MIT License.
