import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'bot'], required: true },
    text: { type: String, required: true },
    attachments: [{ name: String, type: String }],
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true },
    title: { type: String, default: 'New Chat' },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

chatSessionSchema.index({ user: 1, updatedAt: -1 });
chatSessionSchema.index({ user: 1, sessionId: 1 }, { unique: true });

export default mongoose.model('ChatSession', chatSessionSchema);
