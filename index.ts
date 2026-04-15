Import { Router } from "express";
import { db, conversations, messages } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq, desc } from "drizzle-orm";
import { eq, desc, and } from "drizzle-orm";
import {
  CreateOpenaiConversationBody,
  SendOpenaiMessageBody,
-0
+2
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  ClearOpenaiMessagesParams,
  DeleteOpenaiMessageParams,
} from "@workspace/api-zod";
const router = Router();
-0
+54
  }
});
router.delete("/conversations/:id/messages", async (req, res) => {
  try {
    const params = ClearOpenaiMessagesParams.safeParse({
      id: Number(req.params.id),
    });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, params.data.id),
    });
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    await db.delete(messages).where(eq(messages.conversationId, params.data.id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to clear messages");
    res.status(500).json({ error: "Internal server error" });
  }
});
router.delete("/conversations/:id/messages/:messageId", async (req, res) => {
  try {
    const params = DeleteOpenaiMessageParams.safeParse({
      id: Number(req.params.id),
      messageId: Number(req.params.messageId),
    });
    if (!params.success) {
      res.status(400).json({ error: "Invalid params" });
      return;
    }
    const deleted = await db
      .delete(messages)
      .where(
        and(
          eq(messages.id, params.data.messageId),
          eq(messages.conversationId, params.data.id)
        )
      )
      .returning();
    if (!deleted.length) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete message");
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const params = SendOpenaiMessageParams.safeParse({
-0
+1
    const conversationId = params.data.id;
    const userContent = body.data.content;
    const imageDataUrl = (body.data as { imageDataUrl?: string }).imageDataUrl;
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
-1
+7
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const savedContent = imageDataUrl
      ? userContent
        ? `${userContent} [image attached]`
        : "[image attached]"
      : userContent;
    await db.insert(messages).values({
      conversationId,
      role: "user",
      content: userContent,
      content: savedContent,
    });
    const history = await db
-4
+23
        "You are SUIMAI, a thoughtful and eloquent AI writing companion. Your name is SUIMAI — never refer to yourself as ChatGPT, GPT, or any other name. If asked who made you or what model you are, simply say you are SUIMAI. Be warm, articulate, and helpful.",
    };
    const chatMessages = [systemPrompt, ...history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }))];
    type TextContent = { type: "text"; text: string };
    type ImageContent = { type: "image_url"; image_url: { url: string } };
    type MessageContent = string | (TextContent | ImageContent)[];
    const historyMessages = history.map((m, idx) => {
      const isLastUserMessage =
        m.role === "user" && idx === history.length - 1 && imageDataUrl;
      if (isLastUserMessage) {
        const parts: (TextContent | ImageContent)[] = [];
        if (userContent) parts.push({ type: "text", text: userContent });
        parts.push({
          type: "image_url",
          image_url: { url: imageDataUrl },
        });
        return { role: "user" as const, content: parts };
      }
      return {
        role: m.role as "user" | "assistant" | "system",
        content: m.content as MessageContent,
      };
    });
    const chatMessages = [systemPrompt, ...historyMessages];
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
-1
+1
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: chatMessages,
      messages: chatMessages as Parameters<typeof openai.chat.completions.create>[0]["messages"],
      stream: true,
    });

هاد ا
