import React, { useEffect, useRef, useState } from 'react';
import { connectLiveDirector, decodeAudioData } from '../services/geminiService';
import { Mic, MicOff, Radio } from 'lucide-react';

const LiveTab: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("准备连接");
  const [error, setError] = useState<string | null>(null);
  
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const liveSessionCloseRef = useRef<(() => void) | null>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => { handleDisconnect(); };
  }, []);

  const initAudioContext = () => {
    if (!outputAudioContextRef.current) {
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputNodeRef.current = outputAudioContextRef.current.createGain();
      outputNodeRef.current.connect(outputAudioContextRef.current.destination);
    } else if (outputAudioContextRef.current.state === 'suspended') {
        outputAudioContextRef.current.resume();
    }
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!outputAudioContextRef.current || !outputNodeRef.current) return;
    
    if(visualizerRef.current) {
        const bars = visualizerRef.current.children;
        for(let i=0; i<bars.length; i++) {
            (bars[i] as HTMLElement).style.height = `${Math.random() * 40 + 10}px`;
        }
        setTimeout(() => {
             for(let i=0; i<bars.length; i++) {
                (bars[i] as HTMLElement).style.height = '4px';
            }
        }, 150);
    }

    try {
      const audioCtx = outputAudioContextRef.current;
      const audioBuffer = await decodeAudioData(base64Audio, audioCtx);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputNodeRef.current);
      const currentTime = audioCtx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
    } catch (e) {
      console.error("Error playing audio chunk", e);
    }
  };

  const handleConnect = async () => {
    setStatus("正在连接...");
    setError(null);
    try {
      initAudioContext();
      const { close } = await connectLiveDirector(
        (base64Audio) => playAudioChunk(base64Audio),
        () => handleDisconnect()
      );
      liveSessionCloseRef.current = close;
      setIsConnected(true);
      setStatus("实时会话进行中");
    } catch (err: any) {
      setError("连接实时 API 失败。请确保您使用了正确的 API 密钥。");
      setStatus("连接失败");
      setIsConnected(false);
    }
  };

  const handleDisconnect = async () => {
    if (liveSessionCloseRef.current) {
      await liveSessionCloseRef.current();
      liveSessionCloseRef.current = null;
    }
    setIsConnected(false);
    setStatus("准备连接");
    nextStartTimeRef.current = 0;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-12">
      <div className="relative">
        <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${isConnected ? 'bg-pastel-pink shadow-[0_0_80px_rgba(255,196,214,0.4)]' : 'bg-white border border-pastel-border shadow-sm'}`}>
            <div className={`relative z-10 p-8 rounded-full transition-all duration-300 ${isConnected ? 'bg-pastel-highlight text-white' : 'bg-pastel-bg text-pastel-highlight'}`}>
                {isConnected ? <Mic className="w-12 h-12 animate-pulse" /> : <MicOff className="w-12 h-12" />}
            </div>
            {isConnected && (
                <>
                    <div className="absolute inset-0 rounded-full border border-pastel-pink animate-ping" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute inset-0 rounded-full border border-pastel-pink animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                </>
            )}
        </div>
      </div>

      <div className="space-y-4 max-w-md">
         <h2 className="text-3xl font-bold text-pastel-text tracking-tight">
             {isConnected ? "正在聆听..." : "实时语音总监"}
         </h2>
         <div className="h-6">
            <p className={`text-sm font-medium transition-colors ${error ? 'text-red-400' : 'text-pastel-muted'}`}>
                {error || status}
            </p>
         </div>

         <div ref={visualizerRef} className="flex justify-center items-center gap-1 h-12">
             {[...Array(8)].map((_, i) => (
                 <div key={i} className={`w-1.5 rounded-full transition-all duration-75 ${isConnected ? 'bg-pastel-highlight' : 'bg-gray-200'}`} style={{ height: '4px' }}></div>
             ))}
         </div>
      </div>

      <button
         onClick={isConnected ? handleDisconnect : handleConnect}
         className={`group relative px-8 py-4 rounded-full font-semibold text-lg transition-all flex items-center gap-3 overflow-hidden shadow-sm ${
           isConnected 
             ? 'bg-white text-red-400 hover:bg-red-50 border border-red-200' 
             : 'bg-white text-pastel-text hover:bg-pastel-bg border border-pastel-border'
         }`}
      >
         {isConnected ? (
             <>
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                结束通话
             </>
         ) : (
             <>
                <Radio className="w-5 h-5 text-pastel-highlight" />
                开始实时对话
             </>
         )}
      </button>
      
      {!isConnected && (
          <p className="text-xs text-pastel-muted max-w-xs mx-auto">
              使用 Gemini Live API 进行低延迟语音交互。点击上方按钮开始与您的 AI 创意总监交谈。
          </p>
      )}
    </div>
  );
};

export default LiveTab;