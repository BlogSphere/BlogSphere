import Blog from '../../models/Blog.js';
import Comment from '../../models/Comment.js';
import User from '../../models/User.js';

const SPAM_PATTERNS = [
  /(?:http|https):\/\/[^\s]+/gi,
  /(?:www\.)[^\s]+/gi,
  /\b(?:buy|cheap|discount|free|offer|deal|promo|coupon)\b/gi,
  /\b(?:click|visit|check)\s+(?:here|link|site)\b/gi,
  /\b(?:make|earn)\s+(?:money|cash|income)\s+(?:online|fast|easy)\b/gi,
  /\b(?:work\s+from\s+home|remote\s+job)\b/gi,
  /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
  /(?:bitcoin|btc|ethereum|eth|crypto|wallet)/gi,
];

const TOXICITY_PATTERNS = [
  /\b(?:hate|stupid|idiot|moron|dumb|trash|garbage|useless|worthless)\b/gi,
  /\b(?:kill|die|death|suicide)\b/gi,
  /\b(?:racist|sexist|homophobic|transphobic|bigot)\b/gi,
  /(?:fuck|shit|damn|hell|asshole|bitch|cunt|dick|pussy)\b/gi,
];

const SELF_HARM_PATTERNS = [
  /\b(?:kill\s+myself|suicide|end\s+it\s+all|want\s+to\s+die)\b/gi,
  /\b(?:cut\s+myself|hurt\s+myself|self\s+harm)\b/gi,
];

class ContentModeration {
  constructor() {
    this.moderationCache = new Map();
    this.userTrustScores = new Map();
  }

  async analyzeContent(content, options = {}) {
    const { type = 'blog', authorId, context = {} } = options;
    
    const cacheKey = `${type}_${Buffer.from(content).toString('base64').slice(0, 50)}`;
    if (this.moderationCache.has(cacheKey)) {
      return this.moderationCache.get(cacheKey);
    }

    const results = {
      spam: await this.detectSpam(content),
      toxicity: await this.detectToxicity(content),
      selfHarm: await this.detectSelfHarm(content),
      quality: await this.assessQuality(content, type),
      aiGenerated: await this.detectAIGenerated(content),
      policyViolations: await this.checkPolicyViolations(content, context)
    };

    const overallScore = this.calculateOverallScore(results);
    const action = this.determineAction(overallScore, results, authorId);

    const report = {
      ...results,
      overallScore,
      action,
      timestamp: new Date(),
      contentHash: this.hashContent(content)
    };

    this.moderationCache.set(cacheKey, report);
    setTimeout(() => this.moderationCache.delete(cacheKey), 60 * 60 * 1000);

    return report;
  }

  async detectSpam(content) {
    let score = 0;
    const matches = [];

    for (const pattern of SPAM_PATTERNS) {
      const found = content.match(pattern);
      if (found) {
        matches.push({ pattern: pattern.source, matches: found.length });
        score += found.length * 5;
      }
    }

    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / Math.max(content.length, 1);
    if (upperCaseRatio > 0.3) {
      score += 15;
      matches.push({ pattern: 'excessive_uppercase', ratio: upperCaseRatio });
    }

    const repeatedChars = content.match(/(.)\1{4,}/g);
    if (repeatedChars) {
      score += repeatedChars.length * 3;
      matches.push({ pattern: 'repeated_characters', count: repeatedChars.length });
    }

    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
    const repetitionRatio = wordCount > 0 ? 1 - (uniqueWords / wordCount) : 0;
    if (repetitionRatio > 0.4) {
      score += 20;
      matches.push({ pattern: 'word_repetition', ratio: repetitionRatio });
    }

    return {
      score: Math.min(score, 100),
      isSpam: score > 30,
      confidence: Math.min(score / 50, 1),
      details: matches
    };
  }

  async detectToxicity(content) {
    let score = 0;
    const matches = [];

    for (const pattern of TOXICITY_PATTERNS) {
      const found = content.match(pattern);
      if (found) {
        matches.push({ pattern: pattern.source, matches: found.length });
        score += found.length * 10;
      }
    }

    const personalAttacks = content.match(/\b(?:you\s+are|your\s+(?:code|work|blog|post))\s+(?:stupid|trash|garbage|wrong|terrible|awful)\b/gi);
    if (personalAttacks) {
      score += personalAttacks.length * 15;
      matches.push({ pattern: 'personal_attack', matches: personalAttacks.length });
    }

    return {
      score: Math.min(score, 100),
      isToxic: score > 25,
      confidence: Math.min(score / 40, 1),
      severity: score > 60 ? 'high' : score > 25 ? 'medium' : 'low',
      details: matches
    };
  }

  async detectSelfHarm(content) {
    let score = 0;
    const matches = [];

    for (const pattern of SELF_HARM_PATTERNS) {
      const found = content.match(pattern);
      if (found) {
        matches.push({ pattern: pattern.source, matches: found.length });
        score += found.length * 25;
      }
    }

    return {
      score: Math.min(score, 100),
      isSelfHarm: score > 0,
      confidence: score > 0 ? 0.9 : 0,
      severity: 'critical',
      details: matches,
      resources: score > 0 ? this.getCrisisResources() : null
    };
  }

  getCrisisResources() {
    return {
      message: 'If you are feeling overwhelmed or having thoughts of self-harm, please reach out for help:',
      resources: [
        { name: '988 Suicide & Crisis Lifeline', contact: '988 (call or text)', region: 'US' },
        { name: 'Crisis Text Line', contact: 'Text HOME to 741741', region: 'US' },
        { name: 'International Association for Suicide Prevention', contact: 'https://www.iasp.info/resources/Crisis_Centres/', region: 'Global' },
        { name: 'Befrienders Worldwide', contact: 'https://www.befrienders.org/', region: 'Global' }
      ]
    };
  }

  async assessQuality(content, type) {
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const paragraphCount = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    let score = 50;

    if (wordCount >= 300) score += 15;
    else if (wordCount >= 150) score += 10;
    else if (wordCount >= 50) score += 5;
    else score -= 20;

    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) score += 10;
    else if (avgSentenceLength > 30) score -= 10;

    if (paragraphCount >= 3) score += 10;
    else if (paragraphCount === 1 && wordCount > 200) score -= 5;

    const hasStructure = /#{1,3}\s/.test(content) || /^\s*[-*]\s/m.test(content) || /^\s*\d+\.\s/m.test(content);
    if (hasStructure) score += 10;

    const codeBlocks = content.match(/```[\s\S]*?```/g);
    if (codeBlocks && codeBlocks.length > 0) score += 10;

    const images = content.match(/!\[.*?\]\(.*?\)/g);
    if (images && images.length > 0) score += 5;

    const links = content.match(/\[.*?\]\(.*?\)/g);
    if (links && links.length > 2) score += 5;

    return {
      score: Math.max(0, Math.min(100, score)),
      wordCount,
      sentenceCount,
      paragraphCount,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      hasStructure,
      codeBlocks: codeBlocks?.length || 0,
      images: images?.length || 0,
      links: links?.length || 0,
      readability: this.getReadabilityLevel(avgSentenceLength, wordCount)
    };
  }

  getReadabilityLevel(avgSentenceLength, wordCount) {
    if (wordCount < 50) return 'too_short';
    if (avgSentenceLength < 8) return 'very_easy';
    if (avgSentenceLength < 12) return 'easy';
    if (avgSentenceLength < 17) return 'standard';
    if (avgSentenceLength < 22) return 'difficult';
    return 'very_difficult';
  }

  async detectAIGenerated(content) {
    const indicators = {
      repetitiveStructure: 0,
      genericPhrases: 0,
      perfectGrammar: 0,
      lackOfPersonalVoice: 0,
      unnaturalTransitions: 0
    };

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 5) {
      const lengths = sentences.map(s => s.trim().length);
      const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / lengths.length;
      
      if (variance < avgLen * 0.1) {
        indicators.repetitiveStructure = 20;
      }
    }

    const genericPatterns = [
      /\b(?:in today's world|in conclusion|furthermore|moreover|additionally|consequently)\b/gi,
      /\b(?:it is important to note|it should be noted|one can observe|it is worth mentioning)\b/gi,
      /\b(?:delve into|embark on a journey|tapestry|landscape|realm)\b/gi
    ];

    for (const pattern of genericPatterns) {
      const matches = content.match(pattern);
      if (matches) indicators.genericPhrases += matches.length * 5;
    }

    const firstPerson = content.match(/\b(?:I|my|me|mine|we|our|us)\b/gi);
    if (!firstPerson || firstPerson.length < 3) {
      indicators.lackOfPersonalVoice = 15;
    }

    const transitionWords = content.match(/\b(?:however|therefore|furthermore|moreover|consequently|nevertheless|thus|hence)\b/gi);
    if (transitionWords && transitionWords.length > sentences.length * 0.3) {
      indicators.unnaturalTransitions = 10;
    }

    const totalScore = Object.values(indicators).reduce((a, b) => a + b, 0);

    return {
      score: Math.min(totalScore, 100),
      isLikelyAI: totalScore > 40,
      confidence: Math.min(totalScore / 60, 1),
      indicators,
      note: 'AI detection is probabilistic and may produce false positives/negatives'
    };
  }

  async checkPolicyViolations(content, context) {
    const violations = [];

    if (context.isComment && content.length < 5) {
      violations.push({ type: 'low_effort', severity: 'low', message: 'Comment is too short' });
    }

    if (context.isBlog && content.length < 100) {
      violations.push({ type: 'thin_content', severity: 'medium', message: 'Blog post is very short' });
    }

    const copyrightPatterns = [
      /©\s*\d{4}/,
      /copyright\s+\d{4}/i,
      /all\s+rights\s+reserved/i
    ];

    for (const pattern of copyrightPatterns) {
      if (pattern.test(content)) {
        violations.push({ type: 'potential_copyright', severity: 'medium', message: 'Contains copyright notice' });
        break;
      }
    }

    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/,
      /\b\d{10}\b/,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
      /\b(?:\d{4}[-\s]?){3}\d{4}\b/
    ];

    for (const pattern of piiPatterns) {
      if (pattern.test(content)) {
        violations.push({ type: 'pii_detected', severity: 'high', message: 'Possible personal information detected' });
        break;
      }
    }

    return violations;
  }

  calculateOverallScore(results) {
    const weights = {
      spam: 0.2,
      toxicity: 0.25,
      selfHarm: 0.3,
      quality: 0.1,
      aiGenerated: 0.1,
      policyViolations: 0.05
    };

    let score = 0;
    score += results.spam.score * weights.spam;
    score += results.toxicity.score * weights.toxicity;
    score += results.selfHarm.score * weights.selfHarm;
    score += (100 - results.quality.score) * weights.quality;
    score += results.aiGenerated.score * weights.aiGenerated;
    score += results.policyViolations.length * 10 * weights.policyViolations;

    return Math.round(Math.min(score, 100));
  }

  determineAction(overallScore, results, authorId) {
    if (results.selfHarm.isSelfHarm) {
      return {
        action: 'flag_crisis',
        priority: 'critical',
        message: 'Content indicates potential self-harm. Immediate review required.',
        autoModerate: false
      };
    }

    if (overallScore >= 80) {
      return {
        action: 'reject',
        priority: 'high',
        message: 'Content violates multiple policies. Automatic rejection.',
        autoModerate: true,
        reasons: this.getRejectionReasons(results)
      };
    }

    if (overallScore >= 50) {
      return {
        action: 'review',
        priority: 'medium',
        message: 'Content requires human review.',
        autoModerate: false,
        reasons: this.getReviewReasons(results)
      };
    }

    if (results.spam.isSpam || results.toxicity.isToxic) {
      return {
        action: 'shadow_moderate',
        priority: 'low',
        message: 'Content flagged for shadow moderation.',
        autoModerate: true
      };
    }

    return {
      action: 'approve',
      priority: 'low',
      message: 'Content approved.',
      autoModerate: true
    };
  }

  getRejectionReasons(results) {
    const reasons = [];
    if (results.spam.isSpam) reasons.push('Spam detected');
    if (results.toxicity.isToxic) reasons.push('Toxic content');
    if (results.policyViolations.length > 0) reasons.push('Policy violations');
    return reasons;
  }

  getReviewReasons(results) {
    const reasons = [];
    if (results.spam.score > 20) reasons.push('Possible spam');
    if (results.toxicity.score > 15) reasons.push('Potentially toxic');
    if (results.quality.score < 40) reasons.push('Low quality');
    if (results.aiGenerated.isLikelyAI) reasons.push('Likely AI-generated');
    if (results.policyViolations.length > 0) reasons.push('Policy concerns');
    return reasons;
  }

  hashContent(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  async getUserTrustScore(userId) {
    if (this.userTrustScores.has(userId)) {
      return this.userTrustScores.get(userId);
    }

    const user = await User.findById(userId).select('stats role createdAt isVerified').lean();
    if (!user) return 50;

    let score = 50;

    if (user.role === 'admin') score = 100;
    else if (user.role === 'author') score += 10;

    if (user.isVerified) score += 15;

    const accountAgeDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.min(accountAgeDays / 30, 20);

    const blogsPublished = user.stats?.blogsPublished || 0;
    score += Math.min(blogsPublished * 2, 15);

    const totalViews = user.stats?.totalViews || 0;
    score += Math.min(totalViews / 10000, 10);

    const flaggedCount = user.stats?.flaggedContent || 0;
    score -= flaggedCount * 10;

    score = Math.max(0, Math.min(100, score));
    this.userTrustScores.set(userId, score);
    setTimeout(() => this.userTrustScores.delete(userId), 30 * 60 * 1000);

    return score;
  }

  async moderateComment(commentId) {
    const comment = await Comment.findById(commentId).lean();
    if (!comment) return null;

    return this.analyzeContent(comment.content, { 
      type: 'comment', 
      authorId: comment.author,
      context: { isComment: true }
    });
  }

  async moderateBlog(blogId) {
    const blog = await Blog.findById(blogId).lean();
    if (!blog) return null;

    const content = typeof blog.content === 'string' ? blog.content : JSON.stringify(blog.content);
    
    return this.analyzeContent(content, { 
      type: 'blog', 
      authorId: blog.author,
      context: { isBlog: true, title: blog.title }
    });
  }

  async batchModerate(contents) {
    return Promise.all(contents.map(({ content, options }) => this.analyzeContent(content, options)));
  }
}

export const contentModeration = new ContentModeration();