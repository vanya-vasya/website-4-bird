import {
  getApiUsedGenerations,
  getApiAvailableGenerations,
} from "@/lib/api-limit";
import { AnimatedLayout, AnimatedPage } from "@/components/animated-layout";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiUsedGenerations = await getApiUsedGenerations();
  const apiAvailableGenerations = await getApiAvailableGenerations();

  return (
    <div className="h-full relative bg-[#111827]">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-80 bg-gray-900">
        <Sidebar 
          apiUsedGenerations={apiUsedGenerations}
          apiAvailableGenerations={apiAvailableGenerations}
        />
      </div>
      <main className="md:pl-72 pb-10">
        <Navbar />
        <AnimatedPage>{children}</AnimatedPage>
      </main>

      <footer className="py-6 border-t border-gray-200 bg-white">
        <div className="container">
          <div className="px-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p
              style={{
                fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: 1.2,
                letterSpacing: '0.01em',
                textTransform: 'none',
                color: '#0f172a'
              }}
            >
            QUICK FIT LTD (№15995367) <br /> Email: support@yum-mi.com{" "}
              <br />
              DEPT 2, 43 OWSTON ROAD, CARCROFT, DONCASTER, UNITED KINGDOM, DN6 8DA, <br />
              Copyright © {new Date().getFullYear()}. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <Link 
                href="/privacy-policy" 
                className="hover:text-indigo-600"
                style={{
                  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: 1.2,
                  letterSpacing: '0.01em',
                  textTransform: 'none',
                  color: '#0f172a'
                }}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-and-conditions"
                className="hover:text-indigo-600"
                style={{
                  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: 1.2,
                  letterSpacing: '0.01em',
                  textTransform: 'none',
                  color: '#0f172a'
                }}
              >
                Terms and Conditions
              </Link>
              <Link 
                href="/return-policy" 
                className="hover:text-indigo-600"
                style={{
                  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: 1.2,
                  letterSpacing: '0.01em',
                  textTransform: 'none',
                  color: '#0f172a'
                }}
              >
                Return Policy
              </Link>
              <Link 
                href="/cookies-policy" 
                className="hover:text-indigo-600"
                style={{
                  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: 1.2,
                  letterSpacing: '0.01em',
                  textTransform: 'none',
                  color: '#0f172a'
                }}
              >
                Cookies Policy
              </Link>
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <Image src="/cards_new.svg" alt="cards" width={300} height={100} />
          </div>
        </div>
      </footer>
    </div>
  );
}
