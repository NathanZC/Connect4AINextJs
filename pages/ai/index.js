import Image from 'next/image'
import { Inter } from 'next/font/google'

import Grid from '../components/grid.js'

export default function Home() {
  return (
    <div className="MenuBody min-h-screen">
      <header className="headerPVP">
        <div className="justtext1">CONNECT 4 AI</div>
      </header>
      <main className="flex flex-col items-center">
        <Grid />
      </main>
    </div>
  )
}
