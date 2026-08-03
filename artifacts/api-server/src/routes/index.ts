import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import partnersRouter from "./partners";
import productsRouter from "./products";
import testimonialsRouter from "./testimonials";
import galleryRouter from "./gallery";
import faqRouter from "./faq";
import aboutRouter from "./about";
import storageRouter from "./storage";
import blogPostsRouter from "./blog-posts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(partnersRouter);
router.use(productsRouter);
router.use(testimonialsRouter);
router.use(galleryRouter);
router.use(faqRouter);
router.use(aboutRouter);
router.use(storageRouter);
router.use(blogPostsRouter);

export default router;
