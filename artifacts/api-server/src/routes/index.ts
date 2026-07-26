import { Router, type IRouter } from "express";
import healthRouter from "./health";
import partnersRouter from "./partners";
import productsRouter from "./products";
import testimonialsRouter from "./testimonials";
import galleryRouter from "./gallery";
import faqRouter from "./faq";
import aboutRouter from "./about";

const router: IRouter = Router();

router.use(healthRouter);
router.use(partnersRouter);
router.use(productsRouter);
router.use(testimonialsRouter);
router.use(galleryRouter);
router.use(faqRouter);
router.use(aboutRouter);

export default router;
