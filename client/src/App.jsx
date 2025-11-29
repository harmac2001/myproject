import { BrowserRouter, Routes, Route } from 'react-router-dom'
import IncidentList from './components/IncidentList'
import IncidentDetails from './components/IncidentDetails'
import PrintableSheet from './components/PrintableSheet'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IncidentList />} />

        <Route path="/incident/:id" element={<IncidentDetails />} />
        <Route path="/incident/:id/print" element={<PrintableSheet />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
