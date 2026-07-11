import Community from '../../models/Community.js';
import Blog from '../../models/Blog.js';
import User from '../../models/User.js';

class CommunityMatcher {
  async getCommunityRecommendations(userId, options = {}) {
    const { limit = 10, includePrivate = false } = options;
    
    const user = await User.findById(userId)
      .select('interests subscribedCategories communities followedUsers readingHistory')
      .lean();
    
    if (!user) return [];

    const userCommunityIds = new Set((user.communities || []).map(c => c.toString()));
    const interests = user.interests || [];
    const categories = user.subscribedCategories || [];
    const followedUsers = user.followedUsers || [];

    const query = { 
      _id: { $nin: Array.from(userCommunityIds) }
    };
    
    if (!includePrivate) {
      query.isPrivate = false;
    }

    const candidates = await Community.find(query)
      .limit(100)
      .lean();

    const scored = await Promise.all(candidates.map(async (community) => {
      let score = 0;
      const reasons = [];

      const tagMatches = (community.tags || []).filter(t => interests.includes(t));
      if (tagMatches.length > 0) {
        score += tagMatches.length * 12;
        reasons.push(`Matches your interests: ${tagMatches.slice(0, 3).join(', ')}`);
      }

      if (categories.includes(community.category)) {
        score += 15;
        reasons.push(`Matches your subscribed category: ${community.category}`);
      }

      const memberOverlap = await this.calculateMemberOverlap(community._id, followedUsers);
      if (memberOverlap > 0) {
        score += memberOverlap * 5;
        reasons.push(`${memberOverlap} people you follow are members`);
      }

      const activityScore = this.calculateCommunityActivity(community);
      score += activityScore;
      if (activityScore > 10) reasons.push('Highly active community');

      const contentRelevance = await this.calculateContentRelevance(community._id, interests);
      score += contentRelevance;
      if (contentRelevance > 5) reasons.push('Recent relevant discussions');

      const growthScore = this.calculateGrowthScore(community);
      score += growthScore;

      return {
        community,
        matchScore: Math.round(score),
        reasons: reasons.slice(0, 3)
      };
    }));

    return scored
      .filter(s => s.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  async calculateMemberOverlap(communityId, followedUsers) {
    if (followedUsers.length === 0) return 0;
    
    const community = await Community.findById(communityId).select('members').lean();
    if (!community) return 0;

    const memberIds = new Set((community.members || []).map(m => m.toString()));
    return followedUsers.filter(u => memberIds.has(u.toString())).length;
  }

  calculateCommunityActivity(community) {
    const now = Date.now();
    const lastActivity = community.lastActivity ? new Date(community.lastActivity).getTime() : 0;
    const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);
    
    let score = 0;
    score += Math.log10((community.memberCount || 0) + 1) * 3;
    score += Math.log10((community.postCount || 0) + 1) * 2;
    
    if (daysSinceActivity < 1) score += 15;
    else if (daysSinceActivity < 7) score += 10;
    else if (daysSinceActivity < 30) score += 5;
    
    return Math.round(score);
  }

  async calculateContentRelevance(communityId, interests) {
    if (interests.length === 0) return 0;

    const recentPosts = await Blog.find({
      community: communityId,
      status: 'published',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).select('tags').limit(20).lean();

    if (recentPosts.length === 0) return 0;

    let matches = 0;
    recentPosts.forEach(post => {
      const postTags = post.tags || [];
      const overlap = postTags.filter(t => interests.includes(t)).length;
      matches += overlap;
    });

    return Math.min(matches * 2, 20);
  }

  calculateGrowthScore(community) {
    const memberCount = community.memberCount || 0;
    const postCount = community.postCount || 0;
    const ageDays = community.createdAt ? 
      (Date.now() - new Date(community.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 365;

    if (ageDays < 1) return 10;
    
    const memberGrowthRate = memberCount / ageDays;
    const postGrowthRate = postCount / ageDays;
    
    return Math.min(memberGrowthRate * 2 + postGrowthRate * 3, 20);
  }

  async findPotentialCoAuthors(userId, blogId, limit = 5) {
    const user = await User.findById(userId).select('followedUsers interests').lean();
    const blog = await Blog.findById(blogId).select('author tags category').lean();
    
    if (!user || !blog) return [];

    const followedSet = new Set((user.followedUsers || []).map(f => f.toString()));
    followedSet.add(blog.author.toString());

    const candidates = await User.find({
      _id: { $nin: Array.from(followedSet) },
      role: { $in: ['author', 'admin'] },
      $or: [
        { interests: { $in: blog.tags || [] } },
        { subscribedCategories: blog.category }
      ]
    })
      .select('name username profileImage bio interests stats')
      .limit(20)
      .lean();

    const scored = candidates.map(candidate => {
      let score = 0;
      const interestOverlap = (candidate.interests || []).filter(i => (blog.tags || []).includes(i)).length;
      score += interestOverlap * 10;
      score += (candidate.stats?.blogsPublished || 0) * 2;
      score += (candidate.stats?.totalViews || 0) / 10000;
      return { ...candidate, matchScore: Math.round(score) };
    });

    return scored
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  async suggestCommunitiesForBlog(blogId, limit = 5) {
    const blog = await Blog.findById(blogId).select('tags category author').lean();
    if (!blog) return [];

    const communities = await Community.find({
      _id: { $ne: blog.community },
      isPrivate: false,
      $or: [
        { tags: { $in: blog.tags || [] } },
        { category: blog.category }
      ]
    })
      .select('name slug avatar memberCount postCount category tags')
      .limit(20)
      .lean();

    const scored = communities.map(c => {
      let score = 0;
      const tagOverlap = (c.tags || []).filter(t => (blog.tags || []).includes(t)).length;
      score += tagOverlap * 15;
      if (c.category === blog.category) score += 10;
      score += Math.log10((c.memberCount || 0) + 1) * 3;
      return { ...c, relevanceScore: score };
    });

    return scored
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  async getCommunityInsights(communityId) {
    const community = await Community.findById(communityId).lean();
    if (!community) return null;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const recentPosts = await Blog.find({
      community: communityId,
      status: 'published',
      createdAt: { $gte: thirtyDaysAgo }
    }).select('tags author views likes commentsCount createdAt').lean();

    const topTags = this.extractTopTags(recentPosts);
    const activeAuthors = this.getActiveAuthors(recentPosts);
    const postingPattern = this.analyzePostingPattern(recentPosts);
    const engagementMetrics = this.calculateEngagementMetrics(recentPosts);

    return {
      communityId: community._id,
      name: community.name,
      topTags,
      activeAuthors: activeAuthors.slice(0, 10),
      postingPattern,
      engagementMetrics,
      healthScore: this.calculateHealthScore(community, recentPosts)
    };
  }

  extractTopTags(posts) {
    const tagCounts = {};
    posts.forEach(post => {
      (post.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }

  getActiveAuthors(posts) {
    const authorStats = {};
    posts.forEach(post => {
      const authorId = post.author.toString();
      if (!authorStats[authorId]) {
        authorStats[authorId] = { posts: 0, totalViews: 0, totalLikes: 0, totalComments: 0 };
      }
      authorStats[authorId].posts++;
      authorStats[authorId].totalViews += post.views || 0;
      authorStats[authorId].totalLikes += (post.likes?.length || 0);
      authorStats[authorId].totalComments += post.commentsCount || 0;
    });

    return Object.entries(authorStats)
      .map(([authorId, stats]) => ({
        authorId,
        posts: stats.posts,
        avgViews: Math.round(stats.totalViews / stats.posts),
        avgEngagement: Math.round((stats.totalLikes + stats.totalComments * 2) / stats.posts)
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement);
  }

  analyzePostingPattern(posts) {
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    
    posts.forEach(post => {
      const date = new Date(post.createdAt);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
    });

    const bestHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => h.hour);

    const bestDays = dayCounts
      .map((count, day) => ({ day, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(d => d.day);

    return { bestHours, bestDays, totalPosts: posts.length };
  }

  calculateEngagementMetrics(posts) {
    if (posts.length === 0) return {};
    
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);
    
    return {
      avgViews: Math.round(totalViews / posts.length),
      avgLikes: Math.round(totalLikes / posts.length),
      avgComments: Math.round(totalComments / posts.length),
      engagementRate: posts.length > 0 ? 
        ((totalLikes + totalComments * 2) / totalViews * 100).toFixed(2) : 0
    };
  }

  calculateHealthScore(community, recentPosts) {
    let score = 50;
    
    score += Math.min(Math.log10((community.memberCount || 0) + 1) * 10, 20);
    score += Math.min(recentPosts.length * 2, 20);
    
    const engagement = this.calculateEngagementMetrics(recentPosts);
    if (engagement.engagementRate > 5) score += 10;
    else if (engagement.engagementRate > 2) score += 5;
    
    const uniqueAuthors = new Set(recentPosts.map(p => p.author.toString())).size;
    score += Math.min(uniqueAuthors * 2, 15);
    
    return Math.min(Math.round(score), 100);
  }
}

export const communityMatcher = new CommunityMatcher();