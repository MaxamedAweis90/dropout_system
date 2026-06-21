"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Home,
  BarChart3,
  Settings,
  Github,
  GraduationCap,
  Shield,
  Menu,
  X,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  activeSection: string;
  onLinkClick: (sectionId: string) => void;
}

export default function Sidebar({ activeSection, onLinkClick }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "metrics", label: "Model Metrics", icon: BarChart3 },
    { id: "how-it-works", label: "How It Works", icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    onLinkClick(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Sticky Top Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-[#070b16]/90 border-b border-slate-900/60 backdrop-blur-md z-40 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto h-full px-6 md:px-12 flex items-center justify-between">
          {/* Logo / Branding */}
          <button 
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-3 cursor-pointer text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <TrendingUp size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-wider text-white leading-none">Dropout<span className="text-indigo-400">SyS</span></span>
              <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-black mt-1">Early Warning</span>
            </div>
          </button>

          {/* Right Controls: Desktop Nav + Hamburger toggle */}
          <div className="flex items-center gap-6">
            {/* Desktop direct links (Optional shortcut but keeping it clean with drawer) */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-400">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`hover:text-white transition cursor-pointer ${
                    activeSection === item.id ? "text-indigo-400" : ""
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl bg-slate-900/90 text-white border border-slate-800 backdrop-blur-md shadow-lg hover:bg-slate-800 transition duration-200 cursor-pointer focus:outline-none"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop for Slide-over Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-45"
              onClick={() => setIsOpen(false)}
            />

            {/* Slide-over Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 right-0 w-80 bg-[#070b16]/95 border-l border-slate-800/80 backdrop-blur-lg z-50 flex flex-col justify-between p-6 shadow-2xl"
            >
              <div className="space-y-8">
                {/* Header inside Drawer */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
                      <TrendingUp size={16} />
                    </div>
                    <span className="text-sm font-extrabold text-white">Navigation Menu</span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Navigation Items */}
                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 text-xs font-bold cursor-pointer text-left
                          ${isActive
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                          }
                        `}
                      >
                        <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}

                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-all duration-200 text-xs font-bold text-left"
                  >
                    <Github className="h-4.5 w-4.5 shrink-0 text-slate-500" />
                    <span>GitHub Repository</span>
                  </a>
                </nav>
              </div>

              {/* Portal Login Buttons (CTAs) */}
              <div className="space-y-3 pb-4">
                <div className="h-[1px] bg-slate-900/60 my-4" />

                <Link href="/login" className="block" onClick={() => setIsOpen(false)}>
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl text-xs font-bold py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer shadow-lg shadow-indigo-600/15">
                    <GraduationCap size={16} />
                    <span>Teacher Login</span>
                  </button>
                </Link>

                <Link href="/admin-login" className="block" onClick={() => setIsOpen(false)}>
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl text-xs font-bold py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white border border-transparent shadow-lg shadow-emerald-600/15 transition cursor-pointer">
                    <Shield size={16} />
                    <span>Admin Login</span>
                  </button>
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
