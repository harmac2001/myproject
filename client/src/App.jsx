import { BrowserRouter, Routes, Route } from 'react-router-dom'
import IncidentList from './components/IncidentList'
import IncidentDetails from './components/IncidentDetails'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IncidentList />} />

        <Route path="/incident/:id" element={<IncidentDetails />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
