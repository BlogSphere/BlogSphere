import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Save, Send, Eye, PenTool, Users, Plus, X, Search,
  UserCheck, Edit3, Heading1, Heading2, List, Trash2,
  Copy, ArrowUp, ArrowDown, GripVertical, AlignLeft,
  Quote, Code, Image, Lightbulb, LayoutGrid, Settings2, CheckCircle2, AlertCircle,
  Sparkles, Clock, ArrowRight, Zap, MessageSquare, MessageSquareOff,
  CloudUpload, Check, Share2, Globe, Wifi, UserPlus, ShieldCheck, CheckCircle,
  Mic, MicOff, Volume2, Radio
} from 'lucide-react';
import api from '../utils/api.js';
import socket from '../utils/socket.js';
import confetti from 'canvas-confetti';
import { updateCurrentUser } from '../redux/authSlice.js';

// Multi-User Distinct Cursor Themes
const COLLAB_THEMES = [
  {
    name: 'Emerald',
    color: '#10b981',
    border: 'border-emerald-500',
    bg: 'bg-emerald-500',
    text: 'text-emerald-500',
    ring: 'ring-emerald-500/30',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    caretColor: '#10b981',
  },
  {
    name: 'Violet',
    color: '#8b5cf6',
    border: 'border-violet-500',
    bg: 'bg-violet-500',
    text: 'text-violet-500',
    ring: 'ring-violet-500/30',
    lightBg: 'bg-violet-50 dark:bg-violet-950/30',
    caretColor: '#8b5cf6',
  },
  {
    name: 'Sky',
    color: '#0ea5e9',
    border: 'border-sky-500',
    bg: 'bg-sky-500',
    text: 'text-sky-500',
    ring: 'ring-sky-500/30',
    lightBg: 'bg-sky-50 dark:bg-sky-950/30',
    caretColor: '#0ea5e9',
  },
  {
    name: 'Amber',
    color: '#f59e0b',
    border: 'border-amber-500',
    bg: 'bg-amber-500',
    text: 'text-amber-500',
    ring: 'ring-amber-500/30',
    lightBg: 'bg-amber-50 dark:bg-amber-950/30',
    caretColor: '#f59e0b',
  },
  {
    name: 'Rose',
    color: '#f43f5e',
    border: 'border-rose-500',
    bg: 'bg-rose-500',
    text: 'text-rose-500',
    ring: 'ring-rose-500/30',
    lightBg: 'bg-rose-50 dark:bg-rose-950/30',
    caretColor: '#f43f5e',
  },
  {
    name: 'Indigo',
    color: '#6366f1',
    border: 'border-indigo-500',
    bg: 'bg-indigo-500',
    text: 'text-indigo-500',
    ring: 'ring-indigo-500/30',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    caretColor: '#6366f1',
  }
];

const getCollabTheme = (userId) => {
  if (!userId) return COLLAB_THEMES[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % COLLAB_THEMES.length;
  return COLLAB_THEMES[idx];
};

const createBlockInstance = (type) => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
  switch (type) {
    case 'h1':
      return { id, type, content: '' };
    case 'h2':
      return { id, type, content: '' };
    case 'p':
      return { id, type, content: '' };
    case 'quote':
      return { id, type, content: '' };
    case 'code':
      return { id, type, content: '', language: 'javascript' };
    case 'callout':
      return { id, type, content: '', icon: '💡' };
    case 'image':
      return { id, type, url: '', caption: 'Blog Image' };
    case 'list':
      return { id, type, content: '' };
    default:
      return { id, type: 'p', content: '' };
  }
};

const parseHTMLToBlocks = (html) => {
  if (!html) return [createBlockInstance('p')];

  try {
    const parsed = JSON.parse(html);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) { }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks = [];

  const children = doc.body.children;
  if (children.length === 0 && doc.body.textContent.trim()) {
    return [{ id: '1', type: 'p', content: doc.body.textContent.trim() }];
  }

  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    const tagName = el.tagName.toLowerCase();
    const id = `legacy-${i}-${Math.random().toString(36).substr(2, 5)}`;

    if (tagName === 'h1') {
      blocks.push({ id, type: 'h1', content: el.textContent });
    } else if (tagName === 'h2') {
      blocks.push({ id, type: 'h2', content: el.textContent });
    } else if (tagName === 'blockquote') {
      blocks.push({ id, type: 'quote', content: el.textContent });
    } else if (tagName === 'pre' || tagName === 'code') {
      blocks.push({ id, type: 'code', content: el.textContent, language: 'javascript' });
    } else if (tagName === 'figure' || tagName === 'img') {
      const img = el.querySelector('img') || (tagName === 'img' ? el : null);
      const figcaption = el.querySelector('figcaption');
      blocks.push({
        id,
        type: 'image',
        url: img ? img.src : '',
        caption: figcaption ? figcaption.textContent : 'Blog Image'
      });
    } else if (tagName === 'ul' || tagName === 'ol') {
      const items = Array.from(el.querySelectorAll('li')).map(li => li.textContent).join('\r\n');
      blocks.push({ id, type: 'list', content: items });
    } else if (el.classList.contains('bg-primary-50') || el.innerHTML.includes('💡') || el.classList.contains('callout')) {
      blocks.push({ id, type: 'callout', content: el.textContent.replace(/💡|⚠️|ℹ️|✅/, '').trim(), icon: '💡' });
    } else {
      blocks.push({ id, type: 'p', content: el.innerHTML || el.textContent });
    }
  }

  if (blocks.length === 0) {
    blocks.push(createBlockInstance('p'));
  }

  return blocks;
};

const parseInlineMarkdown = (text) => {
  if (!text) return '';
  // Clean up any leading list bullet/dash if it somehow slipped through
  let cleanText = text.trim().replace(/^[*\-•]\s*/, '');

  // Parse markdown bold (**text**) into HTML/React bold elements
  const parts = cleanText.split('**');
  return parts.map((part, pId) => {
    if (pId % 2 === 1) {
      return <strong key={part + '-' + pId} className="font-bold">{part}</strong>;
    }
    return part;
  });
};

const renderBlogPreview = (contentString) => {
  if (!contentString) return <p className="text-slate-400 italic">No content written yet.</p>;
  try {
    const blocks = JSON.parse(contentString);
    if (Array.isArray(blocks)) {
      return (
        <div className="space-y-6">
          {blocks.map((block) => {
            switch (block.type) {
              case 'h1':
                return <h1 key={block.id} className={`text-3xl mt-8 mb-4 text-slate-900 dark:text-white ${block.bold === false ? 'font-normal' : 'font-extrabold'} ${block.italic ? 'italic' : ''} ${block.underline ? 'underline' : ''}`}>{parseInlineMarkdown(block.content)}</h1>;
              case 'h2':
                return <h2 key={block.id} className={`text-2xl mt-6 mb-3 text-slate-800 dark:text-slate-100 ${block.bold === false ? 'font-normal' : 'font-bold'} ${block.italic ? 'italic' : ''} ${block.underline ? 'underline' : ''}`}>{parseInlineMarkdown(block.content)}</h2>;
              case 'p':
                return <p key={block.id} className={`text-slate-700 dark:text-slate-300 leading-relaxed text-base whitespace-pre-wrap ${block.bold ? 'font-bold' : 'font-normal'} ${block.italic ? 'italic' : ''} ${block.underline ? 'underline' : ''}`}>{parseInlineMarkdown(block.content)}</p>;
              case 'quote':
                return <blockquote key={block.id} className={`border-l-4 border-primary-500 pl-4 my-4 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-r-2xl whitespace-pre-wrap ${block.bold ? 'font-bold' : 'font-normal'} ${block.italic === false ? 'not-italic' : 'italic'} ${block.underline ? 'underline' : ''}`}>{parseInlineMarkdown(block.content)}</blockquote>;
              case 'code':
                return (
                  <div key={block.id} className="relative my-6 rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800 bg-slate-950 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 font-mono text-sm shadow-inner">
                    <div className="flex items-center justify-between px-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200/50 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider"><span>{block.language || 'code'}</span></div>
                    <pre className="p-4 overflow-x-auto"><code>{block.content}</code></pre>
                  </div>
                );
              case 'callout':
                return (
                  <div key={block.id} className="bg-primary-50/50 border border-primary-100 dark:bg-primary-950/20 dark:border-primary-900/30 p-4 rounded-2xl flex gap-3.5 my-5">
                    <span className="text-2xl select-none" role="img">{block.icon || '💡'}</span>
                    <div className={`text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap ${block.bold === false ? 'font-normal' : 'font-semibold'} ${block.italic ? 'italic' : ''} ${block.underline ? 'underline' : ''}`}>{parseInlineMarkdown(block.content)}</div>
                  </div>
                );
              case 'image':
                return (
                  <figure key={block.id} className="my-8 flex flex-col items-center">
                    <div className="rounded-3xl overflow-hidden shadow-md max-w-full border border-slate-100 dark:border-slate-800/80">
                      <img src={block.url || 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?auto=format&fit=crop&q=80&w=400'} alt={block.caption} className="max-h-[500px] w-auto object-contain" />
                    </div>
                    {block.caption && <figcaption className="text-center text-xs text-slate-400 mt-2.5 italic">{block.caption}</figcaption>}
                  </figure>
                );
              case 'list':
                return (
                  <ul key={block.id} className="list-disc pl-6 space-y-1.5 my-4">
                    {block.content.split('\r\n').filter(Boolean).map((item) => (
                      <li key={item} className={`text-slate-700 dark:text-slate-300 text-base leading-relaxed ${block.bold ? 'font-bold' : 'font-normal'} ${block.italic ? 'italic' : ''} ${block.underline ? 'underline' : ''}`}>{parseInlineMarkdown(item)}</li>
                    ))}
                  </ul>
                );
              default:
                return null;
            }
          })}
        </div>
      );
    }
  } catch (e) { }

  return <div dangerouslySetInnerHTML={{ __html: contentString || '<p className="text-slate-400 italic">No content written yet.</p>' }} />;
};

export default function Editor() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [upgradingRole, setUpgradingRole] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState('draft');

  const communityParam = searchParams.get('community') || '';
  const [community, setCommunity] = useState(communityParam);
  const [myCommunities, setMyCommunities] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  // Spam warning states
  const [spamModalOpen, setSpamModalOpen] = useState(false);
  const [spamScore, setSpamScore] = useState(0);
  const [spamReasons, setSpamReasons] = useState([]);
  const [bypassSpamCheck, setBypassSpamCheck] = useState(false);

  // Blocks builder state
  const [blocks, setBlocks] = useState([
    { id: '1', type: 'h1', content: '' },
    { id: '2', type: 'p', content: '' }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Collaborators & Real-Time Presence
  const [currentBlog, setCurrentBlog] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [joiningCollab, setJoiningCollab] = useState(false);
  const [startingCollab, setStartingCollab] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [blockFocusMap, setBlockFocusMap] = useState({}); // userId -> { blockId, userName, userId }
  const [remoteTypingUser, setRemoteTypingUser] = useState(null);
  const [remoteCursors, setRemoteCursors] = useState({}); // userId -> { x, y, userName, blockId, updatedAt }
  const canvasRef = useRef(null);
  const lastCursorEmitRef = useRef(0);
  const typingTimeoutRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // Author and Collaborator permissions
  const isAuthor = currentBlog ? (currentBlog.author?._id === user?._id || currentBlog.author === user?._id) : true;
  const isCollaborator = collaborators.some(c => (c._id || c) === user?._id);
  const isCoAuthorOrOwner = isAuthor || isCollaborator;

  // Editor modes: 'edit' or 'preview'
  const [editorMode, setEditorMode] = useState('edit');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Zoom & View adjustment states
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [editorZoom, setEditorZoom] = useState(100);
  const [activeBlockIndex, setActiveBlockIndex] = useState(null);

  // Timed collaborative sprint states
  const [sprintActive, setSprintActive] = useState(false);
  const [sprintGoal, setSprintGoal] = useState(500);
  const [sprintDuration, setSprintDuration] = useState(15 * 60 * 1000); // 15 mins
  const [sprintTimeRemaining, setSprintTimeRemaining] = useState(0);
  const [sprintStartTime, setSprintStartTime] = useState(null);
  const [sprintPartnerProgress, setSprintPartnerProgress] = useState({});

  // Grammar/Spell check states
  const [grammarCheckLoading, setGrammarCheckLoading] = useState(false);
  const [grammarErrors, setGrammarErrors] = useState([]);
  const [grammarModalOpen, setGrammarModalOpen] = useState(false);
  const [grammarSuggestions, setGrammarSuggestions] = useState([]);

  // AI Suggestion States
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedTitle, setSuggestedTitle] = useState('');

  // Toast notifications state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Voice Dictation (Speech-to-Text) States & Logic
  const [isListening, setIsListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState('block'); // 'title' | 'block'
  const [speechLang, setSpeechLang] = useState('en-US');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const shouldBeListeningRef = useRef(false);
  const recognitionRef = useRef(null);
  const targetBlockIndexRef = useRef(null);
  const voiceTargetRef = useRef('block');

  const SUPPORTED_VOICE_LANGS = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-IN', label: 'English (India)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'hi-IN', label: 'Hindi (हिन्दी)' },
    { code: 'es-ES', label: 'Spanish (Español)' },
    { code: 'fr-FR', label: 'French (Français)' },
    { code: 'de-DE', label: 'German (Deutsch)' },
    { code: 'ar-SA', label: 'Arabic (العربية)' },
    { code: 'zh-CN', label: 'Chinese (中文)' },
    { code: 'ja-JP', label: 'Japanese (日本語)' }
  ];

  useEffect(() => {
    voiceTargetRef.current = voiceTarget;
  }, [voiceTarget]);

  useEffect(() => {
    targetBlockIndexRef.current = activeBlockIndex;
  }, [activeBlockIndex]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLang;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalChunk += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(interim);

      if (finalChunk) {
        handleFinalVoiceText(finalChunk);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'audio-capture') {
        setVoiceError('No microphone detected. Please connect or enable your microphone.');
        shouldBeListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === 'not-allowed') {
        setVoiceError('Microphone permission was denied. Please allow microphone access in your browser.');
        shouldBeListeningRef.current = false;
        setIsListening(false);
      } else {
        console.warn('Speech recognition warning:', event.error);
      }
    };

    recognition.onend = () => {
      if (shouldBeListeningRef.current) {
        try {
          recognition.start();
        } catch (err) {
          // Handled if already starting
        }
      } else {
        setIsListening(false);
        setInterimTranscript('');
      }
    };

    recognitionRef.current = recognition;

    if (shouldBeListeningRef.current) {
      try {
        recognition.start();
      } catch (err) {}
    }

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [speechLang]);

  // Process voice text & commands
  const handleFinalVoiceText = (rawTranscript) => {
    const target = voiceTargetRef.current;
    const currentBlockIdx = targetBlockIndexRef.current;

    const lower = rawTranscript.trim().toLowerCase();

    // Voice command: "new paragraph"
    if (lower === 'new paragraph' || lower === 'next paragraph') {
      const idx = currentBlockIdx !== null ? currentBlockIdx : (blocks.length > 0 ? blocks.length - 1 : 0);
      insertBlockBelow(idx, 'p');
      setInterimTranscript('');
      showToast('Created new paragraph from voice command', 'info');
      return;
    }

    // Voice command: punctuation replacement
    let processed = rawTranscript
      .replace(/\bperiod\b|\bfull stop\b/gi, '.')
      .replace(/\bcomma\b/gi, ',')
      .replace(/\bquestion mark\b/gi, '?')
      .replace(/\bexclamation mark\b|\bexclamation point\b/gi, '!')
      .replace(/\bcolon\b/gi, ':')
      .replace(/\bsemi colon\b|\bsemicolon\b/gi, ';')
      .replace(/\bnew line\b/gi, '\r\n');

    if (target === 'title') {
      setTitle((prev) => {
        const prevTrimmed = (prev || '').trim();
        const next = prevTrimmed ? `${prevTrimmed} ${processed.trim()}` : processed.trim();
        handleTitleChange(next);
        return next;
      });
    } else {
      setBlocks((prevBlocks) => {
        let idx = currentBlockIdx;
        if (idx === null || idx === undefined || idx < 0 || idx >= prevBlocks.length) {
          idx = prevBlocks.length > 0 ? prevBlocks.length - 1 : 0;
        }

        if (prevBlocks.length === 0) {
          const newBlock = createBlockInstance('p');
          newBlock.content = processed.trim();
          const serialized = JSON.stringify([newBlock]);
          setContent(serialized);
          return [newBlock];
        }

        const updated = prevBlocks.map((b, i) => {
          if (i === idx) {
            const cur = b.content || '';
            const space = cur && !cur.endsWith(' ') && !cur.endsWith('\r\n') ? ' ' : '';
            const nextVal = cur + space + processed.trim();

            setTimeout(() => {
              const el = document.getElementById(`block-input-${b.id}`);
              if (el) {
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
              }
            }, 10);

            if (editId) {
              socket.emit('edit_block', {
                blogId: editId,
                blockId: b.id,
                field: 'content',
                val: nextVal,
                userId: user?._id
              });
            }
            return { ...b, content: nextVal };
          }
          return b;
        });

        setContent(JSON.stringify(updated));
        return updated;
      });
    }

    setInterimTranscript('');
  };

  const startVoiceListening = (target = 'block', blockIndex = null) => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      showToast('Voice typing is not supported in this browser. Please use Chrome, Edge, or Safari.', 'error');
      return;
    }

    const targetIdx = blockIndex !== null
      ? blockIndex
      : (activeBlockIndex !== null ? activeBlockIndex : (blocks.length > 0 ? blocks.length - 1 : 0));

    setVoiceTarget(target);
    voiceTargetRef.current = target;

    if (target === 'block') {
      setActiveBlockIndex(targetIdx);
      targetBlockIndexRef.current = targetIdx;
    }

    shouldBeListeningRef.current = true;
    setVoiceError(null);

    try {
      recognitionRef.current?.start();
      setIsListening(true);
      showToast(target === 'title' ? '🎙️ Listening: Speak your Article Title...' : `🎙️ Listening: Speak into Block #${targetIdx + 1}...`, 'info');
    } catch (e) {
      // Handled if already active
    }
  };

  const stopVoiceListening = () => {
    shouldBeListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');
    try {
      recognitionRef.current?.stop();
    } catch (e) {}
    showToast('Voice dictation paused', 'info');
  };

  const toggleVoiceForTarget = (target = 'block', blockIndex = null) => {
    if (isListening) {
      if (voiceTarget === target && (target === 'title' || activeBlockIndex === blockIndex)) {
        stopVoiceListening();
      } else {
        setVoiceTarget(target);
        voiceTargetRef.current = target;
        if (target === 'block' && blockIndex !== null) {
          setActiveBlockIndex(blockIndex);
          targetBlockIndexRef.current = blockIndex;
        }
        showToast(target === 'title' ? '🎙️ Dictating into: Title' : `🎙️ Dictating into: Block #${(blockIndex ?? 0) + 1}`, 'info');
      }
    } else {
      startVoiceListening(target, blockIndex);
    }
  };

  // Keyboard shortcut Alt+V to toggle speech-to-text
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        if (isListening) {
          stopVoiceListening();
        } else {
          startVoiceListening('block', activeBlockIndex);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, activeBlockIndex, blocks.length]);

  const handleUpgradeToAuthor = async () => {
    setUpgradingRole(true);
    try {
      const res = await api.post('/api/users/become-author');
      if (res.data?.user) {
        dispatch(updateCurrentUser(res.data.user));
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
        showToast('Welcome Author! Your account has been upgraded to Writer.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to upgrade account.', 'error');
    } finally {
      setUpgradingRole(false);
    }
  };


  const handleAISuggestMetadata = async () => {
    // Extract block content text
    const textToAnalyze = blocks.map(b => b.content || '').join(' ');
    if (!textToAnalyze.trim()) {
      showToast('Please write some content first so the AI can analyze it.', 'error');
      return;
    }

    setAiLoading(true);
    try {
      const res = await api.post('/api/blogs/suggest-metadata', {
        title,
        content: JSON.stringify(blocks)
      });

      if (res.data.category) {
        setCategory(res.data.category);
      }
      if (res.data.tags && res.data.tags.length > 0) {
        // Merge without duplicates
        const merged = [...new Set([...tags, ...res.data.tags])];
        setTags(merged);
      }
      if (res.data.title) {
        setSuggestedTitle(res.data.title);
      }

      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to generate metadata suggestions.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Grammar/Spell Check - sends user text to AI for corrections only (no new words)
  const handleGrammarCheck = async () => {
    // Extract all text content from blocks
    const textToCheck = blocks.map(b => b.content || '').join('\r\n');
    if (!textToCheck.trim()) {
      showToast('Please write some content first to check for grammar/spelling errors.', 'error');
      return;
    }

    setGrammarCheckLoading(true);
    setGrammarErrors([]);
    setGrammarSuggestions([]);
    try {
      const res = await api.post('/api/blogs/grammar-check', {
        content: textToCheck
      });

      if (res.data.errors && res.data.errors.length > 0) {
        setGrammarErrors(res.data.errors);
        setGrammarSuggestions(res.data.suggestions || []);
        setGrammarModalOpen(true);
      } else {
        showToast('No grammar or spelling errors found! Your writing looks great.', 'success');
      }

      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to check grammar.', 'error');
    } finally {
      setGrammarCheckLoading(false);
    }
  };


  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load existing article for edit
  useEffect(() => {
    if (editId) {
      setLoading(true);
      api.get(`/api/blogs/${editId}`)
        .then((res) => {
          const blog = res.data.blog;
          setCurrentBlog(blog);
          setTitle(blog.title);
          setContent(blog.content);
          setCoverImage(blog.coverImage || '');
          setCategory(blog.category || '');
          setTags(blog.tags || []);
          setStatus(blog.status || 'draft');
          setCollaborators(blog.collaborators || []);
          setCommunity(blog.community || '');
          setIsAnonymous(blog.isAnonymous || false);
          setCommentsEnabled(blog.commentsEnabled !== false);
          if (blog.status === 'scheduled') {
            setIsScheduled(true);
            if (blog.scheduledPublishTime) {
              const dt = new Date(blog.scheduledPublishTime);
              const offset = dt.getTimezoneOffset();
              const localDt = new Date(dt.getTime() - offset * 60 * 1000);
              setScheduledTime(localDt.toISOString().slice(0, 16));
            }
          }

          // Parse content string into blocks
          const loadedBlocks = parseHTMLToBlocks(blog.content);
          setBlocks(loadedBlocks);
          setLoading(false);

          // Auto-join co-authoring session if logged in
          if (user && user._id !== blog.author?._id) {
            api.post(`/api/blogs/${editId}/join-collab`).catch((err) => {
              if (err.response?.status === 403) {
                showToast(err.response?.data?.error || 'You were removed from this co-authoring session.', 'warning');
                navigate('/dashboard');
              }
            });
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to fetch article details.');
          setLoading(false);
        });
    }
  }, [editId, user]);

  // Load communities list
  useEffect(() => {
    api.get('/api/communities')
      .then((res) => {
        setMyCommunities(res.data.communities || []);
      })
      .catch((err) => {
        console.error('Failed to load communities:', err);
      });
  }, []);

  // Socket.io Real-time Collaboration Setup
  useEffect(() => {
    if (editId && user) {
      // Connect to Socket
      if (!socket.connected) {
        socket.connect();
      }

      // Join Room with metadata
      socket.emit('join_collab', {
        blogId: editId,
        userId: user._id,
        userName: user.name,
        userAvatar: user.profileImage || ''
      });

      // Listen for presence
      socket.on('collab_users', (usersList) => {
        setActiveCollaborators(usersList.filter(u => u.userId !== user._id));
      });

      // Listen for collaborator focus/cursor on specific block
      socket.on('block_focused', ({ userId, userName, blockId }) => {
        setBlockFocusMap(prev => {
          const next = { ...prev };
          if (!blockId) {
            delete next[userId];
          } else {
            next[userId] = { blockId, userName, userId, updatedAt: Date.now() };
          }
          return next;
        });
      });

      // Listen for collaborator real-time cursor coordinates
      socket.on('cursor_moved', ({ userId, userName, x, y, blockId }) => {
        if (String(userId) === String(user._id)) return;
        setRemoteCursors(prev => ({
          ...prev,
          [userId]: { x, y, userName, blockId, updatedAt: Date.now() }
        }));
      });

      // Listen for collaborator cursor remove/leave
      socket.on('cursor_removed', ({ userId }) => {
        setRemoteCursors(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        setBlockFocusMap(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      });

      // Listen for granular block edits (asynchronous, non-blocking)
      socket.on('block_updated', ({ blockId, field, val, userId }) => {
        if (String(userId) === String(user._id)) return;
        setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, [field]: val } : b));
      });

      // Listen for structural block edits (reorder, add, remove)
      socket.on('blocks_structure_updated', ({ blocks: remoteBlocks, userId }) => {
        if (String(userId) === String(user._id)) return;
        setBlocks(remoteBlocks);
        setContent(JSON.stringify(remoteBlocks));
      });

      // Listen for metadata updates (title, tags, category, cover)
      socket.on('meta_updated', ({ field, val, userId }) => {
        if (userId === user._id) return;
        if (field === 'title') setTitle(val);
        else if (field === 'coverImage') setCoverImage(val);
        else if (field === 'category') setCategory(val);
        else if (field === 'tags') setTags(val);
      });

      // Listen for collaborator typing indicator
      socket.on('collab_user_typing', ({ userId, userName, isTyping }) => {
        if (userId === user._id) return;
        if (isTyping) {
          setRemoteTypingUser(userName);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setRemoteTypingUser(null);
          }, 2500);
        } else {
          setRemoteTypingUser(null);
        }
      });

      // Listen for collaborator additions/removals
      socket.on('collaborator_added', ({ user: addedUser }) => {
        setCollaborators(prev => {
          if (prev.some(c => (c._id || c) === addedUser._id)) return prev;
          return [...prev, addedUser];
        });
      });

      socket.on('collaborator_removed', ({ userId }) => {
        if (userId === user?._id) {
          showToast('You have been removed from this co-authoring session by the author.', 'warning');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          setCollaborators(prev => prev.filter(c => String(c._id || c) !== String(userId)));
          setActiveCollaborators(prev => prev.filter(c => String(c.userId) !== String(userId)));
          setRemoteCursors(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
          setBlockFocusMap(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        }
      });

      socket.on('collab_kicked', ({ message }) => {
        showToast(message || 'You have been removed from this co-authoring session by the author.', 'warning');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      });

      // Listen for remote full keystroke edits (fallback)
      socket.on('content_updated', ({ content: remoteContent, title: remoteTitle, userId }) => {
        if (String(userId) === String(user._id)) return;
        if (remoteTitle !== undefined) setTitle(remoteTitle);
        if (remoteContent !== undefined) {
          setContent(remoteContent);
          try {
            const parsed = JSON.parse(remoteContent);
            if (Array.isArray(parsed)) {
              setBlocks(parsed);
            }
          } catch (e) {
            const converted = parseHTMLToBlocks(remoteContent);
            setBlocks(converted);
          }
        }
      });

      // Listen for collaborative sprints
      socket.on('sprint_started', ({ durationMs, wordCountGoal, startTime }) => {
        setSprintActive(true);
        setSprintGoal(wordCountGoal);
        setSprintDuration(durationMs);
        setSprintStartTime(startTime);
        setSprintTimeRemaining(durationMs);
        setSprintPartnerProgress({});
        showToast('Collaborative Writing Sprint Started! Keep focus!', 'info');
      });

      socket.on('sprint_progress', ({ userId, wordCount }) => {
        setSprintPartnerProgress(prev => ({
          ...prev,
          [userId]: wordCount
        }));
      });

      socket.on('sprint_cancelled', () => {
        setSprintActive(false);
        showToast('Writing sprint was cancelled.', 'warning');
      });
    }

    return () => {
      if (editId) {
        socket.emit('leave_collab', { blogId: editId, userId: user?._id });
        socket.off('collab_users');
        socket.off('block_focused');
        socket.off('cursor_moved');
        socket.off('cursor_removed');
        socket.off('block_updated');
        socket.off('blocks_structure_updated');
        socket.off('meta_updated');
        socket.off('collab_user_typing');
        socket.off('collaborator_added');
        socket.off('collaborator_removed');
        socket.off('collab_kicked');
        socket.off('content_updated');
        socket.off('sprint_started');
        socket.off('sprint_progress');
        socket.off('sprint_cancelled');
      }
    };
  }, [editId, user]);

  // Clean up stale cursors and inactive block focus locks
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setRemoteCursors(prev => {
        let changed = false;
        const next = { ...prev };
        Object.entries(next).forEach(([uid, cur]) => {
          if (now - cur.updatedAt > 5000) {
            delete next[uid];
            changed = true;
          }
        });
        return changed ? next : prev;
      });

      setBlockFocusMap(prev => {
        let changed = false;
        const next = { ...prev };
        Object.entries(next).forEach(([uid, f]) => {
          if (now - (f?.updatedAt || 0) > 8000) {
            delete next[uid];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Real-time canvas mouse movement tracking
  const handleCanvasMouseMove = (e) => {
    if (!editId || !user || !canvasRef.current) return;
    const now = Date.now();
    if (now - lastCursorEmitRef.current < 40) return; // ~25fps smooth
    lastCursorEmitRef.current = now;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    socket.emit('collab_cursor', {
      blogId: editId,
      userId: user._id,
      userName: user.name,
      x,
      y
    });
  };

  const handleCanvasMouseLeave = () => {
    if (!editId || !user) return;
    socket.emit('collab_cursor_leave', {
      blogId: editId,
      userId: user._id
    });
  };

  // Async Debounced Auto-Save Draft
  useEffect(() => {
    if (isInitialLoadRef.current) {
      if (editId && blocks.length > 0) {
        isInitialLoadRef.current = false;
      }
      return;
    }

    if (!editId || !isCoAuthorOrOwner || status === 'published') return;

    setAutoSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await api.put(`/api/blogs/${editId}`, {
          title: title.trim() || 'Untitled Blog',
          content: JSON.stringify(blocks),
          coverImage: coverImage.trim() || undefined,
          category: category || 'General',
          tags,
          status: 'draft'
        });
        setAutoSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save error:', err);
        setAutoSaveStatus('idle');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [blocks, title, coverImage, category, tags, editId, isCoAuthorOrOwner, status]);

  // Collaboration Action Handlers
  const handleBlockFocus = (blockId) => {
    if (editId && user) {
      socket.emit('collab_focus', {
        blogId: editId,
        userId: user._id,
        userName: user.name,
        blockId
      });
    }
  };

  const handleBlockBlur = () => {
    if (editId && user) {
      socket.emit('collab_focus', {
        blogId: editId,
        userId: user._id,
        userName: user.name,
        blockId: null
      });
    }
  };

  const handleStartLiveCollab = async () => {
    setStartingCollab(true);
    try {
      const payload = {
        title: title.trim() || 'Untitled Blog',
        content: JSON.stringify(blocks),
        category: category || 'General',
        tags,
        status: 'draft',
        collaborators: []
      };
      const res = await api.post('/api/blogs', payload);
      const newBlog = res.data.blog;
      setCurrentBlog(newBlog);
      setCollaborators(newBlog.collaborators || []);
      navigate(`/editor?edit=${newBlog._id}`, { replace: true });
      setIsCollabModalOpen(true);
      showToast('Co-authoring session ready! Share the link or invite peers.', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to start co-authoring session', 'error');
    } finally {
      setStartingCollab(false);
    }
  };

  const handleJoinCollab = async () => {
    if (!editId) return;
    setJoiningCollab(true);
    try {
      const res = await api.post(`/api/blogs/${editId}/join-collab`);
      setCurrentBlog(res.data.blog);
      setCollaborators(res.data.blog.collaborators || []);
      showToast('Successfully joined co-authoring session!', 'success');
      if (user) {
        socket.emit('join_collab', {
          blogId: editId,
          userId: user._id,
          userName: user.name,
          userAvatar: user.profileImage || ''
        });
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to join session', 'error');
    } finally {
      setJoiningCollab(false);
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/editor?edit=${editId}&collab=true`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    showToast('Co-author invite link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSearchUsers = async (q) => {
    setSearchUserQuery(q);
    if (!q || q.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const res = await api.get(`/api/users/search/authors?search=${encodeURIComponent(q.trim())}`);
      const existingIds = [user?._id, ...(collaborators.map(c => c._id || c))];
      const filtered = (res.data.users || []).filter(u => !existingIds.includes(u._id));
      setUserSearchResults(filtered);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleAddCollaborator = async (targetUser) => {
    if (!editId) return;
    try {
      const res = await api.post(`/api/blogs/${editId}/collaborators`, { userId: targetUser._id });
      setCollaborators(res.data.collaborators || []);
      setUserSearchResults(prev => prev.filter(u => u._id !== targetUser._id));
      showToast(`${targetUser.name} added as co-author!`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add collaborator', 'error');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!editId) return;
    try {
      // 1. Kick immediately via WebSocket so their session closes instantly
      socket.emit('kick_collaborator', { blogId: editId, userId: collaboratorId });

      // 2. Remove in MongoDB backend
      const res = await api.delete(`/api/blogs/${editId}/collaborators/${collaboratorId}`).catch(() => null);
      if (res && res.data?.collaborators) {
        setCollaborators(res.data.collaborators);
      } else {
        setCollaborators(prev => prev.filter(c => String(c._id || c) !== String(collaboratorId)));
      }

      // 3. Immediately clean up local state
      setActiveCollaborators(prev => prev.filter(c => String(c.userId) !== String(collaboratorId)));
      setRemoteCursors(prev => {
        const next = { ...prev };
        delete next[collaboratorId];
        return next;
      });
      setBlockFocusMap(prev => {
        const next = { ...prev };
        delete next[collaboratorId];
        return next;
      });

      showToast('Collaborator removed from draft', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to remove collaborator', 'error');
    }
  };

  // Sync block state changes and broadcast to collaborators
  const handleBlocksChange = (newBlocks) => {
    setBlocks(newBlocks);
    const serialized = JSON.stringify(newBlocks);
    setContent(serialized);

    if (editId) {
      socket.emit('edit_blocks_structure', {
        blogId: editId,
        blocks: newBlocks,
        userId: user?._id
      });
      socket.emit('edit_content', {
        blogId: editId,
        content: serialized,
        title,
        userId: user?._id
      });

      if (sprintActive) {
        const text = newBlocks.map(b => b.content || '').join(' ');
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        socket.emit('update_sprint_progress', {
          blogId: editId,
          userId: user._id,
          wordCount: words
        });
      }
    }
  };
  
  const handleApplyTemplate = (templateType) => {
    if (blocks.some(b => b.content && b.content.trim() !== '')) {
      if (!window.confirm("Applying a template will overwrite your current editor blocks. Do you want to proceed?")) {
        return;
      }
    }

    setSelectedTemplate(templateType);

    let templateBlocks = [];
    const baseId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

    if (templateType === 'empty') {
      templateBlocks = [
        { id: baseId(), type: 'h1', content: '' },
        { id: baseId(), type: 'p', content: '' }
      ];
    } else if (templateType === 'tech') {
      templateBlocks = [
        { id: baseId(), type: 'h1', content: '' },
        { id: baseId(), type: 'p', content: '' },
        { id: baseId(), type: 'h2', content: '' },
        { id: baseId(), type: 'p', content: '' },
        { id: baseId(), type: 'quote', content: '' },
        { id: baseId(), type: 'h2', content: '' },
        { id: baseId(), type: 'code', content: '', language: 'javascript' },
        { id: baseId(), type: 'callout', content: '', icon: '💡' },
        { id: baseId(), type: 'p', content: '' }
      ];
    } else if (templateType === 'opinion') {
      templateBlocks = [
        { id: baseId(), type: 'h1', content: '' },
        { id: baseId(), type: 'p', content: '' },
        { id: baseId(), type: 'h2', content: '' },
        { id: baseId(), type: 'p', content: '' },
        { id: baseId(), type: 'quote', content: '' },
        { id: baseId(), type: 'callout', content: '', icon: '🏆' },
        { id: baseId(), type: 'p', content: '' }
      ];
    } else if (templateType === 'news') {
      templateBlocks = [
        { id: baseId(), type: 'h1', content: '' },
        { id: baseId(), type: 'p', content: '' },
        { id: baseId(), type: 'h2', content: '' },
        { id: baseId(), type: 'list', content: '' },
        { id: baseId(), type: 'quote', content: '' },
        { id: baseId(), type: 'h2', content: '' },
        { id: baseId(), type: 'p', content: '' }
      ];
    } else if (templateType === 'tutorial') {
      templateBlocks = [
        { id: baseId(), type: 'h1', content: '' },
        { id: baseId(), type: 'p', content: '' },
        { id: baseId(), type: 'h2', content: '' },
        { id: baseId(), type: 'list', content: '' },
        { id: baseId(), type: 'h2', content: '' },
        { id: baseId(), type: 'p', content: '' },
        { id: baseId(), type: 'code', content: '', language: 'bash' },
        { id: baseId(), type: 'h2', content: '' },
        { id: baseId(), type: 'p', content: '' },
        { id: baseId(), type: 'code', content: '', language: 'javascript' },
        { id: baseId(), type: 'callout', content: '', icon: '💡' },
        { id: baseId(), type: 'h2', content: '' },
        { id: baseId(), type: 'p', content: '' }
      ];
    }

    if (templateBlocks.length > 0) {
      handleBlocksChange(templateBlocks);
      showToast(`${templateType.charAt(0).toUpperCase() + templateType.slice(1)} layout structure applied!`, 'success');
    }
  };

  const handleApplyCorrection = (error) => {
    let corrected = false;
    const newBlocks = blocks.map(block => {
      if (block.content && block.content.includes(error.original)) {
        corrected = true;
        return {
          ...block,
          content: block.content.replace(error.original, error.suggestion)
        };
      }
      return block;
    });

    if (corrected) {
      handleBlocksChange(newBlocks);
      setGrammarErrors(prev => {
        const filtered = prev.filter(e => e !== error);
        if (filtered.length === 0) {
          confetti({
            particleCount: 50,
            spread: 40,
            origin: { y: 0.6 }
          });
        }
        return filtered;
      });
      showToast(`Corrected "${error.original}" to "${error.suggestion}"`, 'success');
    } else {
      setGrammarErrors(prev => prev.filter(e => e !== error));
      showToast(`Original text was modified. Correction dismissed.`, 'info');
    }
  };

  const handleApplyAllCorrections = () => {
    let correctedCount = 0;
    let currentBlocks = [...blocks];

    grammarErrors.forEach(error => {
      if (error.suggestion) {
        let errorCorrected = false;
        currentBlocks = currentBlocks.map(block => {
          if (block.content && block.content.includes(error.original)) {
            errorCorrected = true;
            return {
              ...block,
              content: block.content.replace(error.original, error.suggestion)
            };
          }
          return block;
        });
        if (errorCorrected) {
          correctedCount++;
        }
      }
    });

    setGrammarErrors([]);
    if (correctedCount > 0) {
      handleBlocksChange(currentBlocks);
      showToast(`Successfully applied ${correctedCount} correction(s)!`, 'success');
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.6 }
      });
    } else {
      showToast(`Dismissed spelling/grammar check issues.`, 'info');
    }
  };

  // Sprint countdown timer effect
  useEffect(() => {
    let timer;
    if (sprintActive && sprintStartTime) {
      timer = setInterval(() => {
        const elapsed = Date.now() - sprintStartTime;
        const remaining = Math.max(0, sprintDuration - elapsed);
        setSprintTimeRemaining(remaining);
        if (remaining === 0) {
          setSprintActive(false);
          confetti({ particleCount: 120, spread: 80 });
          showToast('🏆 Writing Sprint Completed! Excellent job!', 'success');
          clearInterval(timer);
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sprintActive, sprintStartTime, sprintDuration]);

  const handleStartSprint = () => {
    if (!editId) {
      showToast('Join a collaborative session by editing an existing blog to start a sprint.', 'warning');
      return;
    }
    socket.emit('start_sprint', {
      blogId: editId,
      durationMs: sprintDuration,
      wordCountGoal: sprintGoal
    });
  };

  const handleCancelSprint = () => {
    if (editId) {
      socket.emit('cancel_sprint', { blogId: editId });
    }
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    if (editId) {
      socket.emit('edit_meta', {
        blogId: editId,
        field: 'title',
        val,
        userId: user?._id
      });
      socket.emit('edit_content', {
        blogId: editId,
        content,
        title: val,
        userId: user?._id
      });
    }
  };

  // Drag & drop logic
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnBlock = (e, targetIndex) => {
    e.preventDefault();
    const newType = e.dataTransfer.getData('newBlockType');

    if (newType) {
      const newBlock = createBlockInstance(newType);
      const updated = [...blocks];
      updated.splice(targetIndex, 0, newBlock);
      handleBlocksChange(updated);
    } else if (draggedIndex !== null) {
      const updated = [...blocks];
      const [removed] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, removed);
      setDraggedIndex(null);
      handleBlocksChange(updated);
    }
  };

  const handleDropAtEnd = (e) => {
    e.preventDefault();
    const newType = e.dataTransfer.getData('newBlockType');

    if (newType) {
      const newBlock = createBlockInstance(newType);
      handleBlocksChange([...blocks, newBlock]);
    } else if (draggedIndex !== null) {
      const updated = [...blocks];
      const [removed] = updated.splice(draggedIndex, 1);
      updated.push(removed);
      setDraggedIndex(null);
      handleBlocksChange(updated);
    }
  };

  // Block management actions
  const addBlock = (type) => {
    const newBlock = createBlockInstance(type);
    handleBlocksChange([...blocks, newBlock]);
  };

  const deleteBlock = (index) => {
    const updated = blocks.filter((_, i) => i !== index);
    handleBlocksChange(updated.length > 0 ? updated : [createBlockInstance('p')]);
  };

  const duplicateBlock = (index) => {
    const sourceBlock = blocks[index];
    const duplicated = {
      ...sourceBlock,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5)
    };
    const updated = [...blocks];
    updated.splice(index + 1, 0, duplicated);
    handleBlocksChange(updated);
  };

  const insertBlockBelow = (targetIndex, type = 'p') => {
    const newBlock = createBlockInstance(type);
    const updated = [...blocks];
    const insertAt = targetIndex + 1;
    updated.splice(insertAt, 0, newBlock);
    handleBlocksChange(updated);
    setActiveBlockIndex(insertAt);
    setTimeout(() => {
      const el = document.getElementById(`block-input-${newBlock.id}`);
      if (el) {
        el.focus();
        if (el.setSelectionRange) {
          el.setSelectionRange(0, 0);
        }
      }
      handleBlockFocus(newBlock.id);
    }, 70);
  };

  const handleBlockKeyDown = (e, index, blockType, blockContent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (['h1', 'h2', 'quote', 'callout', 'p'].includes(blockType)) {
        e.preventDefault();
        insertBlockBelow(index, 'p');
      }
    } else if (e.key === 'Backspace' && (!blockContent || blockContent.trim() === '') && blocks.length > 1) {
      e.preventDefault();
      const prevIndex = Math.max(0, index - 1);
      const prevBlock = blocks[prevIndex];
      deleteBlock(index);
      setTimeout(() => {
        if (prevBlock) {
          const prevEl = document.getElementById(`block-input-${prevBlock.id}`);
          if (prevEl) {
            prevEl.focus();
            if (prevEl.setSelectionRange) {
              const len = prevEl.value.length;
              prevEl.setSelectionRange(len, len);
            }
          }
        }
      }, 50);
    }
  };

  const calculateDraftScore = () => {
    let score = 0;
    if (title && title.trim()) {
      score += 20;
      if (title.length >= 10 && title.length <= 60) score += 10;
    }
    const hasHeadings = blocks.some(b => b.type === 'h1' || b.type === 'h2');
    if (hasHeadings) score += 20;
    const wordCount = blocks.map(b => b.content || '').join(' ').split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 50) score += 20;
    if (tags.length > 0) score += 15;
    const hasListOrQuote = blocks.some(b => b.type === 'ul' || b.type === 'ol' || b.type === 'quote');
    if (hasListOrQuote) score += 15;
    return score;
  };

  const getSuggestions = () => {
    const list = [];
    if (!title || !title.trim()) {
      list.push("Add a catchy title to your article.");
    } else if (title.length < 10) {
      list.push("Your title is a bit too short for SEO search.");
    }
    const hasHeadings = blocks.some(b => b.type === 'h1' || b.type === 'h2');
    if (!hasHeadings) {
      list.push("Use headings (H1/H2) to structure your text layout.");
    }
    const wordCount = blocks.map(b => b.content || '').join(' ').split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 100) {
      list.push("Write at least 100 words to improve content value.");
    }
    if (tags.length === 0) {
      list.push("Select or write a few tags for discoverability.");
    }
    const hasListOrQuote = blocks.some(b => b.type === 'ul' || b.type === 'ol' || b.type === 'quote');
    if (!hasListOrQuote) {
      list.push("Include a quote or bullet list to engage readers.");
    }
    return list;
  };

  const moveBlock = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    handleBlocksChange(updated);
  };

  const updateBlockProperty = (identifier, key, val) => {
    let targetBlockId = null;
    setBlocks(prevBlocks => {
      const updated = prevBlocks.map((b, i) => {
        if (b.id === identifier || i === identifier) {
          targetBlockId = b.id;
          return { ...b, [key]: val };
        }
        return b;
      });
      setContent(JSON.stringify(updated));
      return updated;
    });

    const blockId = targetBlockId || (typeof identifier === 'string' ? identifier : blocks[identifier]?.id);

    if (editId && blockId) {
      socket.emit('edit_block', {
        blogId: editId,
        blockId,
        field: key,
        val,
        userId: user?._id
      });

      // Keep focus state active and fresh while typing
      socket.emit('collab_focus', {
        blogId: editId,
        userId: user?._id,
        userName: user?.name,
        blockId
      });

      socket.emit('collab_typing', {
        blogId: editId,
        userId: user?._id,
        userName: user?.name,
        isTyping: true
      });
    }
  };

  // Add Tag
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleaned && !tags.includes(cleaned)) {
        const nextTags = [...tags, cleaned];
        setTags(nextTags);
        if (editId) {
          socket.emit('edit_meta', { blogId: editId, field: 'tags', val: nextTags, userId: user?._id });
        }
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    const nextTags = tags.filter((_, idx) => idx !== indexToRemove);
    setTags(nextTags);
    if (editId) {
      socket.emit('edit_meta', { blogId: editId, field: 'tags', val: nextTags, userId: user?._id });
    }
  };

  // Search User to add as Collaborator
  const handleUserSearch = async (val) => {
    setSearchUserQuery(val);
    if (val.trim().length > 1) {
      try {
        const res = await api.get(`/api/users?search=${val}`);
        const mockUsers = [
          { _id: '64f7b4c6e9118e001c38fa11', name: 'Alice Smith', email: 'alice@example.com' },
          { _id: '64f7b4c6e9118e001c38fa22', name: 'Bob Carter', email: 'bob@example.com' },
          { _id: '64f7b4c6e9118e001c38fa33', name: 'Charlie Dave', email: 'charlie@example.com' }
        ];
        const filtered = mockUsers.filter(u => u.name.toLowerCase().includes(val.toLowerCase()) || u.email.toLowerCase().includes(val.toLowerCase()));
        setUserSearchResults(filtered);
      } catch (e) {
        setUserSearchResults([]);
      }
    } else {
      setUserSearchResults([]);
    }
  };

  const addCollaborator = (collabUser) => {
    if (!collaborators.some(c => c._id === collabUser._id)) {
      setCollaborators([...collaborators, collabUser]);
    }
    setSearchUserQuery('');
    setUserSearchResults([]);
  };

  const removeCollaborator = (id) => {
    setCollaborators(collaborators.filter(c => c._id !== id));
  };

  // Save Blog
  const handleSave = async (publishStatus = 'draft') => {
    // Client-side input validation
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return setError('Please enter a title for your article.');
    }
    if (trimmedTitle.length < 3) {
      return setError('Article title must be at least 3 characters long.');
    }
    if (trimmedTitle.length > 150) {
      return setError('Article title cannot exceed 150 characters.');
    }

    const hasText = blocks.some(b => b.content && b.content.trim().length > 0);
    if (!hasText) {
      return setError('Please add some text content to your article blocks before saving.');
    }

    if (publishStatus === 'scheduled' || isScheduled) {
      if (!scheduledTime) {
        return setError('Please select a scheduled publish date and time.');
      }
      const schedDate = new Date(scheduledTime);
      const now = new Date();
      const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (schedDate <= now) {
        return setError('Scheduled publish time must be in the future.');
      }
      if (schedDate > maxDate) {
        return setError('Scheduled publish time must be within 7 days from now.');
      }
    }

    // Intercept with spam check if publishing
    if (publishStatus === 'published' && !bypassSpamCheck) {
      setSaving(true);
      setError('');
      try {
        const spamRes = await api.post('/api/blogs/check-spam', {
          title: title.trim(),
          content: JSON.stringify(blocks),
          tags
        });

        if (spamRes.data.isSpam) {
          setSpamScore(spamRes.data.spamScore);
          setSpamReasons(spamRes.data.reasons);
          setSpamModalOpen(true);
          setSaving(false);
          return; // Stop and prompt user in warnings modal
        }
      } catch (err) {
        console.error('Spam scan failed, skipping checks:', err);
      } finally {
        setSaving(false);
      }
    }

    setSaving(true);
    setError('');

    const payload = {
      title: title.trim(),
      content: content.trim(),
      coverImage: coverImage.trim() || undefined,
      category,
      tags,
      status: publishStatus,
      collaborators: collaborators.map(c => c._id),
      community: community || undefined,
      isAnonymous,
      commentsEnabled,
      scheduledPublishTime: isScheduled && scheduledTime ? new Date(scheduledTime).toISOString() : null
    };

    try {
      if (editId) {
        await api.put(`/api/blogs/${editId}`, payload);
      } else {
        await api.post('/api/blogs', payload);
      }

      setSaving(false);

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save blog post.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
        Loading editor session...
      </div>
    );
  }

  return (
    <div className="max-w-[95%] xl:max-w-[1550px] mx-auto px-4 py-8">
      {/* Editor Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <PenTool className="w-8 h-8 text-primary-500" />
            <span>{editId ? 'Collaborative Studio' : 'Create New Article'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {editId ? 'Real-time collaborative editing active across your network' : 'Drafting new blog'}
          </p>
        </div>

        {/* Center Indicators: Auto-save, Typing, Active Presence */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto-Save Indicator */}
          {editId && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-xs">
              {autoSaveStatus === 'saving' ? (
                <>
                  <CloudUpload className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">Syncing draft...</span>
                </>
              ) : autoSaveStatus === 'saved' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">All changes saved</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-slate-400" />
                  <span>Draft saved</span>
                </>
              )}
            </div>
          )}

          {/* Typing Indicator */}
          {remoteTypingUser && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-xs font-bold text-amber-700 dark:text-amber-300 animate-pulse">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>{remoteTypingUser} is typing...</span>
            </div>
          )}

          {/* Multi-User Distinct Cursor Status Bar */}
          {editId && (
            <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-full shadow-xs">
              {/* You (Cursor 1) */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm ring-2 ring-amber-400/40" />
                <span className="text-[11px]">You (Cursor 1)</span>
              </div>

              {/* Remote Collaborators (Cursor 2, 3...) */}
              {activeCollaborators.length > 0 ? (
                <>
                  <div className="w-[1px] h-3.5 bg-slate-300 dark:bg-slate-700" />
                  <div className="flex items-center gap-2">
                    {activeCollaborators.map((c, idx) => {
                      const theme = getCollabTheme(c.userId);
                      return (
                        <div key={c.userId} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-sm ring-2"
                            style={{ backgroundColor: theme.color, ringColor: `${theme.color}66` }}
                          />
                          <span className="text-[11px]" style={{ color: theme.color }}>
                            {c.userName} (Cursor {idx + 2})
                          </span>
                        </div>
                      );
                    })}
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      ⚡ {activeCollaborators.length + 1} Cursors Synced
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-[1px] h-3.5 bg-slate-300 dark:bg-slate-700" />
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Solo Cursor · Share link for 2nd cursor
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Co-Authors Button */}
          {editId ? (
            <button
              type="button"
              onClick={() => setIsCollabModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-105 shadow-sm transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Co-Authors ({collaborators.length + 1})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartLiveCollab}
              disabled={startingCollab}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              <span>{startingCollab ? 'Starting...' : 'Start Live Collab'}</span>
            </button>
          )}

          {/* Speak to Write / Voice Dictation Button */}
          <button
            type="button"
            onClick={() => toggleVoiceForTarget('block', activeBlockIndex)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full transition-all shadow-sm ${
              isListening
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse ring-2 ring-rose-400'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
            title="Click to speak and auto-write into your blog (Shortcut: Alt+V)"
          >
            {isListening ? (
              <>
                <Mic className="w-4 h-4 text-white animate-bounce" />
                <span>Listening...</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-amber-500" />
                <span>Speak to Write</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setEditorMode(editorMode === 'edit' ? 'preview' : 'edit')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {editorMode === 'edit' ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{editorMode === 'edit' ? 'Preview' : 'Editor'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 border border-slate-200 dark:border-slate-800"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(isScheduled ? 'scheduled' : 'published')}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-full text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/10"
          >
            {isScheduled ? <Clock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            <span>{isScheduled ? 'Schedule Article' : 'Publish Article'}</span>
          </button>
        </div>
      </div>

      {/* Invite Join Banner: Shown if user opens a shared draft link without having joined yet */}
      {editId && currentBlog && !isCoAuthorOrOwner && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-400 dark:border-amber-600/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Co-Author Invitation for "{currentBlog.title || 'Untitled Draft'}"
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                You were invited by <strong className="text-slate-800 dark:text-slate-200">{currentBlog.author?.name || 'the author'}</strong> to write and edit this blog together in real-time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleJoinCollab}
            disabled={joiningCollab}
            className="px-5 py-2 text-xs font-extrabold rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            {joiningCollab ? 'Joining Session...' : 'Join Writing Session'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Editor Body Split */}
      <div className="flex flex-col lg:flex-row gap-8">
        <main className="flex-1 space-y-6">
          {editorMode === 'edit' ? (
            <div className="space-y-6">
              {/* Zoom & View Settings Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                    className={`p-2 rounded-xl border transition-all ${showLeftSidebar
                        ? 'bg-primary-50 border-primary-100 text-primary-600 dark:bg-primary-950/20 dark:border-primary-900/30 dark:text-primary-400 font-bold'
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-500'
                      }`}
                    title={showLeftSidebar ? "Hide Block Palette" : "Show Block Palette"}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRightSidebar(!showRightSidebar)}
                    className={`p-2 rounded-xl border transition-all ${showRightSidebar
                        ? 'bg-primary-50 border-primary-100 text-primary-600 dark:bg-primary-950/20 dark:border-primary-900/30 dark:text-primary-400 font-bold'
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-500'
                      }`}
                    title={showRightSidebar ? "Hide Settings Sidebar" : "Show Settings Sidebar"}
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase select-none">Template:</span>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleApplyTemplate(e.target.value);
                      }
                    }}
                    className="px-2.5 py-1 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>Select Layout...</option>
                    <option value="empty">Empty Draft</option>
                    <option value="tech">Tech Article</option>
                    <option value="opinion">Opinion & Review</option>
                    <option value="news">News & Announcement</option>
                    <option value="tutorial">Tutorial & Guide</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGrammarCheck}
                    disabled={grammarCheckLoading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                    title="Check grammar & spelling errors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Grammar Check</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 px-3.5 py-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase select-none">Zoom:</span>
                  <button
                    type="button"
                    onClick={() => setEditorZoom(Math.max(80, editorZoom - 10))}
                    className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 font-bold text-xs"
                    title="Zoom Out"
                  >
                    A-
                  </button>
                  <input
                    type="range"
                    min="80"
                    max="200"
                    step="10"
                    value={editorZoom}
                    onChange={(e) => setEditorZoom(Number(e.target.value))}
                    className="w-24 accent-primary-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setEditorZoom(Math.min(200, editorZoom + 10))}
                    className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 font-bold text-xs"
                    title="Zoom In"
                  >
                    A+
                  </button>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 min-w-[40px] text-right">
                    {editorZoom}%
                  </span>
                  {editorZoom !== 100 && (
                    <button
                      type="button"
                      onClick={() => setEditorZoom(100)}
                      className="text-[10px] text-primary-500 hover:underline font-bold"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Cover Image URL input */}
              <input
                type="text"
                placeholder="Paste Cover Image URL (e.g. Unsplash link)..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border rounded-2xl bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
              />

              {/* Title input with Voice Dictation */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Article Title..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onFocus={() => {
                    if (isListening && voiceTarget !== 'title') {
                      setVoiceTarget('title');
                      voiceTargetRef.current = 'title';
                    }
                  }}
                  className="w-full pr-12 px-4 py-3 text-2xl sm:text-3xl font-extrabold border-b border-slate-100 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-700 focus:outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => toggleVoiceForTarget('title')}
                  className={`absolute right-2 p-2 rounded-full transition-all ${
                    isListening && voiceTarget === 'title'
                      ? 'bg-rose-500 text-white shadow-md animate-pulse ring-2 ring-rose-400'
                      : 'text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={isListening && voiceTarget === 'title' ? 'Stop Dictating Title' : 'Speak to Dictate Title'}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>

              {/* Drag and Drop Canvas Layout */}
              <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
                {/* Block Palette Panel */}
                {showLeftSidebar && (
                  <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-3xl sticky top-24 space-y-4">
                    <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Add Blocks</h4>
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                      {[
                        { type: 'h1', label: 'Heading 1', icon: Heading1, desc: 'Large title', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
                        { type: 'h2', label: 'Heading 2', icon: Heading2, desc: 'Subheading', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
                        { type: 'p', label: 'Paragraph', icon: AlignLeft, desc: 'Plain text body', color: 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-[#1b1f2b]' },
                        { type: 'quote', label: 'Quote Box', icon: Quote, desc: 'Highlighted quote', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
                        { type: 'list', label: 'Bullet List', icon: List, desc: 'Itemized list', color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20' },
                        { type: 'callout', label: 'Callout Box', icon: Lightbulb, desc: 'Key tip box', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20' },
                        { type: 'image', label: 'Image URL', icon: Image, desc: 'Paste image link', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
                        { type: 'code', label: 'Code Block', icon: Code, desc: 'Developer syntax', color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20' }
                      ].map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <div
                            key={item.type}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('newBlockType', item.type);
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            onClick={() => addBlock(item.type)}
                            className="flex items-center gap-2.5 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-grab active:cursor-grabbing hover:border-primary-500/50 transition-all select-none text-left group"
                            title="Drag to canvas or click to append"
                          >
                            <div className={`p-2 rounded-xl ${item.color} group-hover:scale-105 transition-all duration-300`}>
                              <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                              <span className="block text-[8px] text-slate-400 font-semibold">{item.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Editor Canvas Drop Zone */}
                <div className="flex-1 w-full space-y-4">
                  <div
                    ref={canvasRef}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={handleCanvasMouseLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDropAtEnd}
                    className="min-h-[520px] border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-5 bg-white dark:bg-slate-900/40 relative space-y-4 overflow-hidden"
                  >
                    {/* Real-time Floating Collaborator Cursors (Figma / Notion style) */}
                    {Object.entries(remoteCursors).map(([uid, cursor]) => {
                      const theme = getCollabTheme(uid);
                      return (
                        <div
                          key={uid}
                          className="absolute pointer-events-none z-30 transition-all duration-75 ease-out select-none"
                          style={{
                            left: `${cursor.x}px`,
                            top: `${cursor.y}px`,
                            transform: 'translate(-2px, -2px)'
                          }}
                        >
                          <svg
                            className="w-5 h-5 drop-shadow-md"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                              fill={theme.color}
                              stroke="white"
                              strokeWidth="1.5"
                            />
                          </svg>
                          <div
                            className="absolute left-3 top-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white shadow-md whitespace-nowrap flex items-center gap-1"
                            style={{ backgroundColor: theme.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>{cursor.userName}</span>
                          </div>
                        </div>
                      );
                    })}

                    {blocks.length === 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                        <PenTool className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                        <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400">Your Blog Canvas</h3>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                          Drag and drop blocks here from the left palette or click on items to build your blog post.
                        </p>
                      </div>
                    )}

                    {blocks.map((block, index) => {
                      const remoteFocusedBy = Object.values(blockFocusMap).find(
                        f => f?.blockId === block.id && String(f?.userId) !== String(user?._id)
                      );
                      const isOccupiedByOther = Boolean(remoteFocusedBy);
                      const collabTheme = remoteFocusedBy ? getCollabTheme(remoteFocusedBy.userId) : null;
                      return (
                        <React.Fragment key={block.id}>
                          <div
                            draggable={!isOccupiedByOther}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDropOnBlock(e, index)}
                            style={isOccupiedByOther && collabTheme ? {
                              borderColor: collabTheme.color,
                              boxShadow: `0 0 0 2px ${collabTheme.color}33, 0 4px 16px ${collabTheme.color}15`
                            } : undefined}
                            className={`group relative flex gap-3 p-4 border rounded-2xl bg-white dark:bg-slate-900 transition-all duration-200 ${
                              isOccupiedByOther
                                ? ''
                                : 'border-slate-100 dark:border-slate-800/60 hover:shadow-sm hover:border-slate-200 dark:hover:border-slate-800'
                            }`}
                          >
                            {/* Live Collaborator Presence on this Block */}
                            {isOccupiedByOther && collabTheme && (
                              <div
                                className="absolute -top-3.5 right-4 z-20 flex items-center gap-1.5 px-3 py-0.5 rounded-full text-white font-extrabold text-[10px] shadow-md animate-fade-in pointer-events-none"
                                style={{ backgroundColor: collabTheme.color }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                <span>{remoteFocusedBy.userName} is editing here</span>
                              </div>
                            )}

                            {/* Drag Handle & Reordering controls */}
                            <div className="flex flex-col items-center justify-between text-slate-300 dark:text-slate-700 select-none py-1 flex-shrink-0">
                              <div className="cursor-grab active:cursor-grabbing hover:text-slate-500">
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-0.5 mt-2 transition-opacity duration-200">
                                <button
                                  type="button"
                                  onClick={() => moveBlock(index, 'up')}
                                  disabled={index === 0}
                                  className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30 hover:text-slate-600 dark:hover:text-slate-300"
                                  title="Move up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveBlock(index, 'down')}
                                  disabled={index === blocks.length - 1}
                                  className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30 hover:text-slate-600 dark:hover:text-slate-300"
                                  title="Move down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Block Content Inputs */}
                            <div 
                              className="flex-1 min-w-0 relative"
                              onClick={(e) => {
                                if (isOccupiedByOther) {
                                  e.stopPropagation();
                                  insertBlockBelow(index, 'p');
                                  showToast(`${remoteFocusedBy.userName} is editing that block. Added a new block below so you can write independently!`, 'info');
                                }
                              }}
                            >
                              {/* Collaborator Occupied Banner with Instant Independent Block Fork */}
                              {isOccupiedByOther && collabTheme && (
                                <div
                                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 mb-2.5 rounded-xl text-xs font-semibold shadow-xs animate-fade-in"
                                  style={{
                                    backgroundColor: `${collabTheme.color}15`,
                                    border: `1.5px solid ${collabTheme.color}40`,
                                    color: collabTheme.color
                                  }}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-2 h-2 rounded-full animate-ping flex-shrink-0" style={{ backgroundColor: collabTheme.color }} />
                                    <span className="truncate">{remoteFocusedBy.userName} is writing in this block</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      insertBlockBelow(index, 'p');
                                      showToast(`Added a new block below for you to work independently!`, 'success');
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-white font-bold text-[11px] shadow-sm hover:opacity-90 flex items-center gap-1 transition-all cursor-pointer flex-shrink-0"
                                    style={{ backgroundColor: collabTheme.color }}
                                    title="Start your own block below without disturbing their work"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Work in New Block Below</span>
                                  </button>
                                </div>
                              )}

                              {/* In-Block Caret Indicator for Remote Collaborator */}
                              {isOccupiedByOther && collabTheme && (
                                <div className="absolute -top-1 left-0 z-10 pointer-events-none flex items-center gap-1 animate-fade-in">
                                  <div
                                    className="w-[2.5px] h-4 rounded-full animate-pulse shadow-sm"
                                    style={{ backgroundColor: collabTheme.color }}
                                  />
                                  <span
                                    className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold text-white shadow-xs"
                                    style={{ backgroundColor: collabTheme.color }}
                                  >
                                    {remoteFocusedBy.userName}
                                  </span>
                                </div>
                              )}

                              {block.type === 'h1' && (
                                <textarea
                                  id={`block-input-${block.id}`}
                                  value={block.content}
                                  readOnly={isOccupiedByOther}
                                  title={isOccupiedByOther ? `${remoteFocusedBy.userName} is editing this block. Click to work in a new block below.` : undefined}
                                  onChange={(e) => {
                                    if (isOccupiedByOther) return;
                                    updateBlockProperty(index, 'content', e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                  }}
                                  onKeyDown={(e) => handleBlockKeyDown(e, index, 'h1', block.content)}
                                  onFocus={(e) => {
                                    if (isOccupiedByOther) return;
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                    setActiveBlockIndex(index);
                                    handleBlockFocus(block.id);
                                  }}
                                  onBlur={handleBlockBlur}
                                  rows={1}
                                  placeholder="Heading 1..."
                                  className={`w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 placeholder-slate-300 dark:placeholder-slate-700 resize-none overflow-hidden text-slate-900 dark:text-white ${isOccupiedByOther ? 'cursor-pointer' : ''} ${block.bold === false ? 'font-normal' : 'font-extrabold'} ${block.italic ? 'italic' : ''} ${block.underline ? 'underline' : ''}`}
                                  style={{ fontSize: `${(24 * editorZoom) / 100}px` }}
                                />
                              )}

                              {block.type === 'h2' && (
                                <textarea
                                  id={`block-input-${block.id}`}
                                  value={block.content}
                                  readOnly={isOccupiedByOther}
                                  title={isOccupiedByOther ? `${remoteFocusedBy.userName} is editing this block. Click to work in a new block below.` : undefined}
                                  onChange={(e) => {
                                    if (isOccupiedByOther) return;
                                    updateBlockProperty(index, 'content', e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                  }}
                                  onKeyDown={(e) => handleBlockKeyDown(e, index, 'h2', block.content)}
                                  onFocus={(e) => {
                                    if (isOccupiedByOther) return;
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                    setActiveBlockIndex(index);
                                    handleBlockFocus(block.id);
                                  }}
                                  onBlur={handleBlockBlur}
                                  rows={1}
                                  placeholder="Heading 2..."
                                  className={`w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 placeholder-slate-300 dark:placeholder-slate-700 resize-none overflow-hidden text-slate-800 dark:text-slate-100 ${isOccupiedByOther ? 'cursor-pointer' : ''} ${block.bold === false ? 'font-normal' : 'font-bold'} ${block.italic ? 'italic' : ''} ${block.underline ? 'underline' : ''}`}
                                  style={{ fontSize: `${(20 * editorZoom) / 100}px` }}
                                />
                              )}

                              {block.type === 'p' && (
                                <textarea
                                  id={`block-input-${block.id}`}
                                  value={block.content}
                                  readOnly={isOccupiedByOther}
                                  title={isOccupiedByOther ? `${remoteFocusedBy.userName} is editing this block. Click to work in a new block below.` : undefined}
                                  onChange={(e) => {
                                    if (isOccupiedByOther) return;
                                    updateBlockProperty(index, 'content', e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                  }}
                                  onKeyDown={(e) => handleBlockKeyDown(e, index, 'p', block.content)}
                                  onFocus={(e) => {
                                    if (isOccupiedByOther) return;
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                    setActiveBlockIndex(index);
                                    handleBlockFocus(block.id);
                                  }}
                                  onBlur={handleBlockBlur}
                                  rows={2}
                                  placeholder="Start typing paragraph text..."
                                  className={`w-full text-slate-700 dark:text-slate-300 bg-transparent border-none p-0 focus:outline-none focus:ring-0 placeholder-slate-300 dark:placeholder-slate-700 resize-none leading-relaxed font-medium ${isOccupiedByOther ? 'cursor-pointer' : ''} ${block.bold ? 'font-bold' : 'font-normal'} ${block.italic ? 'italic' : ''} ${block.underline ? 'underline' : ''}`}
                                  style={{ fontSize: `${(14 * editorZoom) / 100}px` }}
                                />
                              )}

                              {block.type === 'quote' && (
                                <div className="border-l-4 border-primary-500 pl-3.5 bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-r-xl">
                                  <textarea
                                    id={`block-input-${block.id}`}
                                    value={block.content}
                                    readOnly={isOccupiedByOther}
                                    title={isOccupiedByOther ? `${remoteFocusedBy.userName} is editing this block. Click to work in a new block below.` : undefined}
                                    onChange={(e) => {
                                      if (isOccupiedByOther) return;
                                      updateBlockProperty(index, 'content', e.target.value);
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    onKeyDown={(e) => handleBlockKeyDown(e, index, 'quote', block.content)}
                                    onFocus={(e) => {
                                      if (isOccupiedByOther) return;
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                      setActiveBlockIndex(index);
                                      handleBlockFocus(block.id);
                                    }}
                                    onBlur={handleBlockBlur}
                                    rows={2}
                                    placeholder="Paste a striking quote here..."
                                    className={`w-full text-slate-600 dark:text-slate-400 bg-transparent border-none p-0 focus:outline-none focus:ring-0 placeholder-slate-400 dark:placeholder-slate-700 resize-none font-medium leading-relaxed ${isOccupiedByOther ? 'cursor-pointer' : ''} ${block.bold ? 'font-bold' : 'font-normal'} ${block.italic === false ? 'not-italic' : 'italic'} ${block.underline ? 'underline' : ''}`}
                                    style={{ fontSize: `${(14 * editorZoom) / 100}px` }}
                                  />
                                </div>
                              )}

                              {block.type === 'list' && (
                                <div className="flex gap-2 items-start">
                                  <List className="w-4 h-4 text-violet-500 mt-1 select-none flex-shrink-0" />
                                  <textarea
                                    id={`block-input-${block.id}`}
                                    value={block.content}
                                    readOnly={isOccupiedByOther}
                                    title={isOccupiedByOther ? `${remoteFocusedBy.userName} is editing this block. Click to work in a new block below.` : undefined}
                                    onChange={(e) => {
                                      if (isOccupiedByOther) return;
                                      updateBlockProperty(index, 'content', e.target.value);
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    onKeyDown={(e) => handleBlockKeyDown(e, index, 'list', block.content)}
                                    onFocus={(e) => {
                                      if (isOccupiedByOther) return;
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                      setActiveBlockIndex(index);
                                      handleBlockFocus(block.id);
                                    }}
                                    onBlur={handleBlockBlur}
                                    rows={3}
                                    placeholder="Enter items (one item per line)..."
                                    className={`w-full text-slate-700 dark:text-slate-300 bg-transparent border-none p-0 focus:outline-none focus:ring-0 placeholder-slate-300 dark:placeholder-slate-700 resize-none leading-relaxed font-medium ${isOccupiedByOther ? 'cursor-pointer' : ''} ${block.bold ? 'font-bold' : 'font-normal'} ${block.italic ? 'italic' : ''} ${block.underline ? 'underline' : ''}`}
                                    style={{ fontSize: `${(14 * editorZoom) / 100}px` }}
                                  />
                                </div>
                              )}

                              {block.type === 'callout' && (
                                <div className="bg-primary-50/50 border border-primary-100 dark:bg-primary-950/20 dark:border-primary-900/30 p-3 rounded-xl flex gap-2.5 items-center">
                                  <select
                                    value={block.icon || '💡'}
                                    disabled={isOccupiedByOther}
                                    onChange={(e) => updateBlockProperty(index, 'icon', e.target.value)}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 text-sm focus:outline-none cursor-pointer disabled:opacity-60"
                                  >
                                    <option value="💡">💡</option>
                                    <option value="⚠️">⚠️</option>
                                    <option value="ℹ️">ℹ️</option>
                                    <option value="✅">✅</option>
                                  </select>
                                  <input
                                    id={`block-input-${block.id}`}
                                    type="text"
                                    value={block.content}
                                    readOnly={isOccupiedByOther}
                                    onChange={(e) => {
                                      if (isOccupiedByOther) return;
                                      updateBlockProperty(index, 'content', e.target.value);
                                    }}
                                    onKeyDown={(e) => handleBlockKeyDown(e, index, 'callout', block.content)}
                                    onFocus={() => {
                                      if (isOccupiedByOther) return;
                                      setActiveBlockIndex(index);
                                      handleBlockFocus(block.id);
                                    }}
                                    onBlur={handleBlockBlur}
                                    placeholder="Important warning / key tip highlight..."
                                    className={`w-full text-slate-700 dark:text-slate-300 bg-transparent border-none p-0 focus:outline-none focus:ring-0 font-semibold ${isOccupiedByOther ? 'cursor-pointer' : ''} ${block.bold === false ? 'font-normal' : 'font-bold'} ${block.italic ? 'italic' : ''} ${block.underline ? 'underline' : ''}`}
                                    style={{ fontSize: `${(14 * editorZoom) / 100}px` }}
                                  />
                                </div>
                              )}

                              {block.type === 'image' && (
                                <div className="space-y-2">
                                  <input
                                    id={`block-input-${block.id}`}
                                    type="text"
                                    value={block.url}
                                    readOnly={isOccupiedByOther}
                                    onChange={(e) => {
                                      if (isOccupiedByOther) return;
                                      updateBlockProperty(index, 'url', e.target.value);
                                    }}
                                    onFocus={() => {
                                      if (isOccupiedByOther) return;
                                      setActiveBlockIndex(index);
                                      handleBlockFocus(block.id);
                                    }}
                                    onBlur={handleBlockBlur}
                                    placeholder="Paste Image URL link..."
                                    className="w-full text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary-500"
                                  />

                                  {block.url ? (
                                    <div className="rounded-xl overflow-hidden shadow-sm max-w-xs border dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                      <img
                                        src={block.url}
                                        alt={block.caption || 'Preview'}
                                        className="max-h-36 w-full object-cover"
                                        onError={(e) => {
                                          e.target.src = 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?auto=format&fit=crop&q=80&w=400';
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-400 italic">No image link pasted yet.</div>
                                  )}

                                  <input
                                    type="text"
                                    value={block.caption}
                                    readOnly={isOccupiedByOther}
                                    onChange={(e) => {
                                      if (isOccupiedByOther) return;
                                      updateBlockProperty(index, 'caption', e.target.value);
                                    }}
                                    placeholder="Image Caption..."
                                    className="w-full text-xs font-semibold text-slate-400 dark:text-slate-500 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                                  />
                                </div>
                              )}

                              {block.type === 'code' && (
                                <div className="relative rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-800 bg-slate-950 text-slate-200 font-mono shadow-inner" style={{ fontSize: `${(12 * editorZoom) / 100}px` }}>
                                  <div className="flex items-center justify-between px-3.5 py-1 bg-slate-900 border-b border-slate-200/50 dark:border-slate-800">
                                    <select
                                      value={block.language || 'javascript'}
                                      disabled={isOccupiedByOther}
                                      onChange={(e) => updateBlockProperty(index, 'language', e.target.value)}
                                      className="bg-transparent border-none text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                                    >
                                      {['javascript', 'python', 'html', 'css', 'shell', 'json', 'cpp', 'java'].map(lang => (
                                        <option key={lang} value={lang} className="bg-slate-900 text-slate-300">{lang}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <textarea
                                    id={`block-input-${block.id}`}
                                    value={block.content}
                                    readOnly={isOccupiedByOther}
                                    onChange={(e) => {
                                      if (isOccupiedByOther) return;
                                      updateBlockProperty(index, 'content', e.target.value);
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    onFocus={(e) => {
                                      if (isOccupiedByOther) return;
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                      setActiveBlockIndex(index);
                                      handleBlockFocus(block.id);
                                    }}
                                    onBlur={handleBlockBlur}
                                    rows={4}
                                    placeholder="// Paste or write code snippet here..."
                                    className="w-full bg-transparent border-none p-3.5 focus:outline-none focus:ring-0 placeholder-slate-600 resize-none font-mono text-slate-100"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Block Action Buttons on Hover/Focus */}
                            <div className={`flex items-start gap-1 transition-opacity duration-200 select-none flex-shrink-0 ${activeBlockIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}>
                              {/* Formatting Controls for Text Blocks */}
                              {['h1', 'h2', 'p', 'quote', 'list', 'callout'].includes(block.type) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const isBold = block.bold !== undefined ? block.bold : ['h1', 'h2', 'callout'].includes(block.type);
                                      updateBlockProperty(index, 'bold', !isBold);
                                    }}
                                    className={`p-1.5 rounded-lg border transition-colors ${(block.bold !== undefined ? block.bold : ['h1', 'h2', 'callout'].includes(block.type))
                                        ? 'bg-primary-50 border-primary-100 text-primary-600 dark:bg-primary-950/20 dark:border-primary-900/30 dark:text-primary-400 font-bold'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600'
                                      }`}
                                    title="Toggle Bold"
                                  >
                                    <span className="font-bold text-xs">B</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateBlockProperty(index, 'italic', !block.italic)}
                                    className={`p-1.5 rounded-lg border transition-colors ${block.italic
                                        ? 'bg-primary-50 border-primary-100 text-primary-600 dark:bg-primary-950/20 dark:border-primary-900/30 dark:text-primary-400 font-bold'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600'
                                      }`}
                                    title="Toggle Italic"
                                  >
                                    <span className="italic text-xs font-serif font-bold">I</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateBlockProperty(index, 'underline', !block.underline)}
                                    className={`p-1.5 rounded-lg border transition-colors ${block.underline
                                        ? 'bg-primary-50 border-primary-100 text-primary-600 dark:bg-primary-950/20 dark:border-primary-900/30 dark:text-primary-400 font-bold'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600'
                                      }`}
                                    title="Toggle Underline"
                                  >
                                    <span className="underline text-xs font-bold">U</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleVoiceForTarget('block', index)}
                                    className={`p-1.5 rounded-lg border transition-all ${
                                      isListening && voiceTarget === 'block' && activeBlockIndex === index
                                        ? 'bg-rose-500 border-rose-600 text-white shadow-sm animate-pulse'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-500/50'
                                    }`}
                                    title="Speak to dictate into this block"
                                  >
                                    <Mic className="w-3.5 h-3.5" />
                                  </button>
                                  <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1 align-middle self-center"></div>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => insertBlockBelow(index, 'p')}
                                className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-primary-500 rounded-lg text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                title="Add paragraph block below"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicateBlock(index)}
                                className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-primary-500 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                title="Duplicate block"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteBlock(index)}
                                className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-rose-500 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                                title="Delete block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* In-Between Add Block Divider */}
                          <div className="group/divider relative py-1 my-0.5 flex items-center justify-center opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800" />
                            </div>
                            <button
                              type="button"
                              onClick={() => insertBlockBelow(index, 'p')}
                              className="relative z-10 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-500 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-[10px] font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                              title="Insert new block here"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Block</span>
                            </button>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Preview mode visual cards */
            <div className="p-6 border rounded-3xl bg-white border-slate-100 dark:bg-slate-900/60 prose max-w-none dark:prose-invert">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">{title || 'Untitled Article'}</h1>
              {renderBlogPreview(content)}
            </div>
          )}
        </main>

        {/* Sidebar Configuration Parameters */}
        {showRightSidebar && (
          <aside className="w-full lg:w-80 flex flex-col gap-6">
            {/* Metadata configurations */}
            <div className="p-5 border rounded-2xl bg-white border-slate-100 dark:bg-slate-900/60 glass-card">
              <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-4">Post Settings</h3>

              {/* Cover Image Selector */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Article Cover Image</label>
                <input
                  type="text"
                  placeholder="Paste Unsplash or Image URL..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none mb-2"
                />

                {/* Preset cover image samples */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Or Pick a Preset Cover:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400',
                      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=400',
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
                      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400',
                      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=400',
                      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400',
                      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400',
                      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400'
                    ].map((imgUrl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCoverImage(imgUrl)}
                        className={`h-10 rounded-lg overflow-hidden border-2 transition-all ${
                          coverImage === imgUrl ? 'border-primary-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt="Preset cover" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cover image live preview */}
                {coverImage && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img src={coverImage} alt="Cover preview" className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 transition-colors"
                      title="Clear Cover Image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Community selector */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Community Channel</label>
                <select
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer font-semibold"
                >
                  <option value="">Personal Draft (None)</option>
                  {myCommunities.map(c => (
                    <option key={c._id} value={c._id}>{c.name} {c.isMember ? '(Joined)' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Category selector */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer font-semibold"
                >
                  <option value="">Select Category</option>
                  {['Technology', 'Travel', 'Food', 'Education', 'Sports'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Anonymous setting */}
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isAnonymous" className="text-xs font-bold text-slate-400 uppercase cursor-pointer">
                  Publish Anonymously
                </label>
              </div>

              {/* Comments On/Off Toggle Section (Commented Out)
              <div className="mb-4 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${commentsEnabled ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-200/60 text-slate-400 dark:bg-[#0b0d11]'}`}>
                      {commentsEnabled ? <MessageSquare className="w-3.5 h-3.5" /> : <MessageSquareOff className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Allow Comments
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {commentsEnabled ? 'Discussion open' : 'Comments locked'}
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={commentsEnabled}
                      onChange={(e) => setCommentsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
                  {commentsEnabled
                    ? 'Readers and collaborators will be able to comment and reply to this article.'
                    : 'The discussion section will be disabled and locked for readers.'}
                </p>
              </div>
              */}

              {/* Schedule Publish */}
              <div className="mb-4 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isScheduled"
                    checked={isScheduled}
                    onChange={(e) => {
                      setIsScheduled(e.target.checked);
                      if (e.target.checked) {
                        const tomorrow = new Date();
                        tomorrow.setHours(tomorrow.getHours() + 24);
                        const offset = tomorrow.getTimezoneOffset();
                        const localTomorrow = new Date(tomorrow.getTime() - offset * 60 * 1000);
                        setScheduledTime(localTomorrow.toISOString().slice(0, 16));
                      } else {
                        setScheduledTime('');
                      }
                    }}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isScheduled" className="text-xs font-bold text-slate-400 uppercase cursor-pointer select-none">
                    Schedule Publish
                  </label>
                </div>
                
                {isScheduled && (
                  <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                      Publish Time (within 7 days)
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      min={new Date().toISOString().slice(0, 16)}
                      max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-xl bg-white border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                      Your post will be published automatically at the chosen time.
                    </p>
                  </div>
                )}
              </div>

              {/* Tags configurators */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tags</label>
                <input
                  type="text"
                  placeholder="Add tags (press Enter)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full px-3 py-2 text-sm border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none mb-3"
                />
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1">
                      <span>#{tag}</span>
                      <button type="button" onClick={() => handleRemoveTag(tags.indexOf(tag))} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>

                {/* Dynamic Tag Suggestions */}
                {(() => {
                  const dictionary = ['React', 'Node.js', 'Express', 'MongoDB', 'Authentication', 'Security', 'JWT', 'Tailwind', 'CSS', 'JavaScript', 'TypeScript', 'Next.js', 'Vite', 'Docker', 'Git', 'Redux', 'API', 'REST', 'Web3', 'AI', 'Python', 'DevOps'];
                  const textToScan = (title + ' ' + blocks.map(b => b.content || '').join(' ')).toLowerCase();
                  const suggestions = dictionary.filter(tag => {
                    const cleanSuggestion = tag.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (tags.includes(cleanSuggestion)) return false;
                    const regex = new RegExp(`\\b${tag.toLowerCase().replace('.', '\\.')}\\b`, 'i');
                    return regex.test(textToScan);
                  });

                  if (suggestions.length === 0) return null;
                  return (
                    <div className="mt-3">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Suggested Tags:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.slice(0, 5).map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const cleaned = tag.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                              if (cleaned && !tags.includes(cleaned)) {
                                setTags([...tags, cleaned]);
                              }
                            }}
                            className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 hover:dark:bg-amber-500/20 transition-all font-semibold"
                          >
                            +{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* AI Metadata Suggestion */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40">
                <button
                  type="button"
                  onClick={handleAISuggestMetadata}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/15 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiLoading ? 'AI Optimizing...' : 'AI Suggest Settings'}</span>
                </button>

                {suggestedTitle && (
                  <div className="mt-3 p-2.5 rounded-xl bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200/30 text-[10px] leading-relaxed">
                    <span className="font-bold text-primary-600 dark:text-primary-400 block mb-1">Optimized Title Suggestion:</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleTitleChange(suggestedTitle);
                        setSuggestedTitle('');
                      }}
                      className="text-left font-medium text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 block transition-colors"
                      title="Click to apply title"
                    >
                      {suggestedTitle} <span className="text-[8px] font-bold text-primary-500">(Click to apply)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>



            {/* Collaborators setup (Commented Out)
            <div className="p-5 border rounded-2xl bg-white border-slate-100 dark:bg-slate-900/60 glass-card">
              <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Collaborators</span>
              </h3>

              // Existing Collaborators list
              <div className="flex flex-col gap-2.5 mb-4">
                {collaborators.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No editors added yet. Add peers to write together.</p>
                ) : (
                  collaborators.map((collab) => (
                    <div key={collab._id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-primary-500 text-white font-bold text-[9px] flex items-center justify-center">
                          {collab.name.substring(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{collab.name}</span>
                          <span className="block text-[8px] text-slate-400 truncate max-w-[120px]">{collab.email}</span>
                        </div>
                      </div>
                      <button onClick={() => removeCollaborator(collab._id)} className="text-slate-400 hover:text-rose-500 p-1"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))
                )}
              </div>

              // Add Collaborator via email search simulated list
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search authors..."
                  value={searchUserQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="w-full px-3 py-2 pl-8 text-xs border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
                />
                <Search className="absolute w-3.5 h-3.5 text-slate-400 top-2.5 left-2.5" />

                {userSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 border rounded-xl shadow-lg bg-white dark:bg-slate-900 max-h-40 overflow-y-auto z-10 p-1.5 border-slate-200/50 dark:border-slate-800">
                    {userSearchResults.map((usr) => (
                      <div
                        key={usr._id}
                        onClick={() => addCollaborator(usr)}
                        className="p-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{usr.name}</span>
                          <span className="text-[9px] text-slate-400">{usr.email}</span>
                        </div>
                        <Plus className="w-3 h-3 text-primary-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            */}

            {/* Writing Sprint Controls */}
            {editId && (
              <div className="p-5 border rounded-2xl bg-white border-slate-100 dark:bg-slate-900/60 glass-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                    <span>Writing Sprint</span>
                  </h3>
                  {sprintActive && (
                    <button 
                      onClick={handleCancelSprint}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider bg-transparent border-none cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {!sprintActive ? (
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                      Start a collaborative co-writing race. Set a timer and word count goal!
                    </p>
                    
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Goal (Words)</label>
                      <input
                        type="number"
                        value={sprintGoal}
                        onChange={(e) => setSprintGoal(Math.max(10, parseInt(e.target.value) || 100))}
                        className="w-full text-xs px-3 py-1.5 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold bg-transparent text-slate-700 dark:text-slate-300"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Duration</label>
                      <select
                        value={sprintDuration}
                        onChange={(e) => setSprintDuration(parseInt(e.target.value))}
                        className="w-full text-xs px-3 py-1.5 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 focus:outline-none focus:ring-1 focus:ring-primary-500 font-semibold cursor-pointer text-slate-700 dark:text-slate-300"
                      >
                        <option value={5 * 60 * 1000} className="bg-white dark:bg-slate-900">5 Minutes</option>
                        <option value={10 * 60 * 1000} className="bg-white dark:bg-slate-900">10 Minutes</option>
                        <option value={15 * 60 * 1000} className="bg-white dark:bg-slate-900">15 Minutes</option>
                        <option value={20 * 60 * 1000} className="bg-white dark:bg-slate-900">20 Minutes</option>
                        <option value={30 * 60 * 1000} className="bg-white dark:bg-slate-900">30 Minutes</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartSprint}
                      className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary-500/10 cursor-pointer"
                    >
                      Start Sprint
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Time remaining */}
                    <div className="text-center bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                      <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Time Remaining</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white font-mono flex items-center justify-center gap-1.5 mt-0.5 animate-pulse">
                        <Clock className="w-4 h-4 text-amber-500" />
                        {(() => {
                          const m = Math.floor(sprintTimeRemaining / 60000);
                          const s = Math.floor((sprintTimeRemaining % 60000) / 1000);
                          return `${m}:${s < 10 ? '0' : ''}${s}`;
                        })()}
                      </span>
                    </div>

                    {/* Progress bars */}
                    <div className="space-y-3">
                      {/* My progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <span>You</span>
                          <span>{(() => {
                            const text = blocks.map(b => b.content || '').join(' ');
                            return text.trim() ? text.trim().split(/\s+/).length : 0;
                          })()} / {sprintGoal} w</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200/40 dark:border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-305"
                            style={{
                              width: `${Math.min(100, ((() => {
                                const text = blocks.map(b => b.content || '').join(' ');
                                return text.trim() ? text.trim().split(/\s+/).length : 0;
                              })() / sprintGoal) * 100)}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Partners progress */}
                      {activeCollaborators.map((c) => {
                        const wordCount = sprintPartnerProgress[c.userId] || 0;
                        return (
                          <div key={c.userId} className="space-y-1 border-t border-slate-100 dark:border-slate-850 pt-2">
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              <span>{c.userName}</span>
                              <span>{wordCount} / {sprintGoal} w</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200/40 dark:border-white/5">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 transition-all duration-305"
                                style={{ width: `${Math.min(100, (wordCount / sprintGoal) * 105)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Spam Warning Modal */}
      {spamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span>⚠️ Spam Warning Alert</span>
              </h3>
              <button
                type="button"
                onClick={() => setSpamModalOpen(false)}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Our automated content filter analyzed your draft and detected potential concerns:
            </p>

            <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/20 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-rose-600 dark:text-rose-400">
                <span>Spam Score:</span>
                <span>{spamScore} / 100</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${spamScore}%` }} />
              </div>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Issues Detected</span>
              {spamReasons.map((reason) => (
                <div key={reason} className="flex gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-955 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/30">
                  <span className="text-rose-500">•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSpamModalOpen(false)}
                className="px-5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
              >
                Go Back & Edit
              </button>
              <button
                type="button"
                onClick={async () => {
                  setSpamModalOpen(false);
                  setBypassSpamCheck(true);
                  // We bypass in the next save call
                  setTimeout(() => {
                    handleSave('published');
                  }, 100);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/10 transition-all"
              >
                Publish Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Collaboration & LAN Share Modal */}
      {isCollabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col gap-5 animate-scale-in max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Live Co-Authoring Studio
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Write and edit together in real-time across your local network
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCollabModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: LAN / Local Network Share Link */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/5 to-primary-500/5 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-amber-500" />
                  <span>Instant Network Co-Author Link</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Same Wi-Fi Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Anyone connected to your Wi-Fi or local network can open this link to write with you live:
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 truncate select-all">
                  {`${window.location.origin}/editor?edit=${editId}&collab=true`}
                </div>
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Section 2: Search & Add Registered Writers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-primary-500" />
                  <span>Invite Registered User</span>
                </span>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name, @username, or email..."
                  value={searchUserQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {searchingUsers && (
                <p className="text-[11px] text-slate-400 animate-pulse px-1">Searching authors...</p>
              )}

              {userSearchResults.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {userSearchResults.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.profileImage || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username || u.name}`}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">@{u.username || 'user'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddCollaborator(u)}
                        className="px-3 py-1 text-[11px] font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-xs"
                      >
                        + Add Co-Author
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Current Co-Authors and Presence */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Blog Contributors</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {activeCollaborators.length + 1} online in room
                </span>
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {/* Author (Owner) */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentBlog?.author?.profileImage || user?.profileImage || `https://api.dicebear.com/7.x/identicon/svg?seed=owner`}
                      alt="Owner"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {currentBlog?.author?.name || user?.name}
                        {user?._id === (currentBlog?.author?._id || currentBlog?.author) && ' (You)'}
                      </p>
                      <span className="text-[10px] text-amber-500 font-semibold">Author & Owner</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Lead Author
                  </span>
                </div>

                {/* Unified Collaborators List */}
                {(() => {
                  const contributorsMap = new Map();

                  collaborators.forEach(c => {
                    const id = String(c._id || c);
                    contributorsMap.set(id, {
                      id,
                      name: c.name || 'Co-Author',
                      username: c.username || '',
                      profileImage: c.profileImage || '',
                      isOnline: activeCollaborators.some(ac => String(ac.userId) === id)
                    });
                  });

                  activeCollaborators.forEach(ac => {
                    const id = String(ac.userId);
                    const authorId = String(currentBlog?.author?._id || currentBlog?.author || user?._id);
                    if (id && id !== authorId && id !== String(user?._id)) {
                      if (contributorsMap.has(id)) {
                        const item = contributorsMap.get(id);
                        item.isOnline = true;
                        if (!item.name || item.name === 'Co-Author') item.name = ac.userName;
                        if (!item.profileImage) item.profileImage = ac.userAvatar;
                      } else {
                        contributorsMap.set(id, {
                          id,
                          name: ac.userName || 'Live Collaborator',
                          username: '',
                          profileImage: ac.userAvatar || '',
                          isOnline: true
                        });
                      }
                    }
                  });

                  const mergedContributors = Array.from(contributorsMap.values());

                  if (mergedContributors.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 text-center py-3 italic">
                        No other co-authors added yet. Copy the link above or search to invite!
                      </p>
                    );
                  }

                  return mergedContributors.map(c => {
                    const collName = c.name;
                    const isCurrentUser = String(user?._id) === c.id;
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={c.profileImage || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.username || collName}`}
                            alt={collName}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {collName}
                              {isCurrentUser && ' (You)'}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400">Co-Author</span>
                              {c.isOnline && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-500">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active now
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isAuthor && !isCurrentUser && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCollaborator(c.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 transition-all flex items-center gap-1 shadow-xs hover:scale-105"
                            title="Remove collaborator"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCollabModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grammar/Spell Check Modal */}
      {grammarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl flex flex-col gap-4 animate-scale-in max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" />
                <span>Grammar & Spelling Check</span>
              </h3>
              <button
                type="button"
                onClick={() => setGrammarModalOpen(false)}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {grammarErrors.length > 0 ? (
              <>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Found {grammarErrors.length} potential issue(s) in your writing:
                </p>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {grammarErrors.map((error, idx) => (
                    <div key={idx} className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/20 rounded-2xl flex flex-col justify-between md:flex-row md:items-center gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300 capitalize">{error.type}: </span>
                          <span className="line-through text-rose-500 font-medium">"{error.original}"</span>
                          {error.suggestion && (
                            <span className="text-slate-500 dark:text-slate-400">→</span>
                          )}
                          {error.suggestion && (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">"{error.suggestion}"</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                          Context: ...{error.context}...
                        </div>
                      </div>
                      {error.suggestion && (
                        <button
                          type="button"
                          onClick={() => handleApplyCorrection(error)}
                          className="self-end md:self-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold shadow-sm transition-all"
                        >
                          Apply Fix
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-3 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/45 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-6 h-6 animate-bounce" />
                </div>
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Everything is OK!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                  No spelling or grammar mistakes found. Your writing looks absolutely perfect!
                </p>
              </div>
            )}

            {grammarSuggestions.length > 0 && (
              <div className="p-4 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide">AI Suggestions</h4>
                {grammarSuggestions.map((sug) => (
                  <div key={sug} className="text-xs text-slate-600 dark:text-slate-355 leading-relaxed">
                    <span className="text-amber-500 font-bold">→ </span>
                    <span>{sug}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              {grammarErrors.some(e => e.suggestion) && (
                <button
                  type="button"
                  onClick={handleApplyAllCorrections}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  Apply All Fixes
                </button>
              )}
              <button
                type="button"
                onClick={() => setGrammarModalOpen(false)}
                className="px-5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Floating Voice Dictation HUD / Widget */}
      {isListening && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[95%] max-w-lg bg-slate-950/95 dark:bg-[#0c0e14]/95 text-white backdrop-blur-xl border border-rose-500/40 dark:border-rose-500/30 rounded-3xl p-4 shadow-2xl shadow-rose-950/30 animate-fade-in space-y-3">
          {/* Top Bar: Mic indicator, target badge, language selector */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>

              {/* Animated waveform bars */}
              <div className="flex items-center gap-0.5 h-4 select-none">
                <span className="w-1 bg-rose-500 rounded-full animate-bounce [animation-delay:0ms] h-3"></span>
                <span className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:150ms] h-4"></span>
                <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms] h-2"></span>
                <span className="w-1 bg-sky-400 rounded-full animate-bounce [animation-delay:75ms] h-4"></span>
                <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-delay:225ms] h-3"></span>
              </div>

              <span className="text-xs font-black tracking-wide uppercase text-rose-400">
                Listening & Dictating
              </span>
            </div>

            {/* Target indicator tag & Language selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Target: {voiceTarget === 'title' ? 'Article Title' : `Block #${(activeBlockIndex ?? 0) + 1} (${blocks[activeBlockIndex ?? 0]?.type?.toUpperCase() || 'P'})`}
              </span>

              <select
                value={speechLang}
                onChange={(e) => setSpeechLang(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-[11px] font-semibold text-slate-300 rounded-lg px-2 py-0.5 focus:outline-none focus:border-amber-500"
              >
                {SUPPORTED_VOICE_LANGS.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live speech preview */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 min-h-[44px] flex items-center">
            {interimTranscript ? (
              <p className="text-xs font-medium text-amber-300 italic animate-pulse">
                "{interimTranscript}..."
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-slate-500 animate-pulse shrink-0" />
                <span>Speak naturally. Say commands like "comma", "period", or "new paragraph".</span>
              </p>
            )}
          </div>

          {/* Error Message if any */}
          {voiceError && (
            <div className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/50 p-2 rounded-xl">
              {voiceError}
            </div>
          )}

          {/* Quick Action controls */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const idx = activeBlockIndex !== null ? activeBlockIndex : (blocks.length > 0 ? blocks.length - 1 : 0);
                  insertBlockBelow(idx, 'p');
                }}
                className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>+ New Paragraph</span>
              </button>
              <button
                type="button"
                onClick={() => toggleVoiceForTarget(voiceTarget === 'title' ? 'block' : 'title', activeBlockIndex)}
                className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                {voiceTarget === 'title' ? 'Switch to Body' : 'Switch to Title'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">Alt+V</span>
              <button
                type="button"
                onClick={stopVoiceListening}
                className="px-4 py-1.5 text-xs font-extrabold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all flex items-center gap-1.5"
              >
                <MicOff className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 rounded-2xl shadow-xl animate-fade-in">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-amber-500" />}
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
