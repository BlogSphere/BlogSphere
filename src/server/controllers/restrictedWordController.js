import RestrictedWord from '../models/RestrictedWord.js';

export const getRestrictedWords = async (req, res) => {
  try {
    const words = await RestrictedWord.find().sort({ word: 1 });
    res.status(200).json({ words });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addRestrictedWord = async (req, res) => {
  try {
    const { word } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({ error: 'Word is required.' });
    }
    const cleanWord = word.trim().toLowerCase();
    
    // Check if it already exists
    const existing = await RestrictedWord.findOne({ word: cleanWord });
    if (existing) {
      return res.status(400).json({ error: 'Word is already restricted.' });
    }
    
    const newWord = new RestrictedWord({ word: cleanWord });
    await newWord.save();
    res.status(201).json({ message: 'Word restricted successfully', word: newWord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRestrictedWord = async (req, res) => {
  try {
    const { id } = req.params;
    const word = await RestrictedWord.findById(id);
    if (!word) {
      return res.status(404).json({ error: 'Restricted word not found' });
    }
    await RestrictedWord.findByIdAndDelete(id);
    res.status(200).json({ message: 'Word removed from restrictions successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Checks a text block or content string for restricted words.
 * Returns an array of matched restricted words, or null if none found.
 */
export const checkRestrictedContent = async (text) => {
  if (!text || typeof text !== 'string') return null;
  
  const restrictedList = await RestrictedWord.find().select('word');
  if (restrictedList.length === 0) return null;
  
  const found = [];
  for (const item of restrictedList) {
    const rawWord = item.word ? item.word.trim() : '';
    if (!rawWord) continue;

    const escaped = rawWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isAlphanumeric = /^[a-zA-Z0-9_\-]+$/.test(rawWord);
    // Use word boundaries for alphanumeric words to prevent false positives, or direct regex for symbols
    const regex = isAlphanumeric ? new RegExp(`\\b${escaped}\\b`, 'i') : new RegExp(escaped, 'i');

    if (regex.test(text)) {
      found.push(rawWord);
    }
  }
  
  return found.length > 0 ? [...new Set(found)] : null;
};
