import Notification from '../../models/Notification.js';
import User from '../../models/User.js';
import Blog from '../../models/Blog.js';

class SmartNotificationEngine {
  constructor() {
    this.priorityWeights = {
      urgent: 100,
      high: 75,
      medium: 50,
      low: 25,
      digest: 10
    };

    this.notificationTypes = {
      new_follower: { basePriority: 'high', cooldown: 0 },
      new_comment: { basePriority: 'high', cooldown: 5 * 60 * 1000 },
      new_reaction: { basePriority: 'medium', cooldown: 10 * 60 * 1000 },
      mention: { basePriority: 'high', cooldown: 0 },
      blog_published: { basePriority: 'medium', cooldown: 30 * 60 * 1000 },
      trending_alert: { basePriority: 'high', cooldown: 60 * 60 * 1000 },
      weekly_digest: { basePriority: 'digest', cooldown: 7 * 24 * 60 * 60 * 1000 },
      community_invite: { basePriority: 'medium', cooldown: 0 },
      collaboration_invite: { basePriority: 'high', cooldown: 0 },
      ai_suggestion: { basePriority: 'low', cooldown: 60 * 60 * 1000 },
      milestone: { basePriority: 'high', cooldown: 0 }
    };

    this.userPreferences = new Map();
    this.scheduledNotifications = new Map();
  }

  async sendSmartNotification(userId, type, data, options = {}) {
    const user = await User.findById(userId).select('notificationPreferences timezone activeHours engagementScore favoriteAuthors').lean();
    if (!user) return null;

    const prefs = this.getUserPreferences(user);
    if (!this.shouldNotify(prefs, type)) return null;

    const priority = this.calculatePriority(type, data, user, options);
    const timing = this.calculateOptimalTiming(user, priority);

    const notification = await this.createNotification(userId, type, data, priority, timing);

    if (timing.sendNow) {
      await this.deliverNotification(notification);
    } else {
      this.scheduleNotification(notification);
    }

    return notification;
  }

  getUserPreferences(user) {
    const cacheKey = user._id.toString();
    if (this.userPreferences.has(cacheKey)) {
      return this.userPreferences.get(cacheKey);
    }

    const prefs = {
      email: user.notificationPreferences?.email ?? true,
      push: user.notificationPreferences?.push ?? true,
      inApp: user.notificationPreferences?.inApp ?? true,
      digest: user.notificationPreferences?.digest ?? 'weekly',
      quietHours: user.notificationPreferences?.quietHours ?? { start: 22, end: 8 },
      categories: user.notificationPreferences?.categories ?? {}
    };

    this.userPreferences.set(cacheKey, prefs);
    return prefs;
  }

  shouldNotify(prefs, type) {
    const categorySettings = prefs.categories[type];
    if (categorySettings === false) return false;
    if (categorySettings === 'digest') return false;
    return true;
  }

  calculatePriority(type, data, user, options) {
    const typeConfig = this.notificationTypes[type] || { basePriority: 'medium' };
    let priority = this.priorityWeights[typeConfig.basePriority] || 50;

    if (options.forcePriority) {
      priority = this.priorityWeights[options.forcePriority] || priority;
    }

    if (data.authorId && data.authorId.toString() === user._id.toString()) {
      priority *= 0.3;
    }

    if (type === 'blog_published' && data.blogId) {
      const isFavoriteAuthor = user.favoriteAuthors?.includes(data.authorId);
      if (isFavoriteAuthor) priority *= 1.5;
    }

    if (type === 'trending_alert' && data.score > 80) {
      priority *= 1.3;
    }

    if (user.engagementScore && user.engagementScore > 80) {
      priority *= 1.2;
    }

    return Math.min(Math.round(priority), 100);
  }

  calculateOptimalTiming(user, priority) {
    const now = new Date();
    const userHour = this.getUserLocalHour(user);
    const quietHours = user.notificationPreferences?.quietHours ?? { start: 22, end: 8 };

    const isQuietHour = quietHours.start > quietHours.end
      ? userHour >= quietHours.start || userHour < quietHours.end
      : userHour >= quietHours.start && userHour < quietHours.end;

    if (priority >= 90) {
      return { sendNow: true, scheduledFor: now };
    }

    if (isQuietHour && priority < 75) {
      const endHour = quietHours.end;
      const tomorrow = new Date(now);
      tomorrow.setHours(endHour, 0, 0, 0);
      if (tomorrow <= now) tomorrow.setDate(tomorrow.getDate() + 1);
      return { sendNow: false, scheduledFor: tomorrow };
    }

    return { sendNow: true, scheduledFor: now };
  }

  getUserLocalHour(user) {
    if (user.timezone) {
      try {
        const now = new Date();
        const utcHour = now.getUTCHours();
        const offset = this.getTimezoneOffset(user.timezone);
        return (utcHour + offset + 24) % 24;
      } catch (e) {
        return new Date().getHours();
      }
    }
    return new Date().getHours();
  }

  getTimezoneOffset(timezone) {
    const offsets = {
      'UTC': 0, 'GMT': 0, 'EST': -5, 'EDT': -4, 'CST': -6, 'CDT': -5,
      'MST': -7, 'MDT': -6, 'PST': -8, 'PDT': -7, 'IST': 5.5,
      'CET': 1, 'CEST': 2, 'JST': 9, 'AEST': 10, 'AEDT': 11
    };
    return offsets[timezone] || 0;
  }

  async createNotification(userId, type, data, priority, timing) {
    const typeConfig = this.notificationTypes[type];
    const message = this.generateMessage(type, data);
    
    const notification = new Notification({
      userId,
      type,
      message,
      priority,
      referenceId: data.blogId || data.commentId || data.communityId || data.userId,
      metadata: {
        ...data,
        scheduledFor: timing.scheduledFor,
        deliverImmediately: timing.sendNow
      },
      status: timing.sendNow ? 'pending' : 'scheduled'
    });

    await notification.save();
    return notification;
  }

  generateMessage(type, data) {
    const messages = {
      new_follower: `${data.followerName} started following you`,
      new_comment: `${data.commenterName} commented on "${data.blogTitle}"`,
      new_reaction: `${data.reactorName} reacted to your blog "${data.blogTitle}"`,
      mention: `${data.mentionerName} mentioned you in a comment`,
      blog_published: `${data.authorName} published "${data.blogTitle}"`,
      trending_alert: `"${data.blogTitle}" is trending with ${data.score} engagement!`,
      weekly_digest: `Your weekly digest: ${data.count} new posts from your network`,
      community_invite: `${data.inviterName} invited you to join "${data.communityName}"`,
      collaboration_invite: `${data.inviterName} wants to collaborate on "${data.blogTitle}"`,
      ai_suggestion: `AI suggestion: ${data.suggestion}`,
      milestone: `Congratulations! You reached ${data.milestone}`
    };

    return messages[type] || 'You have a new notification';
  }

  async deliverNotification(notification) {
    const user = await User.findById(notification.userId).select('notificationPreferences').lean();
    if (!user) return;

    const prefs = user.notificationPreferences || {};
    
    if (prefs.inApp !== false && global.io) {
      global.io.to(`user_${notification.userId}`).emit('notification_received', notification);
    }

    if (prefs.email && notification.priority >= 50) {
      this.sendEmailNotification(notification);
    }

    if (prefs.push && notification.priority >= 60) {
      this.sendPushNotification(notification);
    }

    notification.status = 'delivered';
    notification.deliveredAt = new Date();
    await notification.save();
  }

  sendEmailNotification(notification) {
    console.log(`[Email] Sending to user ${notification.userId}: ${notification.message}`);
  }

  sendPushNotification(notification) {
    console.log(`[Push] Sending to user ${notification.userId}: ${notification.message}`);
  }

  scheduleNotification(notification) {
    const delay = notification.metadata.scheduledFor - Date.now();
    if (delay <= 0) {
      this.deliverNotification(notification);
      return;
    }

    const timeoutId = setTimeout(() => {
      this.deliverNotification(notification);
      this.scheduledNotifications.delete(notification._id.toString());
    }, delay);

    this.scheduledNotifications.set(notification._id.toString(), timeoutId);
  }

  async sendBatchNotifications(notifications) {
    const results = await Promise.all(
      notifications.map(n => this.sendSmartNotification(n.userId, n.type, n.data, n.options))
    );
    return results.filter(r => r !== null);
  }

  async generateWeeklyDigest(userId) {
    const user = await User.findById(userId).select('followedUsers subscribedCategories interests').lean();
    if (!user) return null;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const query = {
      status: 'published',
      createdAt: { $gte: weekAgo },
      $or: [
        { author: { $in: user.followedUsers || [] } },
        { category: { $in: user.subscribedCategories || [] } },
        { tags: { $in: user.interests || [] } }
      ]
    };

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('author', 'name username profileImage')
      .populate('community', 'name slug')
      .lean();

    if (blogs.length === 0) return null;

    const categories = [...new Set(blogs.map(b => b.category).filter(Boolean))];
    const topBlogs = blogs.slice(0, 5);
    const communityBlogs = blogs.filter(b => b.community).slice(0, 3);

    return {
      userId,
      period: { start: weekAgo, end: new Date() },
      stats: {
        totalNewPosts: blogs.length,
        categories,
        topAuthors: [...new Set(topBlogs.map(b => b.author.name))].slice(0, 5)
      },
      highlights: {
        topPosts: topBlogs.map(b => ({
          id: b._id,
          title: b.title,
          author: b.author.name,
          views: b.views,
          slug: b.slug
        })),
        communityPosts: communityBlogs.map(b => ({
          id: b._id,
          title: b.title,
          community: b.community.name,
          slug: b.slug
        }))
      },
      generatedAt: new Date()
    };
  }

  async sendWeeklyDigests() {
    const users = await User.find({ 
      'notificationPreferences.digest': 'weekly',
      'notificationPreferences.inApp': { $ne: false }
    }).select('_id').lean();

    const batches = [];
    for (let i = 0; i < users.length; i += 50) {
      batches.push(users.slice(i, i + 50));
    }

    for (const batch of batches) {
      await Promise.all(batch.map(user => this.generateAndSendDigest(user._id)));
    }
  }

  async generateAndSendDigest(userId) {
    const digest = await this.generateWeeklyDigest(userId);
    if (!digest) return;

    await this.sendSmartNotification(userId, 'weekly_digest', {
      count: digest.stats.totalNewPosts,
      highlights: digest.highlights
    }, { forcePriority: 'low' });
  }

  async getNotificationStats(userId) {
    const stats = await Notification.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$type', count: { $sum: 1 }, unread: { $sum: { $cond: ['$read', 0, 1] } } } }
    ]);

    const total = await Notification.countDocuments({ userId });
    const unread = await Notification.countDocuments({ userId, read: false });
    const byPriority = await Notification.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    return { total, unread, byType: stats, byPriority };
  }

  cancelScheduledNotification(notificationId) {
    const timeoutId = this.scheduledNotifications.get(notificationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledNotifications.delete(notificationId);
      return true;
    }
    return false;
  }
}

export const smartNotificationEngine = new SmartNotificationEngine();