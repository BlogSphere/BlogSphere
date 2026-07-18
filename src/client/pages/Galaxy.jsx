import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Eye, Clock, X, Sparkles, 
  HelpCircle, RefreshCw, ZoomIn, ZoomOut, Search, Info,
  ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../utils/api.js';
import { m, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useToast } from '../context/ToastContext.jsx';

// Category color mappings
const CATEGORY_COLORS = {
  Technology: { core: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', text: '#60a5fa' },
  Travel: { core: '#14b8a6', glow: 'rgba(20, 184, 166, 0.4)', text: '#2dd4bf' },
  Food: { core: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', text: '#fbbf24' },
  Education: { core: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)', text: '#818cf8' },
  Sports: { core: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', text: '#fb7185' },
  Default: { core: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', text: '#c084fc' }
};

export default function Galaxy() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const canvasRef = useRef(null);
  
  // App states
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState([]);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTutorial, setShowTutorial] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [constellations, setConstellations] = useState([]);
  const [selectedConstellation, setSelectedConstellation] = useState(null);
  const [generatingAIConstellation, setGeneratingAIConstellation] = useState(false);
  const [showConstellationsPanel, setShowConstellationsPanel] = useState(window.innerWidth > 768);

  // Physics simulation data stored in refs to prevent React re-renders on animation frames
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const backgroundStarsRef = useRef([]);
  
  // Pan, rotation, and zoom refs
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const zoomScaleRef = useRef(1.0);
  const cameraRotationRef = useRef({ x: 0.2, y: -0.3 }); // Starts with a nice tilt
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef(null);

  // Check dark mode
  useEffect(() => {
    const checkTheme = () => {
      const dark = document.documentElement.classList.contains('dark');
      setIsDarkMode(dark);
    };
    checkTheme();
    
    // Add observer for class changes on documentElement
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Fetch blogs and constellations data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/blogs'),
      api.get('/api/constellations')
    ])
      .then(([blogsRes, constsRes]) => {
        const blogsData = blogsRes.data.blogs || [];
        setBlogs(blogsData);
        initializeGraph(blogsData);
        setConstellations(constsRes.data.constellations || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load data for Galaxy View:', err);
        setLoading(false);
      });
  }, []);

  // Initialize nodes and links in 3D
  const initializeGraph = (blogsList) => {
    const nodes = [];
    const links = [];
    const seenTags = new Set();
    const categoriesList = ['Technology', 'Travel', 'Food', 'Education', 'Sports'];

    // 1. Create Category Hub Nodes in 3D (Placed in a ring on the X-Z plane)
    categoriesList.forEach((cat, index) => {
      const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Default;
      const angle = (index / categoriesList.length) * Math.PI * 2;
      const radius = 320;
      
      nodes.push({
        id: `cat-${cat}`,
        type: 'category',
        label: cat,
        coreColor: colors.core,
        glowColor: colors.glow,
        textColor: colors.text,
        radius: 26,
        x: Math.cos(angle) * radius,
        y: (Math.random() - 0.5) * 60, // slight height displacement
        z: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        vz: 0,
        fixed: true // Keep the category cores mostly anchored
      });
    });

    // 2. Create Blog Nodes and connect them to their category hub in 3D
    blogsList.forEach((blog) => {
      const cat = blog.category || 'Default';
      const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Default;
      const angle = Math.random() * Math.PI * 2;
      const pitch = (Math.random() - 0.5) * Math.PI;
      const dist = 90 + Math.random() * 80;
      
      // Calculate starting position near their category core
      const parentCatNode = nodes.find(n => n.id === `cat-${cat}`);
      const parentX = parentCatNode ? parentCatNode.x : 0;
      const parentY = parentCatNode ? parentCatNode.y : 0;
      const parentZ = parentCatNode ? parentCatNode.z : 0;

      const blogNodeId = `blog-${blog._id}`;
      nodes.push({
        id: blogNodeId,
        type: 'blog',
        label: blog.title,
        coreColor: isDarkMode ? '#e2e8f0' : '#1e293b',
        glowColor: colors.glow,
        textColor: isDarkMode ? '#cbd5e1' : '#334155',
        radius: 14,
        x: parentX + Math.cos(angle) * Math.cos(pitch) * dist,
        y: parentY + Math.sin(pitch) * dist,
        z: parentZ + Math.sin(angle) * Math.cos(pitch) * dist,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 2,
        data: blog
      });

      // Link: Blog -> Category Hub
      links.push({
        source: blogNodeId,
        target: `cat-${cat}`,
        length: 100,
        strength: 0.12
      });

      // 3. Process tags
      if (blog.tags && Array.isArray(blog.tags)) {
        blog.tags.slice(0, 2).forEach((tag) => {
          const cleanTag = tag.trim();
          if (!cleanTag) return;

          const tagNodeId = `tag-${cleanTag.toLowerCase()}`;
          
          if (!seenTags.has(tagNodeId)) {
            seenTags.add(tagNodeId);
            const tagAngle = Math.random() * Math.PI * 2;
            const tagPitch = (Math.random() - 0.5) * Math.PI;
            const tagDist = 50 + Math.random() * 30;
            
            nodes.push({
              id: tagNodeId,
              type: 'tag',
              label: `#${cleanTag}`,
              coreColor: '#c084fc',
              glowColor: 'rgba(192, 132, 252, 0.2)',
              textColor: '#e9d5ff',
              radius: 8,
              x: parentX + Math.cos(tagAngle) * Math.cos(tagPitch) * (dist + tagDist),
              y: parentY + Math.sin(tagPitch) * (dist + tagDist),
              z: parentZ + Math.sin(tagAngle) * Math.cos(tagPitch) * (dist + tagDist),
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              vz: (Math.random() - 0.5) * 1.5
            });
          }

          // Link: Tag -> Blog
          links.push({
            source: tagNodeId,
            target: blogNodeId,
            length: 60,
            strength: 0.25
          });
        });
      }
    });

    // Populate Refs
    nodesRef.current = nodes;
    linksRef.current = links;

    // Create 200 background stars in a 3D field
    const backgroundStars = [];
    for (let i = 0; i < 200; i++) {
      backgroundStars.push({
        x: (Math.random() - 0.5) * 5000,
        y: (Math.random() - 0.5) * 5000,
        z: (Math.random() - 0.5) * 5000,
        size: Math.random() * 2.0 + 0.3,
        alpha: Math.random(),
        twinkleSpeed: 0.01 + Math.random() * 0.03
      });
    }
    backgroundStarsRef.current = backgroundStars;
  };

  // Run the physics engine loop in 3D
  useEffect(() => {
    let animationFrameId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 3D Physics constants
    const K_REPULSION = 2600; 
    const K_CENTER_GRAVITY = 0.015; 

    const animationLoop = () => {
      time += 0.05;
      const nodes = nodesRef.current;
      const links = linksRef.current;

      // 1. Calculate 3D Repulsion Forces
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        if (nodeA.fixed) continue;

        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const nodeB = nodes[j];

          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dz = nodeA.z - nodeB.z;
          const distSq = dx * dx + dy * dy + dz * dz + 0.1;
          const dist = Math.sqrt(distSq);

          if (dist < 450) {
            const force = K_REPULSION / distSq;
            nodeA.vx += (dx / dist) * force;
            nodeA.vy += (dy / dist) * force;
            nodeA.vz += (dz / dist) * force;
          }
        }

        // Pull towards center gravity
        nodeA.vx -= nodeA.x * K_CENTER_GRAVITY;
        nodeA.vy -= nodeA.y * K_CENTER_GRAVITY;
        nodeA.vz -= nodeA.z * K_CENTER_GRAVITY;
      }

      // 2. Calculate 3D Attraction Forces
      links.forEach((link) => {
        const nodeA = nodes.find(n => n.id === link.source);
        const nodeB = nodes.find(n => n.id === link.target);

        if (!nodeA || !nodeB) return;

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const dz = nodeB.z - nodeA.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;

        const displacement = dist - link.length;
        const force = displacement * link.strength;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        if (!nodeA.fixed) {
          nodeA.vx += fx;
          nodeA.vy += fy;
          nodeA.vz += fz;
        }
        if (!nodeB.fixed) {
          nodeB.vx -= fx;
          nodeB.vy -= fy;
          nodeB.vz -= fz;
        }
      });

      // 3. Update 3D Positions & Friction
      nodes.forEach((node) => {
        if (node.fixed) {
          // Slow spin of category nodes on the X-Z plane
          if (node.type === 'category') {
            const currentAngle = Math.atan2(node.z, node.x);
            const r = Math.sqrt(node.x * node.x + node.z * node.z);
            const newAngle = currentAngle + 0.0003;
            node.x = Math.cos(newAngle) * r;
            node.z = Math.sin(newAngle) * r;
          }
          return;
        }

        if (draggedNodeRef.current && draggedNodeRef.current.id === node.id) {
          return;
        }

        node.vx *= 0.83;
        node.vy *= 0.83;
        node.vz *= 0.83;

        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy + node.vz * node.vz);
        const maxSpeed = 10;
        if (speed > maxSpeed) {
          node.vx = (node.vx / speed) * maxSpeed;
          node.vy = (node.vy / speed) * maxSpeed;
          node.vz = (node.vz / speed) * maxSpeed;
        }

        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;
      });

      // Camera auto-rotation (Yaw) when idle
      if (!isPanningRef.current && !draggedNodeRef.current) {
        cameraRotationRef.current.y += 0.0006;
      }

      // 4. Render 3D Canvas
      drawCanvas(ctx, canvas.width, canvas.height, time);

      animationFrameId = requestAnimationFrame(animationLoop);
    };

    animationLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isDarkMode, searchQuery]);

  // Main 3D Canvas drawing function
  const drawCanvas = (ctx, width, height, time) => {
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    
    // Background gradient
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height));
    if (isDarkMode) {
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
    } else {
      bgGrad.addColorStop(0, '#f8fafc');
      bgGrad.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 3D to 2D projection logic
    const project3D = (x, y, z) => {
      // Rotation around Y-axis (Yaw)
      const cosY = Math.cos(cameraRotationRef.current.y);
      const sinY = Math.sin(cameraRotationRef.current.y);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      // Rotation around X-axis (Pitch)
      const cosX = Math.cos(cameraRotationRef.current.x);
      const sinX = Math.sin(cameraRotationRef.current.x);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      // Perspective variables
      const D = 900; 
      const fov = 800; 
      const zoomFactor = zoomScaleRef.current;
      const depth = D / zoomFactor - z2;

      if (depth <= 10) return null;

      const scale = fov / depth;
      return {
        x: x1 * scale,
        y: y2 * scale,
        depth: depth,
        scale: scale
      };
    };

    // Draw Floor Grid in 3D (adds excellent spatial awareness)
    ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.035)';
    ctx.lineWidth = 1;
    const gridSpacing = 80;
    const gridLimit = 800;
    const floorY = 150; 
    
    // Draw floor grid lines along X
    for (let x = -gridLimit; x <= gridLimit; x += gridSpacing) {
      ctx.beginPath();
      let first = true;
      for (let z = -gridLimit; z <= gridLimit; z += 40) {
        const pt = project3D(x, floorY, z);
        if (pt) {
          const sx = pt.x + panOffsetRef.current.x + width / 2;
          const sy = pt.y + panOffsetRef.current.y + height / 2;
          if (first) {
            ctx.moveTo(sx, sy);
            first = false;
          } else {
            ctx.lineTo(sx, sy);
          }
        }
      }
      ctx.stroke();
    }
    
    // Draw floor grid lines along Z
    for (let z = -gridLimit; z <= gridLimit; z += gridSpacing) {
      ctx.beginPath();
      let first = true;
      for (let x = -gridLimit; x <= gridLimit; x += 40) {
        const pt = project3D(x, floorY, z);
        if (pt) {
          const sx = pt.x + panOffsetRef.current.x + width / 2;
          const sy = pt.y + panOffsetRef.current.y + height / 2;
          if (first) {
            ctx.moveTo(sx, sy);
            first = false;
          } else {
            ctx.lineTo(sx, sy);
          }
        }
      }
      ctx.stroke();
    }

    // Draw 3D twinkling background stars (with parallax)
    backgroundStarsRef.current.forEach((star) => {
      star.alpha += Math.sin(time * star.twinkleSpeed) * 0.02;
      if (star.alpha < 0.1) star.alpha = 0.1;
      if (star.alpha > 0.9) star.alpha = 0.9;

      const pt = project3D(star.x, star.y, star.z);
      if (!pt) return;

      const sx = pt.x + panOffsetRef.current.x * 0.35 + width / 2;
      const sy = pt.y + panOffsetRef.current.y * 0.35 + height / 2;

      if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = isDarkMode ? '#ffffff' : '#64748b';
        ctx.beginPath();
        const size = star.size * Math.max(0.1, pt.scale * 0.5);
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1.0;

    const nodes = nodesRef.current;
    const links = linksRef.current;
    const query = searchQuery.toLowerCase().trim();
    const isSearchActive = query.length > 0;

    const doesNodeMatchSearch = (node) => {
      if (selectedConstellation) {
        if (node.type === 'category') return true;
        if (node.type === 'blog') {
          return selectedConstellation.blogs.some(b => `blog-${b._id}` === node.id);
        }
        return false;
      }
      if (!isSearchActive) return true;
      if (node.label.toLowerCase().includes(query)) return true;
      if (node.type === 'blog' && node.data?.category?.toLowerCase().includes(query)) return true;
      return false;
    };

    // Projected coordinates calculation
    nodes.forEach((node) => {
      const pt = project3D(node.x, node.y, node.z);
      if (pt) {
        node.screenX = pt.x + width / 2;
        node.screenY = pt.y + height / 2;
        node.projectedDepth = pt.depth;
        node.projectedScale = pt.scale;
        node.onScreen = true;
      } else {
        node.onScreen = false;
      }
    });

    // 1. Draw Links (Sorted by depth)
    links.forEach((link) => {
      const srcNode = nodes.find(n => n.id === link.source);
      const tgtNode = nodes.find(n => n.id === link.target);
      if (srcNode && tgtNode && srcNode.onScreen && tgtNode.onScreen) {
        link.projectedDepth = (srcNode.projectedDepth + tgtNode.projectedDepth) / 2;
        link.onScreen = true;
      } else {
        link.onScreen = false;
      }
    });

    const sortedLinks = [...links].filter(l => l.onScreen).sort((a, b) => b.projectedDepth - a.projectedDepth);
    ctx.lineWidth = 1.2;

    sortedLinks.forEach((link) => {
      const srcNode = nodes.find(n => n.id === link.source);
      const tgtNode = nodes.find(n => n.id === link.target);
      if (!srcNode || !tgtNode) return;

      const sourceMatch = doesNodeMatchSearch(srcNode);
      const targetMatch = doesNodeMatchSearch(tgtNode);

      // Depth transparency
      const depthAlpha = Math.max(0.04, Math.min(1.0, 300 / link.projectedDepth));

      if (isDarkMode) {
        ctx.strokeStyle = (sourceMatch && targetMatch)
          ? `rgba(139, 92, 246, ${0.35 * depthAlpha})`
          : `rgba(255, 255, 255, ${0.035 * depthAlpha})`;
      } else {
        ctx.strokeStyle = (sourceMatch && targetMatch)
          ? `rgba(99, 102, 241, ${0.45 * depthAlpha})`
          : `rgba(0, 0, 0, ${0.05 * depthAlpha})`;
      }

      ctx.beginPath();
      ctx.moveTo(srcNode.screenX + panOffsetRef.current.x, srcNode.screenY + panOffsetRef.current.y);
      ctx.lineTo(tgtNode.screenX + panOffsetRef.current.x, tgtNode.screenY + panOffsetRef.current.y);
      ctx.stroke();

      // Transmission energy pulse
      if (sourceMatch && targetMatch && Math.random() < 0.005) {
        link.pulseProgress = 0;
      }
      
      if (link.pulseProgress !== undefined) {
        link.pulseProgress += 0.008;
        if (link.pulseProgress > 1.0) {
          delete link.pulseProgress;
        } else {
          const sx = srcNode.screenX + (tgtNode.screenX - srcNode.screenX) * link.pulseProgress + panOffsetRef.current.x;
          const sy = srcNode.screenY + (tgtNode.screenY - srcNode.screenY) * link.pulseProgress + panOffsetRef.current.y;
          ctx.beginPath();
          const scaleFactor = (srcNode.projectedScale + tgtNode.projectedScale) / 2;
          ctx.arc(sx, sy, 2.5 * scaleFactor, 0, Math.PI * 2);
          ctx.fillStyle = isDarkMode ? '#a78bfa' : '#6366f1';
          ctx.shadowBlur = 10 * scaleFactor;
          ctx.shadowColor = isDarkMode ? '#8b5cf6' : '#4f46e5';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    });

    // 1.5. Draw Constellations Paths (emerald curve dashed trails)
    if (selectedConstellation && selectedConstellation.blogs) {
      ctx.save();
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#10b981';
      ctx.strokeStyle = '#10b981';
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -(time * 10) % 16;

      for (let i = 0; i < selectedConstellation.blogs.length - 1; i++) {
        const blogAId = `blog-${selectedConstellation.blogs[i]._id}`;
        const blogBId = `blog-${selectedConstellation.blogs[i+1]._id}`;
        const nodeA = nodes.find(n => n.id === blogAId);
        const nodeB = nodes.find(n => n.id === blogBId);
        if (nodeA && nodeB && nodeA.onScreen && nodeB.onScreen) {
          ctx.beginPath();
          ctx.moveTo(nodeA.screenX + panOffsetRef.current.x, nodeA.screenY + panOffsetRef.current.y);
          ctx.lineTo(nodeB.screenX + panOffsetRef.current.x, nodeB.screenY + panOffsetRef.current.y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 2. Draw Nodes (Depth sorted, furthest drawn first)
    const sortedNodes = [...nodes].filter(n => n.onScreen).sort((a, b) => b.projectedDepth - a.projectedDepth);
    
    sortedNodes.forEach((node) => {
      const matchesSearch = doesNodeMatchSearch(node);
      const isSelected = selectedNode && selectedNode.id === node.id;
      
      let opacity = 1.0;
      let nodeScale = 1.0;

      if (isSearchActive) {
        if (!matchesSearch) {
          opacity = 0.22;
          nodeScale = 0.8;
        } else {
          opacity = 1.0;
          nodeScale = 1.2;
        }
      }

      const scaleFactor = node.projectedScale;
      const sizeScale = nodeScale * scaleFactor;
      ctx.globalAlpha = opacity;

      // Glow effect (dark mode)
      if (isDarkMode && (node.type === 'category' || isSelected)) {
        ctx.shadowBlur = (isSelected ? 20 : 12) * scaleFactor;
        ctx.shadowColor = node.glowColor || 'rgba(255,255,255,0.2)';
      } else {
        ctx.shadowBlur = 0;
      }

      // Draw Orbit Rings for Category nodes
      if (node.type === 'category') {
        ctx.strokeStyle = node.glowColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.screenX + panOffsetRef.current.x, node.screenY + panOffsetRef.current.y, 80 * scaleFactor, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw core circle
      ctx.beginPath();
      const radius = node.radius * sizeScale;
      const screenX = node.screenX + panOffsetRef.current.x;
      const screenY = node.screenY + panOffsetRef.current.y;
      ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      ctx.fillStyle = node.coreColor;
      ctx.fill();

      // Border outline
      ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = (isSelected ? 2.5 : 1.3) * scaleFactor;
      if (isSelected || (node.type === 'category')) {
        ctx.stroke();
      }

      ctx.shadowBlur = 0; // Reset shadow

      // Draw labels with perspective size scaling
      const shouldShowLabel = 
        node.type === 'category' || 
        scaleFactor > 0.6 || 
        isSelected ||
        (isSearchActive && matchesSearch);

      if (shouldShowLabel) {
        const fontSize = Math.max(7.5, Math.min(14, (node.type === 'category' ? 12 : node.type === 'blog' ? 10 : 9) * scaleFactor));
        ctx.font = node.type === 'category' 
          ? `bold ${fontSize}px "Outfit", sans-serif`
          : node.type === 'blog'
            ? `600 ${fontSize}px "Inter", sans-serif`
            : `500 ${fontSize}px "Inter", sans-serif`;

        ctx.fillStyle = isDarkMode ? node.textColor : '#1e293b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const textY = screenY + radius + 4 * scaleFactor;
        
        if (node.type === 'blog' && node.label.length > 25) {
          const lines = [];
          const words = node.label.split(' ');
          let currentLine = '';

          words.forEach((word) => {
            if ((currentLine + ' ' + word).length > 20) {
              lines.push(currentLine.trim());
              currentLine = word;
            } else {
              currentLine += ' ' + word;
            }
          });
          lines.push(currentLine.trim());

          lines.slice(0, 2).forEach((line, index) => {
            ctx.fillText(line, screenX, textY + index * (fontSize + 2));
          });
        } else {
          ctx.fillText(node.label, screenX, textY);
        }
      }
    });

    ctx.globalAlpha = 1.0;
    ctx.restore();
  };

  // Drag, Panning, and Rotation mouse event handlers
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicked a node in projected 3D space
    let clickedNode = null;
    const nodes = nodesRef.current;
    
    // Sort nodes by projected depth (closest to screen first) for precise clicks
    const sortedNodes = [...nodes].filter(n => n.onScreen).sort((a, b) => a.projectedDepth - b.projectedDepth);
    
    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      const sx = node.screenX + panOffsetRef.current.x;
      const sy = node.screenY + panOffsetRef.current.y;
      
      const dx = sx - mouseX;
      const dy = sy - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= node.radius * node.projectedScale) {
        clickedNode = node;
        break;
      }
    }

    if (clickedNode) {
      setSelectedNode(clickedNode);
      if (clickedNode.type === 'blog') {
        setSelectedBlog(clickedNode.data);
        setAiSummary(clickedNode.data.summary || '');
        setKeyPoints([]);
      } else {
        setSelectedBlog(null);
      }
      
      if (!clickedNode.fixed) {
        draggedNodeRef.current = clickedNode;
      }
    } else {
      isPanningRef.current = true;
      startPanRef.current = { 
        x: mouseX, 
        y: mouseY,
        rotX: cameraRotationRef.current.x,
        rotY: cameraRotationRef.current.y,
        panX: panOffsetRef.current.x,
        panY: panOffsetRef.current.y
      };
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggedNodeRef.current) {
      // Rotate mouse movement vector back to 3D space
      const dx = (mouseX - startPanRef.current.x) / (zoomScaleRef.current * 8);
      const dy = (mouseY - startPanRef.current.y) / (zoomScaleRef.current * 8);
      
      const cosY = Math.cos(-cameraRotationRef.current.y);
      const sinY = Math.sin(-cameraRotationRef.current.y);
      const cosX = Math.cos(-cameraRotationRef.current.x);
      const sinX = Math.sin(-cameraRotationRef.current.x);

      const rx = dx * cosY;
      const ry = dy * cosX;
      const rz = dx * sinY;

      draggedNodeRef.current.x += rx;
      draggedNodeRef.current.y += ry;
      draggedNodeRef.current.z += rz;
      
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      draggedNodeRef.current.vz = 0;

      startPanRef.current = { x: mouseX, y: mouseY };
    } else if (isPanningRef.current) {
      const dx = mouseX - startPanRef.current.x;
      const dy = mouseY - startPanRef.current.y;

      if (e.shiftKey) {
        // Translation Panning
        panOffsetRef.current = {
          x: startPanRef.current.panX + dx,
          y: startPanRef.current.panY + dy
        };
      } else {
        // 3D Camera Rotation (Yaw/Pitch)
        cameraRotationRef.current = {
          x: Math.max(-Math.PI / 3, Math.min(Math.PI / 3, startPanRef.current.rotX + dy * 0.005)), // limit pitch
          y: startPanRef.current.rotY + dx * 0.005
        };
      }
    }
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    isPanningRef.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    const delta = e.deltaY < 0 ? 1 : -1;
    let newScale = zoomScaleRef.current + delta * zoomIntensity;
    
    // Clamp zoom scale between 0.3 and 3.0
    newScale = Math.max(0.3, Math.min(3.0, newScale));
    zoomScaleRef.current = newScale;
  };

  // Zoom control triggers
  const zoomIn = () => {
    zoomScaleRef.current = Math.min(3.0, zoomScaleRef.current + 0.15);
  };

  const zoomOut = () => {
    zoomScaleRef.current = Math.max(0.3, zoomScaleRef.current - 0.15);
  };

  const resetView = () => {
    panOffsetRef.current = { x: 0, y: 0 };
    zoomScaleRef.current = 1.0;
    cameraRotationRef.current = { x: 0.2, y: -0.3 };
    setSelectedNode(null);
    setSelectedBlog(null);
    setSearchQuery('');
  };

  // AI Summary generator trigger
  const handleGenerateSummary = async () => {
    if (!selectedBlog) return;
    if (selectedBlog.summary && selectedBlog.summary !== '.') {
      setAiSummary(selectedBlog.summary);
      return;
    }

    setGeneratingSummary(true);
    try {
      const res = await api.post(`/api/blogs/${selectedBlog._id}/summary`);
      setAiSummary(res.data.summary);
      setKeyPoints(res.data.keyPoints || []);
      
      // Update local nodes reference data as well
      const updatedNodes = nodesRef.current.map(node => {
        if (node.id === `blog-${selectedBlog._id}`) {
          return {
            ...node,
            data: {
              ...node.data,
              summary: res.data.summary,
              keyPoints: res.data.keyPoints
            }
          };
        }
        return node;
      });
      nodesRef.current = updatedNodes;
      setGeneratingSummary(false);
    } catch (e) {
      console.error(e);
      setAiSummary('Failed to retrieve AI summary analysis.');
      setGeneratingSummary(false);
    }
  };

  // AI Constellation generator trigger
  const handleGenerateAIConstellation = async () => {
    setGeneratingAIConstellation(true);
    try {
      const res = await api.post('/api/constellations/generate', {});
      const newConst = res.data.constellation;
      setConstellations(prev => [newConst, ...prev]);
      setSelectedConstellation(newConst);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (err) {
      console.error('Failed to generate AI Constellation:', err);
      showToast(err.response?.data?.error || 'Failed to curate path. Make sure you have enough published blogs.', 'error');
    } finally {
      setGeneratingAIConstellation(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white select-none">
      
      {/* Help Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <m.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-955/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <m.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-slate-800 dark:text-slate-100 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowTutorial(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                 <span className="inline-flex p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-4 text-3xl animate-bounce">
                  🌌
                </span>
                <h3 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-indigo-400">
                  Welcome to BlogSphere Galaxy!
                </h3>
                <p className="mt-3 text-sm text-slate-550 dark:text-slate-400 leading-relaxed font-medium">
                  We have mapped all category channels, articles, and tag clusters as connected stellar entities. Dive in to explore in a brand-new cosmic visual system!
                </p>
              </div>

              <div className="mt-6 space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <div className="flex gap-3 items-center">
                  <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-955/50 text-[10px] text-indigo-500 font-bold">1</span>
                  <span><strong>Drag nodes</strong> around to flex gravity spring forces.</span>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-955/50 text-[10px] text-indigo-500 font-bold">2</span>
                  <span><strong>Zoom & Rotate</strong> by scroll wheel, or dragging to rotate in 3D. Hold <strong>Shift</strong> while dragging to pan.</span>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-955/50 text-[10px] text-indigo-500 font-bold">3</span>
                  <span><strong>Click Star Nodes</strong> to fetch preview details, stats, and live AI summaries.</span>
                </div>
              </div>

              <button
                onClick={() => setShowTutorial(false)}
                className="mt-8 w-full py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.01]"
              >
                Launch Exploration
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Floating Canvas UI Container */}
      <div className="absolute inset-0 z-0">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
        />
      </div>

      {/* Interactive Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
        {/* Return Button */}
        <Link 
          to="/" 
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-slate-550 dark:text-slate-400" />
          <span>Leave Galaxy</span>
        </Link>

        {/* Search Star Node Bar */}
        <div className="relative max-w-xs sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags, topics, categories..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-850 dark:text-white placeholder-slate-450 dark:placeholder-slate-400"
          />
          <Search className="absolute w-4 h-4 text-slate-450 dark:text-slate-400 left-3.5 top-3" />
        </div>

        {/* Constellations Card */}
        <div className="w-72 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-lg flex flex-col gap-3">
          <div 
            onClick={() => setShowConstellationsPanel(!showConstellationsPanel)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Blog Constellations</span>
            </h3>
            <div className="flex items-center gap-2">
              {selectedConstellation && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConstellation(null);
                  }}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Clear
                </button>
              )}
              {showConstellationsPanel ? (
                <ChevronUp className="w-4 h-4 text-slate-455 dark:text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-455 dark:text-slate-400" />
              )}
            </div>
          </div>
          
          {showConstellationsPanel && (
            <>
              <div className="overflow-y-auto pr-1 flex-1 space-y-2 max-h-[220px]">
                {constellations.length === 0 ? (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-4">No active paths found.</p>
                ) : (
                  constellations.map((c) => {
                    const isCurSelected = selectedConstellation && selectedConstellation._id === c._id;
                    return (
                      <button
                        key={c._id}
                        onClick={() => setSelectedConstellation(isCurSelected ? null : c)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 ${
                          isCurSelected
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-650 dark:text-emerald-300 shadow-sm'
                            : 'bg-slate-50/50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-350'
                        }`}
                      >
                        <span className="text-xs font-bold leading-tight">{c.name}</span>
                        <span className="text-[10px] opacity-80 leading-normal line-clamp-2">{c.description}</span>
                        <span className="text-[8px] opacity-60 uppercase font-semibold mt-1">
                          {c.blogs?.length || 0} Star Nodes {c.isAIGenerated && '• AI Curated'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              
              <button
                onClick={handleGenerateAIConstellation}
                disabled={generatingAIConstellation}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                <span>{generatingAIConstellation ? 'Configuring Theme...' : 'Curate AI Learning Path'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Interactive Utility Controls (Zoom/Pan/Info) */}
      <div className="absolute bottom-6 left-4 z-10 flex items-center gap-2 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 p-1.5 rounded-2xl shadow-lg">
        <button onClick={zoomIn} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={zoomOut} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={resetView} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all" title="Reset Viewport">
          <RefreshCw className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1" />
        <button onClick={() => setShowTutorial(true)} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all" title="Show Tutorial">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Glassmorphic Side Drawer for selected nodes */}
      <AnimatePresence>
        {selectedBlog && (
          <m.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-full sm:w-[420px] bg-white/95 dark:bg-slate-950/80 border-l border-slate-200 dark:border-white/10 backdrop-blur-xl z-20 shadow-2xl flex flex-col text-slate-800 dark:text-slate-100"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full">
                {selectedBlog.category || 'Article'}
              </span>
              <button 
                onClick={() => {
                  setSelectedBlog(null);
                  setSelectedNode(null);
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Cover Image */}
              {selectedBlog.coverImage && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-950 shadow-inner">
                  <img
                    src={(() => {
                      const src = selectedBlog.coverImage || '';
                      const md = src.match(/!\[.*?\]\((.*?)\)/);
                      return (md ? md[1] : src.trim()) || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800';
                    })()}
                    alt={selectedBlog.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title & Author */}
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white">
                  {selectedBlog.title}
                </h2>
                {selectedBlog.author && (
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedBlog.author.profileImage || 'https://api.dicebear.com/7.x/adventurer/svg'}
                      alt={selectedBlog.author.name}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-white/10"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-350">
                      By <strong className="text-slate-800 dark:text-slate-100">{selectedBlog.author.name}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Stats Toolbar */}
              <div className="grid grid-cols-3 gap-2 border-y border-slate-200 dark:border-white/5 py-4 text-center">
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-white/5">
                  <Eye className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mb-1" />
                  <span className="text-xs font-extrabold text-slate-850 dark:text-white">{selectedBlog.views || 0}</span>
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Views</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-white/5">
                  <Heart className="w-4 h-4 text-rose-500 dark:text-rose-400 mb-1" />
                  <span className="text-xs font-extrabold text-slate-850 dark:text-white">{selectedBlog.likes?.length || 0}</span>
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Likes</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-white/5">
                  <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 mb-1" />
                  <span className="text-xs font-extrabold text-slate-850 dark:text-white">{selectedBlog.readingTime || '3'} min</span>
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Read Time</span>
                </div>
              </div>

              {/* Tag Badges list */}
              {selectedBlog.tags && selectedBlog.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-455 tracking-wider">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBlog.tags.map((tg) => (
                      <span key={tg} className="text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-purple-650 dark:text-purple-355 border border-slate-200 dark:border-white/5 px-2.5 py-1 rounded-full">
                        #{tg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Smart Summary Generator */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-455 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span>AI Smart Summary</span>
                  </h4>
                  {!aiSummary && (
                    <button
                      onClick={handleGenerateSummary}
                      disabled={generatingSummary}
                      className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors uppercase tracking-wider flex items-center gap-1"
                    >
                      {generatingSummary ? 'Scanning...' : 'Scan Star →'}
                    </button>
                  )}
                </div>

                {generatingSummary ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 animate-pulse text-xs text-slate-500 dark:text-slate-450 text-center font-medium">
                    Analysing textual telemetry...
                  </div>
                ) : aiSummary ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-3 font-medium">
                    <p>{aiSummary}</p>
                    {keyPoints && keyPoints.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-200 dark:border-white/5 space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-455 block tracking-wider">Key Takeaways</span>
                        <ul className="space-y-1">
                          {keyPoints.map((pt) => (
                            <li key={pt} className="flex gap-2 items-start text-slate-600 dark:text-slate-355">
                              <span className="text-indigo-500 dark:text-indigo-400 text-base leading-3 font-extrabold">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-455 font-medium">
                    Click "Scan Star" to generate a quick AI summary briefing.
                  </div>
                )}
              </div>
            </div>

            {/* Read CTA Link */}
            <div className="p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20">
              <Link
                to={`/blog/${selectedBlog.slug}`}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold block text-center shadow-lg shadow-primary-500/10 hover:scale-[1.01] transition-all"
              >
                Read Full Article
              </Link>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Floating loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-100/90 dark:bg-slate-955/80 z-40 flex items-center justify-center flex-col gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-350 tracking-wider">Mapping Celestial Blog Constellations...</span>
        </div>
      )}
    </div>
  );
}
