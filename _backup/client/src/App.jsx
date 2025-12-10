import { BrowserRouter, Routes, Route } from 'react-router-dom'
import IncidentList from './components/IncidentList'
import IncidentDetails from './components/IncidentDetails'
import PrintableSheet from './components/PrintableSheet'
import InvoicePrint from './components/InvoicePrint'
import InvoicePrintStyled from './components/InvoicePrintStyled'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IncidentList />} />

        <Route path="/incident/:id" element={<IncidentDetails />} />
        <Route path="/incident/:id/print" element={<PrintableSheet />} />
        <Route path="/invoice/:id/print" element={<InvoicePrint />} />
        <Route path="/invoice/:id/print-styled" element={<InvoicePrintStyled />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
