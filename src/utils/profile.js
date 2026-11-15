export function getProfileInitial(fullName) {
  if (typeof fullName !== 'string' || !fullName.trim()) return ''
  const words = fullName.trim().normalize('NFC').split(/\s+/)
  return Array.from(words[words.length - 1])[0].toLocaleUpperCase('vi-VN')
}
