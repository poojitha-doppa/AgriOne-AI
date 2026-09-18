import { Router } from 'express';
import mongoose from 'mongoose';
import protect from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import CropAnalysis from '../models/CropAnalysis.js';
import ChatSession from '../models/ChatHistory.js';
import { config } from '../config/env.js';

const router = Router();

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const requireAdmin = (req, res) => {
  if (!req.user?.isAdmin) {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
      requestId: req.requestId,
    });
    return false;
  }
  return true;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

router.get('/overview', protect, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const today = startOfToday();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      usersToday,
      usersLast7Days,
      totalAnalyses,
      analysesToday,
      recentUsers,
      recentAnalyses,
      diagnosisBreakdown,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      CropAnalysis.countDocuments({}),
      CropAnalysis.countDocuments({ createdAt: { $gte: today } }),
      User.find({}, 'name phone createdAt').sort({ createdAt: -1 }).limit(8),
      CropAnalysis.find({}, 'diseaseLabel diagnosisStatus confidence createdAt user')
        .populate('user', 'name phone')
        .sort({ createdAt: -1 })
        .limit(12),
      CropAnalysis.aggregate([
        { $group: { _id: '$diagnosisStatus', count: { $sum: 1 } } },
      ]),
    ]);

    const normalizedAdminPhone = String(config.adminPhone || '').replace(/^\+91/, '');
    const adminUsers = normalizedAdminPhone
      ? await User.countDocuments({
          $or: [{ phone: normalizedAdminPhone }, { phone: `+91${normalizedAdminPhone}` }],
        })
      : 0;

    const statusCounts = {
      confirmed: 0,
      low_confidence: 0,
      unknown: 0,
    };

    for (const row of diagnosisBreakdown) {
      if (row?._id in statusCounts) {
        statusCounts[row._id] = row.count;
      }
    }

    return res.json({
      success: true,
      requestId: req.requestId,
      generatedAt: new Date().toISOString(),
      system: {
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      },
      users: {
        total: totalUsers,
        admins: adminUsers,
        today: usersToday,
        last7Days: usersLast7Days,
        recent: recentUsers.map((u) => ({
          id: String(u._id),
          name: u.name,
          phone: u.phone,
          createdAt: u.createdAt,
        })),
      },
      cropAnalyses: {
        total: totalAnalyses,
        today: analysesToday,
        diagnosisStatus: statusCounts,
        recent: recentAnalyses.map((a) => ({
          id: String(a._id),
          diseaseLabel: a.diseaseLabel,
          diagnosisStatus: a.diagnosisStatus,
          confidence: a.confidence,
          createdAt: a.createdAt,
          user: a.user
            ? {
                id: String(a.user._id),
                name: a.user.name,
                phone: a.user.phone,
              }
            : null,
        })),
      },
      activities: {
        latestUserSignupAt: recentUsers[0]?.createdAt || null,
        latestAnalysisAt: recentAnalyses[0]?.createdAt || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to load admin overview',
      requestId: req.requestId,
    });
  }
});

router.get('/users/:userId/activity', protect, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id',
        requestId: req.requestId,
      });
    }

    const user = await User.findById(userId).select('name phone createdAt');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        requestId: req.requestId,
      });
    }

    const [analysisCount, chatSessionCount, analyses, sessions] = await Promise.all([
      CropAnalysis.countDocuments({ user: user._id }),
      ChatSession.countDocuments({ user: user._id }),
      CropAnalysis.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('diseaseLabel diagnosisStatus confidence cropType createdAt'),
      ChatSession.find({ user: user._id })
        .sort({ updatedAt: -1 })
        .limit(20)
        .select('sessionId title messages updatedAt createdAt'),
    ]);

    return res.json({
      success: true,
      requestId: req.requestId,
      data: {
        user: {
          id: String(user._id),
          name: user.name,
          phone: user.phone,
          createdAt: user.createdAt,
        },
        stats: {
          analyses: analysisCount,
          chatSessions: chatSessionCount,
        },
        recentAnalyses: analyses.map((item) => ({
          id: String(item._id),
          cropType: item.cropType || 'Unknown',
          diseaseLabel: item.diseaseLabel || '-',
          diagnosisStatus: item.diagnosisStatus || 'unknown',
          confidence: item.confidence,
          createdAt: item.createdAt,
        })),
        recentChats: sessions.map((item) => ({
          id: String(item._id),
          sessionId: item.sessionId,
          title: item.title || 'New Chat',
          messageCount: Array.isArray(item.messages) ? item.messages.length : 0,
          updatedAt: item.updatedAt,
          createdAt: item.createdAt,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to load user activity',
      requestId: req.requestId,
    });
  }
});

router.delete('/users/:userId', protect, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id',
        requestId: req.requestId,
      });
    }

    if (String(req.user.userId) === String(userId)) {
      return res.status(409).json({
        success: false,
        message: 'You cannot delete your own admin account',
        requestId: req.requestId,
      });
    }

    const user = await User.findById(userId).select('phone name');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        requestId: req.requestId,
      });
    }

    const normalizedAdminPhone = String(config.adminPhone || '').replace(/^\+91/, '');
    const normalizedUserPhone = String(user.phone || '').replace(/^\+91/, '');
    if (normalizedAdminPhone && normalizedAdminPhone === normalizedUserPhone) {
      return res.status(409).json({
        success: false,
        message: 'Configured admin account cannot be deleted',
        requestId: req.requestId,
      });
    }

    const [analysisResult, chatResult, userResult] = await Promise.all([
      CropAnalysis.deleteMany({ user: user._id }),
      ChatSession.deleteMany({ user: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);

    return res.json({
      success: true,
      requestId: req.requestId,
      message: `Deleted user ${user.name}`,
      data: {
        deletedUserId: String(user._id),
        deletedAnalyses: analysisResult.deletedCount || 0,
        deletedChatSessions: chatResult.deletedCount || 0,
        deletedUsers: userResult.deletedCount || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user',
      requestId: req.requestId,
    });
  }
});

export default router;
