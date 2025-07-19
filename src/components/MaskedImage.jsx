// src/components/MaskedImage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { detectAndMaskPII } from '../utils/piiUtils'

// Helper functions to extract specific fields from text
const extractAadhaarNumber = (text) => {
  // Match Aadhaar number with or without spaces/hyphens
  const match = text.match(/\b(\d[\s-]?\d{3}[\s-]?\d{4}[\s-]?\d{4})\b/);
  return match ? match[1].replace(/[\s-]/g, '').replace(/(\d{4})(?=\d)/g, '$1 ') : 'Not found';
};

const extractName = (text) => {
  // First, try to find the name in common Aadhaar formats
  const patterns = [
    // Pattern 1: Look for 'Name:' or 'To:' followed by name (case insensitive)
    /(?:Name|To)[:\s]+([A-Z][A-Za-z\s.]{2,}?)(?=\n|\d{2,}|DOB|Male|Female|M|F|$)/i,
    
    // Pattern 2: Look for name in title case at the start of text (2+ words)
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/,
    
    // Pattern 3: Look for all-caps name (2+ words, 2+ letters each)
    /^([A-Z]{2,}(?:\s+[A-Z]{2,})+)(?=\n|\d|DOB|$)/,
    
    // Pattern 4: Look for name after 'Government of India' or 'Aadhaar'
    /(?:Government of India|Aadhaar|GOVT\.? OF INDIA|UIDAI)[^A-Za-z]*(\b[A-Z][A-Za-z\s.]{2,})/i,
    
    // Pattern 5: Look for name before 'S/O', 'D/O', 'W/O' (common in Aadhaar)
    /([A-Z][A-Za-z\s.]{2,}?)(?=\s*(?:S\/?O|D\/?O|W\/?O|Son\/Daughter of|Wife of)\b)/i,
    
    // Pattern 6: Look for name after 'Name of the Cardholder' or similar
    /(?:Name of (?:the )?Cardholder|Cardholder['\s]s? Name)[:\s]*([A-Z][A-Za-z\s.]{2,}?)(?=\n|\d|$)/i
  ];

  // Common words that shouldn't be considered as names
  const invalidWords = [
    'year', 'yrs', 'y/o', 'old', 'male', 'female', 'dob', 'aadhaar', 
    'card', 'india', 'gov', 'government', 'vid', 'to', 'name', 'of', 'and',
    'govt', 'uidai', 'unique', 'identification', 'authority', 'indian', 'republic',
    'address', 'addresses', 'father', 'mother', 'spouse', 'husband', 'wife', 'son', 'daughter'
  ];

  // Try each pattern until we find a valid name
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let name = (match[1] || match[0]).trim();
      
      // Clean up the name
      name = name
        .replace(/[^A-Za-z\s.]/g, ' ')  // Remove special chars
        .replace(/\s+/g, ' ')           // Replace multiple spaces with one
        .trim();
      
      // Basic validation
      if (name.length >= 3 && name.split(' ').length >= 1) {
        const nameLower = name.toLowerCase();
        const isInvalid = invalidWords.some(word => nameLower.includes(word));
        if (!isInvalid) {
          // If name is all caps, convert to title case
          if (name === name.toUpperCase() && name.length > 0) {
            name = name.split(' ')
              .map(word => word.charAt(0) + word.slice(1).toLowerCase())
              .join(' ');
          }
          return name;
        }
      }
    }
  }
  
  // If no pattern matched, try to find a sequence of proper nouns
  const words = text.split(/\s+/);
  let bestName = '';
  let currentName = [];
  
  for (const word of words) {
    // Match words that start with a capital letter (proper nouns)
    if (/^[A-Z][a-z]*$/.test(word) || /^[A-Z]{2,}$/.test(word)) {
      currentName.push(word);
    } else if (currentName.length > 0) {
      // If we found a sequence of proper nouns, check if it's better than current best
      if (currentName.length > 1 && currentName.join(' ').length > bestName.length) {
        const potentialName = currentName.join(' ');
        const nameLower = potentialName.toLowerCase();
        const isInvalid = invalidWords.some(word => nameLower.includes(word));
        if (!isInvalid) {
          bestName = potentialName;
        }
      }
      currentName = [];
    }
  }
  
  // Check the last collected sequence
  if (currentName.length > 1) {
    const potentialName = currentName.join(' ');
    if (potentialName.length > bestName.length) {
      const nameLower = potentialName.toLowerCase();
      const isInvalid = invalidWords.some(word => nameLower.includes(word));
      if (!isInvalid) {
        bestName = potentialName;
      }
    }
  }
  
  // If we found a name, format it properly
  if (bestName) {
    return bestName.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // If still no name found, try a more aggressive approach
  const aggressiveMatch = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/);
  if (aggressiveMatch) {
    return aggressiveMatch[0];
  }
  
  return 'Not found';
};

const extractDOB = (text) => {
  // Match dates in DD/MM/YYYY or DD-MM-YYYY format
  const match = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
  return match ? match[1] : 'Not found';
};

const extractGender = (text) => {
  // Look for gender after 'Gender' or 'Sex' or standalone M/F
  const match = text.match(/(?:Gender|Sex)[:\s]+(Male|Female|M|F)/i) ||
               text.match(/\b(Male|Female|M|F)\b/i);
  return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() : 'Not found';
};

import { 
  FiShield, 
  FiImage, 
  FiEye, 
  FiEyeOff, 
  FiCopy, 
  FiCheck,
  FiUser,
  FiCalendar,
  FiFileText,
  FiRefreshCw,
  FiArrowLeft,
  FiCheckCircle,
  FiDownload,
  FiCreditCard
} from 'react-icons/fi'
import { 
  HiSparkles,
  HiLockClosed
} from 'react-icons/hi'

const MaskedImage = ({ image, text }) => {
  const [maskedText, setMaskedText] = useState('')
  const [isAadhaar, setIsAadhaar] = useState(false)
  const [copied, setCopied] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (text) {
      // Check if the text is from an Aadhaar card
      const aadhaarNumber = extractAadhaarNumber(text);
      const hasAadhaarFormat = aadhaarNumber !== 'Not found';
      const hasAadhaarKeywords = /aadhaar|uidai|unique identification|आधार|यूआईडीएआई/i.test(text);
      
      setIsAadhaar(hasAadhaarFormat || hasAadhaarKeywords);
      
      // Always mask PII, but we'll display it differently based on isAadhaar
      const masked = detectAndMaskPII(text);
      setMaskedText(masked);
      setTimeout(() => setAnimateIn(true), 100)
    }
  }, [text])

  if (!text || !image) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <FiRefreshCw className="text-6xl text-gray-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-semibold text-white mb-2">Loading Results...</h2>
          <p className="text-gray-400">Please wait while we process your document.</p>
        </div>
      </div>
    )
  }

  const aadhaarNumber = extractAadhaarNumber(text);
  const name = extractName(text);
  const dob = extractDOB(text);
  const gender = extractGender(text);
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(maskedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const downloadText = () => {
    const element = document.createElement('a')
    const file = new Blob([maskedText], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'masked-text.txt'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="min-h-screen px-4 py-8">
      {/* Header */}
      <div className={`max-w-7xl mx-auto transition-all duration-1000 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 group"
          >
            <FiArrowLeft className="text-xl group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back to Upload</span>
          </button>
          
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-green-400 text-2xl" />
            <span className="text-green-400 font-semibold">Processing Complete</span>
          </div>
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <HiLockClosed className="text-5xl text-purple-400" />
              <HiSparkles className="absolute -top-1 -right-1 text-xl text-yellow-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
            PII Successfully Masked
          </h1>
          <p className="text-xl text-gray-300">
            Your sensitive information has been automatically detected and protected
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Original Image */}
          <div className={`transition-all duration-1000 delay-200 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10 h-full">
              <div className="flex items-center gap-3 mb-6">
                <FiImage className="text-2xl text-blue-400" />
                <h2 className="text-2xl font-semibold text-white">Original Document</h2>
              </div>
              
              <div className="relative group">
                <img 
                  src={image} 
                  alt="Uploaded document" 
                  className="w-full rounded-2xl shadow-2xl transition-transform duration-300 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          </div>

          {/* Masked Text */}
          <div className={`transition-all duration-1000 delay-400 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FiShield className="text-2xl text-purple-400" />
                  <h2 className="text-2xl font-semibold text-white">Extracted Information</h2>
                </div>
              </div>
              
              <div className="relative">
                {isAadhaar ? (
                  <div className="space-y-6">
                    {/* Aadhaar Number */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <FiShield className="text-blue-400" />
                        <span className="text-sm font-medium">Aadhaar Number</span>
                      </div>
                      <div className="text-lg font-mono">{extractAadhaarNumber(text)}</div>
                    </div>

                    {/* Name */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <FiUser className="text-green-400" />
                        <span className="text-sm font-medium">Full Name</span>
                      </div>
                      <div className="text-lg">{extractName(text)}</div>
                    </div>

                    {/* DOB */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <FiCalendar className="text-yellow-400" />
                        <span className="text-sm font-medium">Date of Birth</span>
                      </div>
                      <div className="text-lg">{extractDOB(text)}</div>
                    </div>

                    {/* Gender */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <FiUser className="text-pink-400" />
                        <span className="text-sm font-medium">Gender</span>
                      </div>
                      <div className="text-lg">{extractGender(text)}</div>
                    </div>
                  </div>
                ) : (
                  // Display all extracted text for non-Aadhaar images
                  <div className="w-full">
                    <div className="bg-white/5 rounded-xl p-6">
                      <div className="flex items-center gap-2 text-gray-400 mb-4">
                        <FiFileText className="text-blue-400" />
                        <h3 className="text-lg font-medium">Extracted Text</h3>
                      </div>
                      <div className="bg-black/20 p-4 rounded-lg font-mono whitespace-pre-wrap text-sm">
                        {text || 'No text could be extracted from the image.'}
                      </div>
                    </div>
                    
                    {maskedText && maskedText !== text && (
                      <div className="mt-6 bg-white/5 rounded-xl p-6">
                        <div className="flex items-center gap-2 text-gray-400 mb-4">
                          <FiShield className="text-green-400" />
                          <h3 className="text-lg font-medium">Masked Text</h3>
                        </div>
                        <div className="bg-black/20 p-4 rounded-lg font-mono whitespace-pre-wrap text-sm">
                          {maskedText}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Copy Button */}
                <div className="mt-6">
                  <button
                    onClick={copyToClipboard}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    {copied ? (
                      <>
                        <FiCheckCircle />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <FiCopy />
                        <span>Copy Text to Clipboard</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Process Another Document Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
          >
            Process Another Document
          </button>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            🔒 Your data remains private - all processing happened locally in your browser
          </p>
        </div>
      </div>
    </div>
  )
}

export default MaskedImage
