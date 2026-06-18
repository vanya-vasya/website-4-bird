import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";

const LandingLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col bg-surface text-ink">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default LandingLayout;
