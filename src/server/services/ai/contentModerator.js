import Blog from '../../models/Blog.js';
import Comment from '../../models/Comment.js';
import User from '../../models/User.js';

class ContentModerator {
  constructor() {
    this.spamPatterns = [
      /(?:buy|cheap|discount|free|offer|deal|sale|promo|limited).{0,20}(?:now|today|click|link|visit)/gi,
      /(?:earn|make|money|income|profit).{0,20}(?:online|fast|easy|quick|guaranteed)/gi,
      /(?:click|visit|check).{0,10}(?:here|link|url|site|website)/gi,
      /(?:whatsapp|telegram|skype|discord).{0,10}(?:me|us|group|channel)/gi,
      /(?:http|https):\/\/(?:bit\.ly|tinyurl|t\.co|goo\.gl|short\.link)/gi,
      /\b\d{10,}\b/g,
      /(?:contact|email|phone|call).{0,15}(?:me|us|now)/gi
    ];

    this.toxicityPatterns = [
      /\b(?:hate|stupid|idiot|moron|trash|garbage|worthless|pathetic)\b/gi,
      /\b(?:kill|die|death|suicide|murder)\b/gi,
      /\b(?:fuck|shit|bitch|asshole|bastard|cunt)\b/gi,
      /\b(?:nazi|hitler|terrorist|extremist)\b/gi
    ];

    this.spamKeywords = new Set([
      'casino', 'poker', 'lottery', 'winner', 'congratulations', 'selected',
      'viagra', 'cialis', 'pharmacy', 'prescription', 'weight loss', 'diet pill',
      'bitcoin', 'crypto', 'investment', 'forex', 'trading', 'binary',
      'seo', 'backlink', 'traffic', 'ranking', 'google ranking'
    ]);
  }

  async analyzeContent(content, type = 'blog') {
    const results = {
      isSpam: false,
      spamScore: 0,
      spamReasons: [],
      isToxic: false,
      toxicityScore: 0,
      toxicityReasons: [],
      qualityScore: 100,
      qualityIssues: [],
      recommendations: []
    };

    const text = this.extractText(content);
    
    results.spamScore = this.calculateSpamScore(text);
    results.isSpam = results.spamScore >= 50;
    results.spamReasons = this.getSpamReasons(text, results.spamScore);

    results.toxicityScore = this.calculateToxicityScore(text);
    results.isToxic = results.toxicityScore >= 40;
    results.toxicityReasons = this.getToxicityReasons(text);

    results.qualityScore = this.calculateQualityScore(text, type);
    results.qualityIssues = this.getQualityIssues(text, type);
    results.recommendations = this.getRecommendations(text, results);

    return results;
  }

  extractText(content) {
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed.map(b => b.content || '').join(' ');
        }
      } catch (e) {
        return content.replace(/<[^>]*>/g, ' ');
      }
    }
    return '';
  }

  calculateSpamScore(text) {
    let score = 0;
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    const uniqueWords = new Set(words);

    this.spamPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) score += matches.length * 15;
    });

    this.spamKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) score += 10;
    });

    const linkCount = (text.match(/https?:\/\//g) || []).length;
    score += linkCount * 8;

    const capsWords = words.filter(w => w.length > 3 && w === w.toUpperCase()).length;
    score += capsWords * 3;

    const repetitionPenalty = this.calculateRepetitionPenalty(words);
    score += repetitionPenalty;

    if (uniqueWords.size < 20 && words.length > 50) score += 20;

    return Math.min(score, 100);
  }

  calculateRepetitionPenalty(words) {
    const wordCounts = {};
    words.forEach(w => {
      if (w.length > 4) wordCounts[w] = (wordCounts[w] || 0) + 1;
    });
    
    let penalty = 0;
    Object.values(wordCounts).forEach(count => {
      if (count > 5) penalty += (count - 5) * 2;
    });
    return penalty;
  }

  getSpamReasons(text, score) {
    const reasons = [];
    const lowerText = text.toLowerCase();
    
    this.spamPatterns.forEach((pattern, i) => {
      const matches = text.match(pattern);
      if (matches) {
        const patternNames = [
          'Commercial promotion language',
          'Get-rich-quick scheme',
          'Clickbait link directing',
          'External messaging platform redirect',
          'URL shortener detected',
          'Phone number spam',
          'Contact info solicitation'
        ];
        reasons.push(patternNames[i] || 'Suspicious pattern detected');
      }
    });

    this.spamKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        reasons.push(`Spam keyword: "${keyword}"`);
      }
    });

    const linkCount = (text.match(/https?:\/\//g) || []).length;
    if (linkCount > 3) reasons.push(`Excessive links (${linkCount})`);

    return [...new Set(reasons)].slice(0, 5);
  }

  calculateToxicityScore(text) {
    let score = 0;
    this.toxicityPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) score += matches.length * 15;
    });
    return Math.min(score, 100);
  }

  getToxicityReasons(text) {
    const reasons = [];
    this.toxicityPatterns.forEach((pattern, i) => {
      const matches = text.match(pattern);
      if (matches) {
        const names = ['Hate speech', 'Self-harm/violence', 'Profanity', 'Extremism'];
        reasons.push(names[i] || 'Toxic content');
      }
    });
    return reasons;
  }

  calculateQualityScore(text, type) {
    let score = 100;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20);

    if (words.length < 100) score -= 30;
    else if (words.length < 300) score -= 15;
    else if (words.length < 600) score -= 5;

    if (sentences.length < 3) score -= 20;
    else if (sentences.length < 8) score -= 10;

    if (paragraphs.length < 2) score -= 15;

    const avgSentenceLength = words.length / Math.max(sentences.length, 1);
    if (avgSentenceLength > 30) score -= 10;
    if (avgSentenceLength < 8) score -= 5;

    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const lexicalDiversity = uniqueWords.size / words.length;
    if (lexicalDiversity < 0.3) score -= 15;
    else if (lexicalDiversity < 0.4) score -= 5;

    const structureScore = this.analyzeStructure(text);
    score += structureScore;

    return Math.max(0, Math.min(100, score));
  }

  analyzeStructure(text) {
    let score = 0;
    const hasHeadings = /^#{1,3}\s/.test(text) || /<h[1-3]>/.test(text);
    const hasLists = /^[\s]*[-*•]\s/m.test(text) || /<ul>|<ol>/.test(text);
    const hasCode = /```|`[^`]+`/.test(text);
    const hasQuotes = />\s|<blockquote>/.test(text);
    const hasImages = /!\[.*\]\(.*\)|<img/.test(text);

    if (hasHeadings) score += 10;
    if (hasLists) score += 5;
    if (hasCode) score += 5;
    if (hasQuotes) score += 5;
    if (hasImages) score += 5;

    return score;
  }

  getQualityIssues(text, type) {
    const issues = [];
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

    if (words.length < 100) issues.push('Content too short (aim for 300+ words)');
    if (sentences.length < 3) issues.push('Too few sentences - add more detail');
    
    const avgSentenceLength = words.length / Math.max(sentences.length, 1);
    if (avgSentenceLength > 30) issues.push('Sentences too long - break them up');
    if (avgSentenceLength < 8) issues.push('Sentences too short - combine for flow');

    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    if (uniqueWords.size / words.length < 0.3) issues.push('Low vocabulary diversity');

    if (!/^#{1,3}\s|<h[1-3]>/.test(text)) issues.push('Missing headings - add structure');
    if (!/^[\s]*[-*•]\s/m.test(text) && !/<ul>|<ol>/.test(text)) issues.push('Consider adding bullet points');

    return issues;
  }

  getRecommendations(text, results) {
    const recs = [];
    
    if (results.qualityScore < 60) {
      recs.push({ type: 'expand', message: 'Expand your content with more examples and details' });
    }
    if (results.spamScore > 30) {
      recs.push({ type: 'cleanup', message: 'Remove promotional language and excessive links' });
    }
    if (results.toxicityScore > 20) {
      recs.push({ type: 'tone', message: 'Adjust tone to be more constructive and respectful' });
    }
    if (!/^#{1,3}\s|<h[1-3]>/.test(text)) {
      recs.push({ type: 'structure', message: 'Add headings (H1, H2) to structure your article' });
    }

    return recs;
  }

  async moderateBlog(blogId) {
    const blog = await Blog.findById(blogId).populate('author', 'name username').lean();
    if (!blog) return { error: 'Blog not found' };

    const analysis = await this.analyzeContent(blog.content, 'blog');
    
    return {
      blogId,
      title: blog.title,
      author: blog.author,
      ...analysis,
      status: analysis.isSpam ? 'flagged_spam' : analysis.isToxic ? 'flagged_toxic' : 'clean',
      moderatedAt: new Date()
    };
  }

  async moderateComment(commentId) {
    const comment = await Comment.findById(commentId).populate('author', 'name username').lean();
    if (!comment) return { error: 'Comment not found' };

    const analysis = await this.analyzeContent(comment.content, 'comment');
    
    return {
      commentId,
      content: comment.content,
      author: comment.author,
      ...analysis,
      status: analysis.isSpam ? 'flagged_spam' : analysis.isToxic ? 'flagged_toxic' : 'clean',
      moderatedAt: new Date()
    };
  }

  async bulkModerateBlogs(blogIds) {
    const results = await Promise.all(
      blogIds.map(id => this.moderateBlog(id))
    );
    return results.filter(r => !r.error);
  }

  async getModerationStats() {
    const flaggedBlogs = await Blog.countDocuments({ 
      $or: [
        { 'moderation.isSpam': true },
        { 'moderation.isToxic': true }
      ]
    });
    
    const pendingReview = await Blog.countDocuments({ 'moderation.status': 'pending' });
    
    const recentModerations = await Blog.find({ 
      'moderation.moderatedAt': { $exists: true, $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).select('title moderation author createdAt').populate('author', 'name').lean();

    return {
      flaggedBlogs,
      pendingReview,
      recentModerations: recentModerations.slice(0, 20)
    };
  }
}

export const contentModerator = new ContentModerator();