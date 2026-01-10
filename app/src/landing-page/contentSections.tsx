import type { GridFeature } from "./components/FeaturesGrid";

export const features: GridFeature[] = [
  {
    name: "Staff management with roles",
    description: "Assign permissions and manage team roles for up to 5 users seamlessly.",
    emoji: "👥",
    size: "medium",
  },
  {
    name: "Multiple rooms + locations",
    description: "Manage complex scheduling across various locations and dedicated spaces.",
    emoji: "🏢",
    size: "medium",
  },
  {
    name: "Automated Communication",
    description: "Confirmation, reminder, and follow-up emails sent automatically to clients.",
    emoji: "📧",
    size: "large",
  },
  {
    name: "Customization & Branding",
    description: "Make it yours with your own brand colors, logo, and custom booking experience.",
    emoji: "🎨",
    size: "medium",
  },
  {
    name: "Monetization & Tips",
    description: "Built-in Stripe payments with optional client tipping and bundle packages.",
    emoji: "💰",
    size: "large",
  },
  {
    name: "Coupons & Discount Codes",
    description: "Boost sales with custom discount codes and seasonal promotional offers.",
    emoji: "🎟️",
    size: "medium",
  },
  {
    name: "Advanced Reporting",
    description: "Get insights on no-shows, best timings, and overall team performance.",
    emoji: "📊",
    size: "large",
  },
  {
    name: "Review Collection",
    description: "Collect reviews automatically after appointments to build social proof.",
    emoji: "⭐",
    size: "medium",
  },
  {
    name: "Unlimited Appointments",
    description: "No limits on your growth. Scale as much as you want without extra fees.",
    emoji: "🚀",
    size: "small",
  },
];

export const faqs = [
  {
    id: 1,
    question: "What's included in the Lifetime Deal?",
    answer:
      "You get full access to all current features plus future updates. This includes up to 5 staff members, unlimited bookings, custom branding, SMS gap-fill, and advanced analytics.",
    href: "#",
  },
  {
    id: 2,
    question: "Are there any recurring fees?",
    answer:
      "No! The Lifetime Deal is a one-time payment. You'll never pay subscription fees for the core platform features.",
    href: "#",
  },
  {
    id: 3,
    question: "Can I migrate from Cal.com or Acuity?",
    answer:
      "Yes, we offer free migration assistance. Our team will help you transfer your existing bookings, client data, and settings.",
    href: "#",
  },
  {
    id: 4,
    question: "How does the Spotfiller feature work?",
    answer:
      "When a cancellation occurs, our system automatically sends SMS or email to clients on your waitlist, filling gaps in your schedule within minutes.",
    href: "#",
  },
  {
    id: 5,
    question: "Is there a refund policy?",
    answer:
      "Yes, we offer a 30-day money-back guarantee. If you're not satisfied, we'll refund you in full, no questions asked.",
    href: "#",
  },
];

export const footerNavigation = {
  app: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "FAQ", href: "#faq" },
  ],
  company: [
    { name: "About", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
  ],
};
