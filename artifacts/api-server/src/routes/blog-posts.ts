import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, blogPostsTable } from "@workspace/db";

const router = Router();

// GET /blog-posts — public, returns published posts ordered newest first
router.get("/blog-posts", async (req, res) => {
  try {
    const items = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.status, "published"))
      .orderBy(desc(blogPostsTable.publishedAt));
    return res.json(items);
  } catch (err) {
    req.log.error({ err }, "listBlogPosts failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
