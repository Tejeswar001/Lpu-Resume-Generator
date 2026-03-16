import Home from './pages/Home';
import ResumeForm from './pages/ResumeForm';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
    <div className='min-h-screen bg-base-200' data-theme="light">
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ResumeForm" element={<ResumeForm />} />
        </Routes>
      </main>
    </div>
    </BrowserRouter>
  )
}

export default App
