import { Building, FileText, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CurrencySelector from "./currency-selector";

const routes = [
  {
    name: "Home",
    href: "/#home",
  },
  {
    name: "Products",
    href: "/#products",
  },
  {
    name: "Story",
    href: "/story",
  },
  {
    name: "Pricing",
    href: "/#pricing",
  },
  {
    name: "FAQ",
    href: "/faq",
  },
  {
    name: "Contact",
    href: "/contact",
  },
];

const importantLinks = [
  {
    name: "Privacy Policy",
    href: "/privacy-policy",
  },
  {
    name: "Terms and Conditions",
    href: "/terms-and-conditions",
  },
  {
    name: "Return Policy",
    href: "/return-policy",
  },
  {
    name: "Cookies Policy",
    href: "/cookies-policy",
  },
];

const companyDetails = [
  {
    name: "Company: QUICK FIT LTD",
    icon: Building,
  },
  {
    name: "Company Number: 15995367",
    icon: FileText,
  },
  {
    name: "support@yum-mi.com",
    icon: Mail,
  },
  {
    name: `DEPT 2, 43 OWSTON ROAD, CARCROFT, DONCASTER, UNITED KINGDOM, DN6 8DA`,
    icon: MapPin,
  },
];

const Footer = () => {
  const date = new Date();
  let year = date.getFullYear();

  return (
    <footer className="main-footer max-w-[1350px] mx-auto bg-white">
      <div className="main-footer__top bg-white">
        <div className="px-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="pr-4 pl-4">
              <div className="footer-widget__column footer-widget__about">
                <div className="footer-widget__logo">
                  <Image width={"98"} height={"39"} src="/logos/yum-mi-onigiri-logo.png" alt="Yum-mi Logo" />
                </div>
                <p 
                  className="footer-widget__about-text"
                  style={{
                    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    letterSpacing: '0.01em',
                    textTransform: 'none',
                    color: '#0f172a'
                  }}
                >
                  AI sidekick counts the calories, imagines recipes, and guides you toward a healthier happily-ever-after
                </p>
              </div>
            </div>

            <div className="pr-4 pl-4 pt-6 md:pt-0">
              <div className="footer-widget__column footer-widget__company">
                <div className="footer-widget__title-box">
                  <h3 
                    className="footer-widget__title"
                    style={{
                      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      lineHeight: 1.2,
                      letterSpacing: '0.01em',
                      textTransform: 'none',
                      color: '#0f172a'
                    }}
                  >Menu</h3>
                </div>
                <div className="footer-widget__resources-list-box">
                  <ul className="footer-widget__resources-list">
                    {routes.map((route) => (
                      <li key={route.name}>
                        <Link 
                          href={route.href}
                          aria-label={`Navigate to ${route.name} page`}
                          style={{
                            fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            fontWeight: 600,
                            lineHeight: 1.2,
                            letterSpacing: '0.01em',
                            textTransform: 'none',
                            color: '#0f172a'
                          }}
                        >{route.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="pr-4 pl-4 pt-6 xl:pt-0">
              <div className="footer-widget__column footer-widget__resources">
                <div className="footer-widget__title-box">
                  <h3 
                    className="footer-widget__title"
                    style={{
                      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      lineHeight: 1.2,
                      letterSpacing: '0.01em',
                      textTransform: 'none',
                      color: '#0f172a'
                    }}
                  >Links</h3>
                </div>
                <div className="footer-widget__resources-list-box">
                  <ul className="footer-widget__resources-list">
                    {importantLinks.map((link) => (
                      <li key={link.name}>
                        <Link 
                          href={link.href}
                          aria-label={`Read our ${link.name}`}
                          style={{
                            fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            fontWeight: 600,
                            lineHeight: 1.2,
                            letterSpacing: '0.01em',
                            textTransform: 'none',
                            color: '#0f172a'
                          }}
                        >{link.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="pr-4 pl-4 pt-6 xl:pt-0">
              <div className="footer-widget__column footer-widget__resources">
                <div className="footer-widget__title-box">
                  <h3 
                    className="footer-widget__title"
                    style={{
                      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      lineHeight: 1.2,
                      letterSpacing: '0.01em',
                      textTransform: 'none',
                      color: '#0f172a'
                    }}
                  >Company</h3>
                </div>
                <div className="footer-widget__company-list-box">
                  <ul className="space-y-4">
                    {companyDetails.map((detail) => (
                      <li 
                        key={detail.name} 
                        className="flex text-sm"
                        style={{
                          fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                          fontWeight: 600,
                          lineHeight: 1.2,
                          letterSpacing: '0.01em',
                          textTransform: 'none',
                          color: '#0f172a'
                        }}
                      >
                        <detail.icon className="h-5 w-5 mr-3 min-w-fit" />
                        {detail.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="main-footer__bottom bg-white">
        <div className="flex justify-between items-center px-4 mx-4 bg-white">
          <div className="">
            <p 
              className="text-center"
              style={{
                fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: '0.01em',
                textTransform: 'none',
                color: '#0f172a'
              }}
            >
              Yum-mi, Copyright © {year}. All Rights Reserved.
            </p>
          </div>
          <CurrencySelector />
        </div>
        <div className="mt-6 flex justify-center">
          <Image
            src="/cards_new.svg"
            alt="cards"
            width={300}
            height={100}
            className=""
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
