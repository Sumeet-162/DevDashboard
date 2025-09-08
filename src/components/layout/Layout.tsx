
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto pt-2 px-2 pb-4 sm:pt-3 sm:px-3 md:pt-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
