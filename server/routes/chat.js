import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

export default function chatRoutes(prisma) {
  const router = Router();

  // Get all chat sessions
  router.get('/sessions', asyncHandler(async (req, res) => {
    const { userId, limit = 20, offset = 0 } = req.query;

    const where = { isArchived: false };
    if (userId) where.userId = userId;

    const sessions = await prisma.chatSession.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      select: {
        id: true,
        sessionId: true,
        title: true,
        messageCount: true,
        lastMessageAt: true,
        createdAt: true,
      },
    });

    const total = await prisma.chatSession.count({ where });

    res.json({
      sessions,
      total,
      hasMore: parseInt(offset) + sessions.length < total,
    });
  }));

  // Get or create a session
  router.post('/sessions', asyncHandler(async (req, res) => {
    const { sessionId, userId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Try to find existing session
    let session = await prisma.chatSession.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50, // Last 50 messages
        },
      },
    });

    if (!session) {
      // Create new session
      session = await prisma.chatSession.create({
        data: {
          sessionId,
          userId,
        },
        include: {
          messages: true,
        },
      });
    }

    res.json(session);
  }));

  // Get a specific session with messages
  router.get('/sessions/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { limit = 50, before } = req.query;

    const session = await prisma.chatSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const whereMessages = { sessionId: session.id };
    if (before) {
      whereMessages.createdAt = { lt: new Date(before) };
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereMessages,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    // Reverse to get chronological order
    messages.reverse();

    res.json({
      ...session,
      messages,
    });
  }));

  // Add a message to a session
  router.post('/sessions/:sessionId/messages', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { role, content, toolsUsed, analysis, actions, tokenCount, modelId } = req.body;

    if (!role || !content) {
      return res.status(400).json({ error: 'role and content are required' });
    }

    // Use transaction for atomic message creation and session update
    const message = await prisma.$transaction(async (tx) => {
      // Find or create session
      let session = await tx.chatSession.findUnique({
        where: { sessionId },
      });

      if (!session) {
        session = await tx.chatSession.create({
          data: { sessionId },
        });
      }

      // Create message
      const newMessage = await tx.chatMessage.create({
        data: {
          sessionId: session.id,
          role,
          content,
          toolsUsed: toolsUsed || [],
          analysis,
          actions,
          tokenCount,
          modelId,
        },
      });

      // Update session stats
      const updateData = {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
      };

      // Generate title from first user message if not set
      if (!session.title && role === 'user') {
        updateData.title = content.length > 50
          ? content.substring(0, 50) + '...'
          : content;
      }

      await tx.chatSession.update({
        where: { id: session.id },
        data: updateData,
      });

      return newMessage;
    });

    res.status(201).json(message);
  }));

  // Update session title
  router.patch('/sessions/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { title, isArchived } = req.body;

    const session = await prisma.chatSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    const updated = await prisma.chatSession.update({
      where: { id: session.id },
      data: updateData,
    });

    res.json(updated);
  }));

  // Delete a session
  router.delete('/sessions/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await prisma.chatSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await prisma.chatSession.delete({
      where: { id: session.id },
    });

    res.json({ success: true, message: 'Session deleted' });
  }));

  // Archive a session (soft delete)
  router.post('/sessions/:sessionId/archive', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await prisma.chatSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await prisma.chatSession.update({
      where: { id: session.id },
      data: { isArchived: true },
    });

    res.json({ success: true, message: 'Session archived' });
  }));

  return router;
}
