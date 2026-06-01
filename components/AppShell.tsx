'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Database, 
  Archive, 
  ClipboardList, 
  Map, 
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AppShellProps {
  children: React.ReactNode;
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'info' | 'success' | 'warning';
}

const SearchContext = createContext({
  searchQuery: '',
  setSearchQuery: (query: string) => {},
});

export function useSearch() {
  return useContext(SearchContext);
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    // Load notifications from localStorage
    const saved = localStorage.getItem('sidoku_notifications');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse notifications:', e);
      }
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('sidoku-realtime-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_documents' },
        (payload) => {
          console.log('Realtime change:', payload);
          let newNotif: NotificationItem | null = null;
          const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

          if (payload.eventType === 'INSERT') {
            const doc = payload.new;
            newNotif = {
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: 'Item Baru Ditambahkan',
              desc: `Item "${doc.nama_eviden}" (${doc.format_req}) ditambahkan ke Unit ${doc.unit}.`,
              time: `Hari ini, ${timestamp}`,
              type: 'info'
            };
          } else if (payload.eventType === 'UPDATE') {
            const doc = payload.new;
            
            if (doc.is_uploaded && doc.status === 'completed') {
              newNotif = {
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: 'Dokumen Berhasil Diunggah',
                desc: `Dokumen "${doc.nama_eviden}" (${doc.unit}) berhasil diunggah dan terverifikasi.`,
                time: `Hari ini, ${timestamp}`,
                type: 'success'
              };
            } else if (doc.status === 'revision') {
              newNotif = {
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: 'Revisi Dokumen',
                desc: `Dokumen "${doc.nama_eviden}" (${doc.unit}) memerlukan revisi.`,
                time: `Hari ini, ${timestamp}`,
                type: 'warning'
              };
            } else if (!doc.is_uploaded && doc.status === 'missing') {
              newNotif = {
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: 'Dokumen Dikosongkan',
                desc: `Dokumen "${doc.nama_eviden}" (${doc.unit}) telah dikosongkan.`,
                time: `Hari ini, ${timestamp}`,
                type: 'warning'
              };
            }
          } else if (payload.eventType === 'DELETE') {
            newNotif = {
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: 'Item Dihapus',
              desc: `Sebuah item eviden telah dihapus dari inventaris.`,
              time: `Hari ini, ${timestamp}`,
              type: 'warning'
            };
          }

          if (newNotif) {
            setNotifications((prev) => {
              const updated = [newNotif!, ...prev].slice(0, 50);
              localStorage.setItem('sidoku_notifications', JSON.stringify(updated));
              return updated;
            });
          }
        }
      )
      .subscribe();

    // Listen to local client events
    const handleLocalChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { eventType, doc } = customEvent.detail || {};
      let newNotif: NotificationItem | null = null;
      const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      if (eventType === 'INSERT') {
        newNotif = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: 'Item Baru Ditambahkan',
          desc: `Item "${doc.nama_eviden}" (${doc.format_req}) ditambahkan ke Unit ${doc.unit}.`,
          time: `Hari ini, ${timestamp}`,
          type: 'info'
        };
      } else if (eventType === 'UPDATE') {
        if (doc.is_uploaded && doc.status === 'completed') {
          newNotif = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: 'Dokumen Berhasil Diunggah',
            desc: `Dokumen "${doc.nama_eviden}" (${doc.unit}) berhasil diunggah dan terverifikasi.`,
            time: `Hari ini, ${timestamp}`,
            type: 'success'
          };
        } else if (doc.status === 'revision') {
          newNotif = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: 'Revisi Dokumen',
            desc: `Dokumen "${doc.nama_eviden}" (${doc.unit}) memerlukan revisi.`,
            time: `Hari ini, ${timestamp}`,
            type: 'warning'
          };
        } else if (!doc.is_uploaded && doc.status === 'missing') {
          newNotif = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: 'Dokumen Dikosongkan',
            desc: `Dokumen "${doc.nama_eviden}" (${doc.unit}) telah dikosongkan.`,
            time: `Hari ini, ${timestamp}`,
            type: 'warning'
          };
        }
      } else if (eventType === 'DELETE') {
        newNotif = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: 'Item Dihapus',
          desc: `Sebuah item eviden telah dihapus dari inventaris.`,
          time: `Hari ini, ${timestamp}`,
          type: 'warning'
        };
      }

      if (newNotif) {
        setNotifications((prev) => {
          // Avoid duplicate notifications if realtime subscription also fires
          if (prev.some(n => n.desc === newNotif?.desc && n.title === newNotif?.title)) {
            return prev;
          }
          const updated = [newNotif!, ...prev].slice(0, 50);
          localStorage.setItem('sidoku_notifications', JSON.stringify(updated));
          return updated;
        });
      }
    };

    window.addEventListener('sidoku-document-changed', handleLocalChange);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('sidoku-document-changed', handleLocalChange);
    };
  }, []);

  const sidebarLinks = [
    { href: '/', icon: <Home size={22} />, label: 'Beranda' },
    { href: '/unit/UP', icon: <Database size={22} />, label: 'Unit Pengolah' },
    { href: '/unit/UK', icon: <Archive size={22} />, label: 'Unit Kearsipan' },
    { href: '/inventori', icon: <ClipboardList size={22} />, label: 'Rekap Lengkap' },
    { href: '/monitoring', icon: <Map size={22} />, label: 'Peta Dokumen' },
  ];

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <div className="min-h-screen bg-[#F8F9FB] text-[#1A1C1E] flex w-full relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-[#1A1C1E]/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`w-72 bg-white border-r border-[#E9ECEF] flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="p-10 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-[#1E3A8A] tracking-tighter leading-none">SIDOKU</span>
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2">Administrasi Kecamatan</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 px-6 space-y-1.5">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all group relative ${
                    isActive 
                      ? 'text-[#1E3A8A] bg-[#EEF2FF]' 
                      : 'text-slate-400 hover:text-[#1E3A8A] hover:bg-[#F8F9FB]'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-4 bottom-4 w-1.5 bg-[#1E3A8A] rounded-r-full" />}
                  <span className={`${isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'} transition-opacity`}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-72 flex flex-col min-h-screen min-w-0">
          {/* Header */}
          <header className="h-20 bg-white border-b border-[#E9ECEF] sticky top-0 z-30 px-6 lg:px-10 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-[#1E3A8A] transition-colors"
                aria-label="Open Sidebar"
              >
                <Menu size={24} />
              </button>
              <div className="relative group w-full flex items-center">
                <Search className="absolute left-5 text-slate-300" size={20} />
                <input 
                  type="text" 
                  placeholder="Cari dokumen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F8F9FB] border-none rounded-2xl py-3 pl-14 pr-12 text-sm font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all outline-none"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-5 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-8 ml-4">
              {/* Notification Bell with Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative text-slate-400 hover:text-[#1E3A8A] transition-colors p-2 rounded-xl hover:bg-slate-50"
                  aria-label="Notifications"
                >
                  <Bell size={22} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-50 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>

                {isNotificationOpen && (
                  <>
                    <div 
                      onClick={() => setIsNotificationOpen(false)}
                      className="fixed inset-0 z-40" 
                    />
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-[#E9ECEF] rounded-3xl shadow-2xl p-6 z-50 animate-scale-in">
                      <div className="flex justify-between items-center mb-4 border-b border-[#E9ECEF] pb-3">
                        <span className="text-sm font-black text-[#1E3A8A]">NOTIFIKASI</span>
                        <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg">{notifications.length} BARU</span>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs font-bold">
                          Tidak ada notifikasi baru
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                          {notifications.map((n) => (
                            <div key={n.id} className="p-3 bg-[#F8F9FB] rounded-xl relative group hover:bg-[#EEF2FF] transition-all">
                              <button 
                                onClick={() => clearNotification(n.id)}
                                className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={14} />
                              </button>
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 rounded-lg p-1.5 flex-shrink-0 ${
                                  n.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                  n.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                  {n.type === 'success' ? <CheckCircle2 size={16} /> :
                                   n.type === 'warning' ? <AlertCircle size={16} /> : <Calendar size={16} />}
                                </div>
                                <div className="pr-4">
                                  <h5 className="text-xs font-black text-[#1A1C1E]">{n.title}</h5>
                                  <p className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">{n.desc}</p>
                                  <span className="text-[9px] text-slate-300 block mt-1.5 font-bold">{n.time}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="h-10 w-[1px] bg-[#E9ECEF] hidden sm:block" />

              {/* Profile Section (ADM Badge Avatar) */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-[#1A1C1E] leading-none">Admin Kecamatan</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Super Administrator</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#1E3A8A] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#1E3A8A]/20 transition-transform hover:scale-105 select-none">
                  ADM
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-12 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SearchContext.Provider>
  );
}
