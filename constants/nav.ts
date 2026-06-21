export type NavLink = {
  label: string;
  href: string;
};

export const mainNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "eSim", href: "/products" },
  { label: "Pricing", href: "/pricing" },
  { label: "Our Story", href: "/story" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export const productsMenu: NavLink[] = [
  { label: "Browse destinations", href: "/products" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing & Points", href: "/pricing" },
  { label: "Your dashboard", href: "/dashboard" },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: "Pricing", href: "/pricing" },
      { label: "Our Story", href: "/story" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/sign-in" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Wallet", href: "/dashboard/wallet" },
      { label: "Activities", href: "/activities" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Payments", href: "/payments" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms-and-conditions" },
      { label: "Cookies", href: "/cookies-policy" },
      { label: "Refund", href: "/return-policy" },
    ],
  },
];
