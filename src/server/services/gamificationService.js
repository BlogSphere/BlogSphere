import User from '../models/User.js';
import Notification from '../models/Notification.js';

// All Available Badges in the System
export const BADGE_DEFINITIONS = [
  {
    id: 'first_publish',
    name: 'First Spark',
    icon: '✍️',
    description: 'Published your very first blog on BlogSphere',
    category: 'writing',
    check: (stats) => (stats.articlesPublished || 0) >= 1
  },
  {
    id: 'prolific_author',
    name: 'Prolific Author',
    icon: '📚',
    description: 'Published 5 blogs and established your editorial voice',
    category: 'writing',
    check: (stats) => (stats.articlesPublished || 0) >= 5
  },
  {
    id: 'master_writer',
    name: 'Master Writer',
    icon: '👑',
    description: 'Published 15 blogs across the platform',
    category: 'writing',
    check: (stats) => (stats.articlesPublished || 0) >= 15
  },
  {
    id: 'curious_reader',
    name: 'Curious Mind',
    icon: '📖',
    description: 'Read 5 insightful blogs by fellow writers',
    category: 'reading',
    check: (stats) => (stats.articlesRead || 0) >= 5
  },
  {
    id: 'avid_scholar',
    name: 'Avid Scholar',
    icon: '🎓',
    description: 'Deep-dived into 25 blogs across the community',
    category: 'reading',
    check: (stats) => (stats.articlesRead || 0) >= 25
  },
  {
    id: 'streak_3',
    name: 'Streak Starter',
    icon: '🔥',
    description: 'Active on BlogSphere for 3 consecutive days',
    category: 'streaks',
    check: (_, streak) => (streak.current || 0) >= 3 || (streak.longest || 0) >= 3
  },
  {
    id: 'streak_7',
    name: 'Week of Power',
    icon: '⚡',
    description: 'Maintained a solid 7-day writing & reading streak',
    category: 'streaks',
    check: (_, streak) => (streak.current || 0) >= 7 || (streak.longest || 0) >= 7
  },
  {
    id: 'streak_30',
    name: 'Unstoppable Legend',
    icon: '🌟',
    description: 'Achieved an extraordinary 30-day activity streak',
    category: 'streaks',
    check: (_, streak) => (streak.current || 0) >= 30 || (streak.longest || 0) >= 30
  },
  {
    id: 'first_comment',
    name: 'Engaged Voice',
    icon: '💬',
    description: 'Shared your thoughts on a blog with a comment',
    category: 'community',
    check: (stats) => (stats.commentsWritten || 0) >= 1
  },
  {
    id: 'discussion_leader',
    name: 'Discussion Leader',
    icon: '💡',
    description: 'Contributed 10 comments to community discussions',
    category: 'community',
    check: (stats) => (stats.commentsWritten || 0) >= 10
  },
  {
    id: 'voice_scribe',
    name: 'Sonic Scribe',
    icon: '🎙️',
    description: 'Drafted blog ideas using Voice Dictation speech-to-text',
    category: 'innovation',
    check: (stats) => (stats.voiceTypingUsed || 0) >= 1
  },
  {
    id: 'level_5',
    name: 'Wordsmith',
    icon: '💎',
    description: 'Advanced to Level 5 Writer & Thinker',
    category: 'levels',
    check: (_, __, level) => level >= 5
  },
  {
    id: 'level_10',
    name: 'Grandmaster',
    icon: '🏆',
    description: 'Reached the elite Level 10 Grandmaster echelon',
    category: 'levels',
    check: (_, __, level) => level >= 10
  }
];

// Level Thresholds & Titles
export const LEVEL_TIERS = [
  { level: 1, title: 'Novice Scribe', minXp: 0, maxXp: 100 },
  { level: 2, title: 'Apprentice Writer', minXp: 100, maxXp: 250 },
  { level: 3, title: 'Wordsmith', minXp: 250, maxXp: 500 },
  { level: 4, title: 'Essayist', minXp: 500, maxXp: 900 },
  { level: 5, title: 'Senior Contributor', minXp: 900, maxXp: 1500 },
  { level: 6, title: 'Lead Columnist', minXp: 1500, maxXp: 2400 },
  { level: 7, title: 'Editorial Vanguard', minXp: 2400, maxXp: 3600 },
  { level: 8, title: 'Thought Luminary', minXp: 3600, maxXp: 5200 },
  { level: 9, title: 'Literary Architect', minXp: 5200, maxXp: 7500 },
  { level: 10, title: 'Grandmaster Scribe', minXp: 7500, maxXp: 12000 }
];

export const calculateLevel = (xp) => {
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_TIERS[i].minXp) {
      return LEVEL_TIERS[i];
    }
  }
  return LEVEL_TIERS[0];
};

// Activity XP Rewards
const XP_MAP = {
  publish_blog: 100,
  read_blog: 15,
  write_comment: 25,
  give_reaction: 10,
  voice_typing: 25,
  daily_checkin: 15
};

/**
 * Update daily streak
 */
export const updateStreak = (currentStreak = 1, longestStreak = 1, lastActiveDate = new Date()) => {
  const now = new Date();
  const last = new Date(lastActiveDate);

  // Normalize to UTC calendar dates (midnight)
  const nowDateOnly = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const lastDateOnly = Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate());

  const dayDiff = Math.floor((nowDateOnly - lastDateOnly) / (1000 * 60 * 60 * 24));

  let nextCurrent = currentStreak;
  let nextLongest = longestStreak;

  if (dayDiff === 0) {
    // Already logged activity today, preserve streak
    nextCurrent = Math.max(1, currentStreak);
  } else if (dayDiff === 1) {
    // Logged yesterday, consecutive streak!
    nextCurrent = currentStreak + 1;
  } else {
    // Broken streak (>1 day), reset to 1
    nextCurrent = 1;
  }

  nextLongest = Math.max(nextLongest, nextCurrent);

  return {
    current: nextCurrent,
    longest: nextLongest,
    lastActiveDate: now
  };
};

/**
 * Record a gamification activity for a user
 */
export const recordGamificationAction = async (userId, actionType, meta = {}) => {
  if (!userId) return null;

  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // Ensure gamification object exists
    if (!user.gamification) {
      user.gamification = {
        xp: 0,
        level: 1,
        streak: { current: 1, longest: 1, lastActiveDate: new Date() },
        badges: [],
        stats: {
          articlesPublished: 0,
          articlesRead: 0,
          commentsWritten: 0,
          reactionsGiven: 0,
          voiceTypingUsed: 0
        }
      };
    }

    const gam = user.gamification;
    const oldLevel = gam.level || 1;

    // 1. Calculate XP Gained
    const xpGained = XP_MAP[actionType] || meta.customXp || 10;
    gam.xp = (gam.xp || 0) + xpGained;

    // 2. Update Stats
    if (!gam.stats) gam.stats = {};
    if (actionType === 'publish_blog') gam.stats.articlesPublished = (gam.stats.articlesPublished || 0) + 1;
    if (actionType === 'read_blog') gam.stats.articlesRead = (gam.stats.articlesRead || 0) + 1;
    if (actionType === 'write_comment') gam.stats.commentsWritten = (gam.stats.commentsWritten || 0) + 1;
    if (actionType === 'give_reaction') gam.stats.reactionsGiven = (gam.stats.reactionsGiven || 0) + 1;
    if (actionType === 'voice_typing') gam.stats.voiceTypingUsed = (gam.stats.voiceTypingUsed || 0) + 1;

    // 3. Update Streak
    gam.streak = updateStreak(
      gam.streak?.current || 1,
      gam.streak?.longest || 1,
      gam.streak?.lastActiveDate || new Date()
    );

    // 4. Calculate Level
    const currentTier = calculateLevel(gam.xp);
    const newLevel = currentTier.level;
    gam.level = newLevel;

    const levelUp = newLevel > oldLevel;

    // 5. Check and Unlock Badges
    const existingBadgeIds = new Set((gam.badges || []).map(b => (b.id === 'master_storyteller' ? 'master_writer' : b.id)));
    const newlyUnlocked = [];

    for (const badgeDef of BADGE_DEFINITIONS) {
      if (!existingBadgeIds.has(badgeDef.id)) {
        const isEligible = badgeDef.check(gam.stats, gam.streak, gam.level);
        if (isEligible) {
          const newBadge = {
            id: badgeDef.id,
            name: badgeDef.name,
            icon: badgeDef.icon,
            description: badgeDef.description,
            category: badgeDef.category,
            unlockedAt: new Date()
          };
          gam.badges.push(newBadge);
          newlyUnlocked.push(newBadge);
          existingBadgeIds.add(badgeDef.id);
        }
      }
    }

    await user.save();

    // 6. Create in-app Notifications for achievements
    if (newlyUnlocked.length > 0) {
      for (const b of newlyUnlocked) {
        try {
          await Notification.create({
            recipient: user._id,
            sender: user._id,
            type: 'system',
            title: `🏆 New Badge Unlocked: ${b.name}!`,
            message: `${b.icon} ${b.description} (+50 Bonus XP)`,
            read: false
          });
        } catch (e) {}
      }
    }

    if (levelUp) {
      try {
        await Notification.create({
          recipient: user._id,
          sender: user._id,
          type: 'system',
          title: `⚡ Level Up! You reached Level ${newLevel}`,
          message: `Congratulations! You are now a ${currentTier.title} on BlogSphere!`,
          read: false
        });
      } catch (e) {}
    }

    return {
      xpGained,
      totalXp: gam.xp,
      level: gam.level,
      levelTitle: currentTier.title,
      levelUp,
      streak: gam.streak,
      newlyUnlockedBadges: newlyUnlocked
    };
  } catch (err) {
    console.error('Error in recordGamificationAction:', err);
    return null;
  }
};

/**
 * Get enriched gamification profile
 */
export const getEnrichedGamification = async (userId) => {
  const user = await User.findById(userId).select('name username profileImage gamification createdAt');
  if (!user) return null;

  const gam = user.gamification || {
    xp: 0,
    level: 1,
    streak: { current: 1, longest: 1, lastActiveDate: new Date() },
    badges: [],
    stats: { articlesPublished: 0, articlesRead: 0, commentsWritten: 0, reactionsGiven: 0, voiceTypingUsed: 0 }
  };

  const currentTier = calculateLevel(gam.xp || 0);
  const nextTier = LEVEL_TIERS.find(t => t.level === currentTier.level + 1) || currentTier;

  const currentLevelXp = currentTier.minXp;
  const nextLevelXp = nextTier.minXp;
  const xpIntoCurrentLevel = Math.max(0, (gam.xp || 0) - currentLevelXp);
  const xpNeededForNext = Math.max(1, nextLevelXp - currentLevelXp);
  const progressPercent = Math.min(100, Math.round((xpIntoCurrentLevel / xpNeededForNext) * 100));

  const unlockedBadgeMap = new Map((gam.badges || []).map(b => [b.id === 'master_storyteller' ? 'master_writer' : b.id, b]));

  const allBadgesWithStatus = BADGE_DEFINITIONS.map(def => {
    const isUnlocked = unlockedBadgeMap.has(def.id);
    const existing = isUnlocked ? unlockedBadgeMap.get(def.id) : null;
    return {
      id: def.id,
      name: def.name,
      icon: def.icon,
      description: def.description,
      category: def.category,
      unlocked: isUnlocked,
      unlockedAt: existing ? existing.unlockedAt : null
    };
  });

  return {
    userId: user._id,
    name: user.name,
    username: user.username,
    profileImage: user.profileImage,
    xp: gam.xp || 0,
    level: currentTier.level,
    levelTitle: currentTier.title,
    currentLevelXp,
    nextLevelXp,
    progressPercent,
    streak: gam.streak || { current: 1, longest: 1, lastActiveDate: new Date() },
    badges: allBadgesWithStatus,
    unlockedBadgesCount: (gam.badges || []).length,
    totalBadgesCount: BADGE_DEFINITIONS.length,
    stats: gam.stats || {}
  };
};
