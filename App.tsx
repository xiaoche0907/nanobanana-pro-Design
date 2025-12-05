import React, { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppMode } from './types';
import DirectorTab from './components/DirectorTab';
import EditorTab from './components/EditorTab';
import TrendTab from './components/TrendTab';
import ListingTab from './components/ListingTab';
import VideoTab from './components/VideoTab';
import FusionTab from './components/FusionTab';
import SeatCoverTab from './components/SeatCoverTab';
import SettingsTab from './components/SettingsTab';
import { Activity, Aperture, Camera, FileText, Film, Wand2, Layers, CarFront, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppMode>(AppMode.PLANNING);
  const [sharedImage, setSharedImage] = useState<string | null>(null);

  const handleImageGenerated = (url: string) => {
    setSharedImage(url);
  };

  return (
    <HashRouter>
      <div className="flex h-screen bg-pastel-bg text-pastel-text overflow-hidden font-sans">
        {/* Sidebar Navigation */}
        <aside className="w-20 md:w-64 bg-pastel-card border-r border-pastel-border flex flex-col flex-shrink-0 z-20 shadow-sm">
          <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-pastel-border">
            <div className="p-1.5 bg-pastel-bg rounded-lg">
               <Aperture className="w-6 h-6 text-pastel-highlight" />
            </div>
            <span className="hidden md:block ml-3 font-bold text-lg tracking-tight text-pastel-text">小彻工作室</span>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            <div className="text-xs font-bold text-pastel-muted uppercase tracking-wider px-3 mb-2 hidden md:block">工作台</div>
            
            <NavButton 
              active={activeTab === AppMode.PLANNING} 
              onClick={() => setActiveTab(AppMode.PLANNING)}
              icon={<Camera className="w-5 h-5" />}
              label="视觉策划"
            />
            <NavButton 
              active={activeTab === AppMode.SEAT_COVER} 
              onClick={() => setActiveTab(AppMode.SEAT_COVER)}
              icon={<CarFront className="w-5 h-5" />}
              label="座套试装"
            />
             <NavButton 
              active={activeTab === AppMode.FUSION} 
              onClick={() => setActiveTab(AppMode.FUSION)}
              icon={<Layers className="w-5 h-5" />}
              label="场景融合"
            />
            <NavButton 
              active={activeTab === AppMode.RETOUCHING} 
              onClick={() => setActiveTab(AppMode.RETOUCHING)}
              icon={<Wand2 className="w-5 h-5" />}
              label="智能修图"
            />
            
            <div className="h-4"></div>
            <div className="text-xs font-bold text-pastel-muted uppercase tracking-wider px-3 mb-2 hidden md:block">营销生成</div>

            <NavButton 
              active={activeTab === AppMode.COPYWRITING} 
              onClick={() => setActiveTab(AppMode.COPYWRITING)}
              icon={<FileText className="w-5 h-5" />}
              label="爆款文案"
            />
            <NavButton 
              active={activeTab === AppMode.VIDEO} 
              onClick={() => setActiveTab(AppMode.VIDEO)}
              icon={<Film className="w-5 h-5" />}
              label="视频脚本"
            />
             <NavButton 
              active={activeTab === AppMode.TRENDS} 
              onClick={() => setActiveTab(AppMode.TRENDS)}
              icon={<Activity className="w-5 h-5" />}
              label="趋势洞察"
            />
          </nav>
          
          <div className="p-4 border-t border-pastel-border">
             <NavButton 
              active={activeTab === AppMode.SETTINGS} 
              onClick={() => setActiveTab(AppMode.SETTINGS)}
              icon={<Settings className="w-5 h-5" />}
              label="设置"
            />
            <div className="mt-3 hidden md:block">
               <p className="text-xs text-pastel-muted text-center">跨境电商 AI 工作站 v2.3 (Pastel)</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
           <header className="h-16 bg-pastel-card/80 backdrop-blur-md border-b border-pastel-border flex items-center px-6 justify-between flex-shrink-0">
              <h1 className="text-xl font-medium text-pastel-text">
                {activeTab === AppMode.PLANNING && "视觉策划 (Visual Planning)"}
                {activeTab === AppMode.SEAT_COVER && "座套试装 (Seat Cover Fit)"}
                {activeTab === AppMode.FUSION && "场景融合 (Scene Fusion)"}
                {activeTab === AppMode.RETOUCHING && "智能修图 (Smart Retouching)"}
                {activeTab === AppMode.COPYWRITING && "爆款文案 (Listing Copilot)"}
                {activeTab === AppMode.VIDEO && "视频脚本 (Video Studio)"}
                {activeTab === AppMode.TRENDS && "趋势洞察 (Trend Insights)"}
                {activeTab === AppMode.SETTINGS && "设置 (Settings)"}
              </h1>
           </header>
           
           <div className="flex-1 overflow-auto p-0 relative">
             <div className="h-full w-full">
               {activeTab === AppMode.PLANNING && <DirectorTab onImageGenerated={handleImageGenerated} />}
               {activeTab === AppMode.SEAT_COVER && <SeatCoverTab />}
               {activeTab === AppMode.FUSION && <FusionTab />}
               {activeTab === AppMode.RETOUCHING && <EditorTab initialImage={sharedImage} />}
               {activeTab === AppMode.COPYWRITING && <ListingTab />}
               {activeTab === AppMode.VIDEO && <VideoTab />}
               {activeTab === AppMode.TRENDS && <TrendTab />}
               {activeTab === AppMode.SETTINGS && <SettingsTab />}
             </div>
           </div>
        </main>
      </div>
    </HashRouter>
  );
};

const NavButton: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  highlight?: boolean; 
}> = ({ active, onClick, icon, label, highlight }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-pastel-pink text-pastel-text shadow-sm font-medium' 
        : 'text-pastel-muted hover:bg-pastel-bg hover:text-pastel-highlight'
    } ${highlight && !active ? 'text-pastel-highlight' : ''}`}
  >
    <div className={`${active ? 'text-pastel-text' : 'group-hover:text-pastel-highlight'} transition-colors`}>
      {icon}
    </div>
    <span className="hidden md:block font-medium text-sm">{label}</span>
  </button>
);

export default App;