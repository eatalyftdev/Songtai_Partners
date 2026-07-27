// Zod validation schemas — primary exports (used for server-side request validation)
export * from "./generated/api";
// TypeScript interfaces — selective re-export to avoid naming conflict with Zod schemas above
export type {
  AboutContent,
  AboutContentInput,
  ApiError,
  FaqItem,
  FaqItemInput,
  GalleryImage,
  GalleryImageInput,
  HealthStatus,
  Partner,
  PartnerInput,
  PartnerStats,
  PartnerStatus,
  PartnerStatusUpdate,
  PartnerStatusUpdateStatus,
  PartnerUpdate,
  Product,
  ProductInput,
  ProductUpdate,
  Testimonial,
  TestimonialInput,
} from "./generated/types";
