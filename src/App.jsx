import { HashRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import EditorPage from './pages/EditorPage.jsx'
import PlayerPage from './pages/PlayerPage.jsx'

// HashRouter 讓 GitHub Pages 不需要 server-side routing
// 網址格式：yoursite.github.io/#/play/...

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor/:gameType" element={<EditorPage />} />
        <Route path="/editor/:gameType/:activityId" element={<EditorPage />} />
        <Route path="/play/:encoded" element={<PlayerPage />} />
      </Routes>
    </HashRouter>
  )
}
