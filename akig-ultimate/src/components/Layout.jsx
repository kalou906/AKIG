import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Toast from "./Toast";
import Tour from "./Tour";

export default function Layout({ children }) {
  const [tourActive, setTourActive] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar onStartTour={() => setTourActive(true)} />
        <main className="p-4">{children}</main>
        <footer className="band-guinee mt-auto">
          <div className="flex-1" />
          <div className="flex-1" />
          <div className="flex-1" />
        </footer>
        <Toast />
        <Tour active={tourActive} onFinish={() => setTourActive(false)} />
      </div>
    </div>
  );
}
