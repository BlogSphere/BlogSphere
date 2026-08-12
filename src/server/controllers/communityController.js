import Community from '../models/Community.js';
import Blog from '../models/Blog.js';
import Notification from '../models/Notification.js';

export const createCommunity = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Community name is required.' });
    }

    // Limit check: Maximum 5 communities created per user
    const userCommunityCount = await Community.countDocuments({ creator: req.user._id });
    if (userCommunityCount >= 5) {
      return res.status(400).json({ error: 'You have reached the maximum limit of 5 communities created per user.' });
    }

    const cleanName = name.trim();
    // Check unique name
    const existing = await Community.findOne({ name: { $regex: `^${cleanName}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({ error: 'Community name already exists.' });
    }

    const community = new Community({
      name: cleanName,
      description: description || '',
      creator: req.user._id,
      members: [req.user._id] // Creator is default first member
    });

    await community.save();
    res.status(201).json({ message: 'Community created successfully', community });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCommunities = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const { page = 1, limit = 9, search = '' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 9));

    const query = {};
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const totalCommunities = await Community.countDocuments(query);
    const totalPages = Math.ceil(totalCommunities / limitNum) || 1;

    const communitiesList = await Community.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const communities = communitiesList.map(comm => {
      const isMember = userId ? comm.members.some(mId => mId.toString() === userId.toString()) : false;
      return {
        _id: comm._id,
        name: comm.name,
        description: comm.description,
        creator: comm.creator,
        membersCount: comm.members.length,
        isMember
      };
    });

    res.status(200).json({
      communities,
      total: totalCommunities,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const joinCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found.' });
    }

    const memberIndex = community.members.indexOf(userId);
    let isJoined = false;

    if (memberIndex === -1) {
      community.members.push(userId);
      isJoined = true;

      // Send welcome notification to user joining
      const joinNotif = new Notification({
        userId,
        message: `You joined "${community.name}". You will now receive instant notifications when articles are posted here!`,
        type: 'community_post',
        referenceId: community._id
      });
      await joinNotif.save();
      if (global.io) {
        global.io.to(`user_${userId}`).emit('notification_received', joinNotif);
      }

      // Notify community creator if different user
      if (community.creator && community.creator.toString() !== userId.toString()) {
        const creatorNotif = new Notification({
          userId: community.creator,
          message: `${req.user.name} joined your community "${community.name}"`,
          type: 'community_post',
          referenceId: community._id
        });
        await creatorNotif.save();
        if (global.io) {
          global.io.to(`user_${community.creator}`).emit('notification_received', creatorNotif);
        }
      }
    } else {
      community.members.splice(memberIndex, 1);
    }

    await community.save();
    res.status(200).json({
      message: isJoined ? 'Successfully joined community' : 'Successfully left community',
      isJoined,
      membersCount: community.members.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCommunityDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user._id : null;

    const community = await Community.findById(id).populate('creator', 'name profileImage');
    if (!community) {
      return res.status(404).json({ error: 'Community not found.' });
    }

    // Get blogs associated with this community
    const blogs = await Blog.find({ community: id, status: 'published' })
      .populate('author', 'name profileImage bio')
      .populate('collaborators', 'name profileImage')
      .sort({ createdAt: -1 });

    const isMember = userId ? community.members.some(mId => mId.toString() === userId.toString()) : false;

    res.status(200).json({
      community: {
        _id: community._id,
        name: community.name,
        description: community.description,
        creator: community.creator,
        membersCount: community.members.length,
        isMember
      },
      blogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
