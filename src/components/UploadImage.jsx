// src/components/UploadImage.jsx
import React, { useState, useRef } from 'react'
import Tesseract from 'tesseract.js'
import { 
  FiUploadCloud, 
  FiShield, 
  FiEye, 
  FiLock, 
  FiImage,
  FiZap,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi'
import { 
  HiSparkles, 
  HiLightningBolt 
} from 'react-icons/hi'

const UploadImage = ({ onExtracted }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleUpload = async (file) => {
    if (!file) return
    
    setIsProcessing(true)
    setError('')
    setProgress(0)

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const image = reader.result

        const { data: { text } } = await Tesseract.recognize(image, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
            console.log(m)
          }
        })

        setProgress(100)
        setTimeout(() => {
          onExtracted({ image, text })
        }, 500)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('Failed to process image. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) handleUpload(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-12 max-w-4xl">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <FiShield className="text-6xl text-purple-400 animate-pulse" />
            <HiSparkles className="absolute -top-2 -right-2 text-2xl text-yellow-400 animate-bounce" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
          PII Guardian
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
          Protect sensitive information with AI-powered OCR
        </p>
        
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Upload any document image and our advanced AI will automatically detect and mask 
          personal information like Aadhaar numbers, phone numbers, emails, and addresses.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl w-full">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
          <FiEye className="text-3xl text-blue-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Smart Detection</h3>
          <p className="text-gray-400">Advanced OCR technology extracts text with high accuracy</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
          <FiLock className="text-3xl text-purple-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Auto Masking</h3>
          <p className="text-gray-400">Automatically masks sensitive PII data for privacy protection</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
          <HiLightningBolt className="text-3xl text-yellow-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
          <p className="text-gray-400">Process documents in seconds with browser-based AI</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="w-full max-w-2xl">
        {!isProcessing ? (
          <div
            className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-purple-400 bg-purple-400/10 scale-105' 
                : 'border-gray-600 hover:border-purple-400/50 hover:bg-white/5'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <FiUploadCloud className={`text-6xl transition-all duration-300 ${
                  dragActive ? 'text-purple-400 scale-110' : 'text-gray-400'
                }`} />
                {dragActive && (
                  <div className="absolute inset-0 animate-ping">
                    <FiUploadCloud className="text-6xl text-purple-400 opacity-75" />
                  </div>
                )}
              </div>
              
              <h3 className="text-2xl font-semibold text-white mb-4">
                {dragActive ? 'Drop your image here!' : 'Upload Document Image'}
              </h3>
              
              <p className="text-gray-400 mb-6">
                Drag and drop your image here, or click to browse
              </p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 flex items-center gap-3"
              >
                <FiImage className="text-xl" />
                Choose Image
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                Supports JPG, PNG, GIF up to 10MB
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-12 text-center border border-white/10">
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <FiZap className="text-6xl text-yellow-400 animate-spin" />
                <div className="absolute inset-0 animate-pulse">
                  <FiZap className="text-6xl text-yellow-400 opacity-50" />
                </div>
              </div>
              
              <h3 className="text-2xl font-semibold text-white mb-4">
                Processing Your Document
              </h3>
              
              <p className="text-gray-400 mb-6">
                Our AI is analyzing your image and extracting text...
              </p>
              
              <div className="w-full max-w-md">
                <div className="bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400">{progress}% Complete</p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
            <FiAlertCircle className="text-red-400 text-xl flex-shrink-0" />
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>
      
    </div>
  )
}

export default UploadImage
