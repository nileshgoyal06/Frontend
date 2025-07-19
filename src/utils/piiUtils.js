export const detectAndMaskPII = (text) => {
  const patterns = [
    { regex: /\b\d{4}\s\d{4}\s\d{4}\b/g }, // Aadhaar
    { regex: /(\+91[\-\s]?)?[6-9]\d{9}/g }, // Phone
    { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g }, // Email
    { regex: /\b\d{2}[-/]\d{2}[-/]\d{4}\b/g }, // DOB
    { regex: /\b(Name|S\/O|D\/O|W\/O):?\s+[A-Za-z\s]+/gi }, // Name
    { regex: /\b(Address):?\s+[A-Za-z0-9,\-\s]+\b/gi }, // Address
  ]

  let maskedText = text
  patterns.forEach(({ regex }) => {
    maskedText = maskedText.replace(regex, '█'.repeat(10))
  })

  return maskedText
}
