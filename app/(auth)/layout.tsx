import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";

const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col bg-surface text-ink">
    <Header />
    <div className="flex flex-1 items-center justify-center py-16">
      {children}
    </div>
    <Footer />
  </div>
);

export default AuthLayout;
