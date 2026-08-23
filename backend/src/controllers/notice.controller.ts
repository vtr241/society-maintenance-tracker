import { Response } from "express";
import { prisma } from "../utils/prisma.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { sendImportantNoticeEmail } from "../services/email.service.js";

export const getAllNotices = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const notices = await prisma.notice.findMany({
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: [{ isImportant: "desc" }, { createdAt: "desc" }],
    });

    res.json({ success: true, data: { notices } });
  } catch (error: any) {
    console.error("[NoticeController.getAllNotices] Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notices" });
  }
};

export const createNotice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, content, isImportant } = req.body;

    if (!title || !content) {
      res.status(400).json({
        success: false,
        message: "Notice title and content are required",
      });
      return;
    }

    const important = isImportant === true || isImportant === "true";

    const notice = await prisma.notice.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        isImportant: important,
        authorId: req.user!.id,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    // If marked important, broadcast email to all residents
    if (important) {
      prisma.user
        .findMany({
          where: { role: "RESIDENT" },
          select: { email: true, name: true },
        })
        .then((residents) => {
          if (residents.length > 0) {
            sendImportantNoticeEmail(residents, notice.title, notice.content);
          }
        })
        .catch((err) =>
          console.error("[NoticeController] Failed sending notice emails:", err)
        );
    }

    res.status(201).json({
      success: true,
      message: "Notice created successfully",
      data: { notice },
    });
  } catch (error: any) {
    console.error("[NoticeController.createNotice] Error:", error);
    res.status(500).json({ success: false, message: "Failed to create notice" });
  }
};

export const updateNotice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, isImportant } = req.body;

    const notice = await prisma.notice.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        ...(typeof isImportant === "boolean" && { isImportant }),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    res.json({
      success: true,
      message: "Notice updated successfully",
      data: { notice },
    });
  } catch (error: any) {
    console.error("[NoticeController.updateNotice] Error:", error);
    res.status(500).json({ success: false, message: "Failed to update notice" });
  }
};

export const deleteNotice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.notice.delete({ where: { id } });
    res.json({ success: true, message: "Notice deleted successfully" });
  } catch (error: any) {
    console.error("[NoticeController.deleteNotice] Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete notice" });
  }
};
