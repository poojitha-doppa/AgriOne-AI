import ChatSession from '../models/ChatHistory.js';

// GET /api/chat/sessions — list all sessions (titles only, no messages)
export const listSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user.userId })
      .sort({ updatedAt: -1 })
      .select('sessionId title updatedAt createdAt')
      .limit(100);

    return res.json({ success: true, data: sessions });
  } catch (err) {
    console.error('[ChatHistory] list error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/chat/sessions/:sessionId — get full session with messages
export const getSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      user: req.user.userId,
      sessionId: req.params.sessionId,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    return res.json({ success: true, data: session });
  } catch (err) {
    console.error('[ChatHistory] get error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/chat/sessions — upsert (create or update) a session
export const saveSession = async (req, res) => {
  try {
    const { sessionId, title, messages } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'messages must be an array' });
    }

    const session = await ChatSession.findOneAndUpdate(
      { user: req.user.userId, sessionId },
      {
        $set: {
          title: (title || 'New Chat').slice(0, 60),
          messages: messages.slice(-100), // keep last 100 messages per session
        },
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, data: { sessionId: session.sessionId, title: session.title } });
  } catch (err) {
    console.error('[ChatHistory] save error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/chat/sessions/:sessionId — delete a session
export const deleteSession = async (req, res) => {
  try {
    await ChatSession.deleteOne({
      user: req.user.userId,
      sessionId: req.params.sessionId,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('[ChatHistory] delete error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
