import Community from '../models/Community.js';
import Blog from '../models/Blog.js';

export const createCommunity = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Community name is required.' });
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
    const communitiesList = await Community.find().sort({ name: 1 });

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

    res.status(200).json({ communities });
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
