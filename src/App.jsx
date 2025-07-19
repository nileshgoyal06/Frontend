import React, { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import UploadImage from './components/UploadImage'
import MaskedImage from './components/MaskedImage'

const App = () => {
  const [data, setData] = useState({ image: null, text: '' })
  const navigate = useNavigate()

  const handleExtracted = (extracted) => {
    setData(extracted)
    navigate('/result')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<UploadImage onExtracted={handleExtracted} />} />
          <Route path="/result" element={<MaskedImage image={data.image} text={data.text} />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
