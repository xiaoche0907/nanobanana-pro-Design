import React, { useState } from 'react';
import { generateVideoScript, blobToBase64 } from '../services/geminiService';
import { Film, Video, Upload, Clock, Zap, Loader2, AlertCircle, FileText, Key } from 'lucide-react';

interface ScriptScene {
  time: string;
  visual: string;
  audio: string;
  overlay: string;
}

const VideoTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState('30s');
  const [style, setStyle] = useState('Fast-paced/Sales');
  
  const [script, setScript] = useState<ScriptScene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScript([]);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const base64 = await blobToBase64(selectedFile);
      const result = await generateVideoScript(base64, selectedFile.type, duration, style);
      setScript(result);
    } catch (err: any) {
      setError("生成脚本失败，请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-y-auto p-4 md:p-6">
      <div className="space-y-6">
        <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-pastel-text">
            <Film className="w-5 h-5 text-pastel-highlight" />
            配置视频脚本
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-pastel-muted mb-2">1. 上传产品图</label>
            <div className="relative group cursor-pointer border-2 border-dashed border-pastel-border rounded-lg p-4 transition-colors hover:border-pastel-pink hover:bg-pastel-bg">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {!previewUrl ? (
                <div className="text-center text-pastel-muted py-6">
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-50 text-pastel-highlight" />
                  <p className="text-sm">上传图片以分析卖点</p>
                </div>
              ) : (
                <div className="relative h-40 w-full flex items-center justify-center">
                  <img src={previewUrl} alt="Preview" className="max-h-full max-w-full rounded shadow-sm object-contain" />
                  <div className="absolute top-0 right-0 p-1 bg-white/50 rounded-bl-lg">
                    <button onClick={(e) => { e.preventDefault(); setSelectedFile(null); setPreviewUrl(null); }} className="text-gray-500 hover:text-red-400">
                        <span className="text-xs px-2">更换</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
             <label className="block text-sm font-medium text-pastel-muted mb-2 flex items-center gap-2">
               <Clock className="w-4 h-4" /> 2. 视频时长
             </label>
             <div className="flex gap-3">
               {['15s', '30s', '60s'].map((d) => (
                 <button
                   key={d}
                   onClick={() => setDuration(d)}
                   className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                     duration === d 
                       ? 'bg-pastel-pink border-pastel-border text-pastel-text shadow-sm' 
                       : 'bg-white border-pastel-border text-pastel-muted hover:bg-pastel-bg'
                   }`}
                 >
                   {d}
                 </button>
               ))}
             </div>
          </div>

          <div className="mb-8">
             <label className="block text-sm font-medium text-pastel-muted mb-2 flex items-center gap-2">
               <Zap className="w-4 h-4" /> 3. 视频风格 (Vibe)
             </label>
             <div className="grid grid-cols-1 gap-3">
               {['Fast-paced/Sales (快节奏带货)', 'Emotional/Story (情感故事)', 'Professional/Review (专业评测)'].map((s) => (
                 <button
                   key={s}
                   onClick={() => setStyle(s)}
                   className={`py-3 px-4 rounded-lg border text-left text-sm transition-all ${
                     style === s 
                       ? 'bg-pastel-pink border-pastel-border text-pastel-text shadow-sm' 
                       : 'bg-white border-pastel-border text-pastel-muted hover:bg-pastel-bg'
                   }`}
                 >
                   {s}
                 </button>
               ))}
             </div>
          </div>

          {error && (
             <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-2 text-sm text-red-600">
               <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
               </div>
               {error.includes("密钥") && (
                  <button 
                    onClick={() => (window as any).aistudio?.openSelectKey()}
                    className="ml-7 px-3 py-1.5 bg-white border border-red-200 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors w-fit shadow-sm flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" /> 更换 API 密钥
                  </button>
               )}
             </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!selectedFile || isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${
              !selectedFile ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
              isLoading ? 'bg-pastel-pink cursor-wait' : 'bg-pastel-pink hover:bg-pastel-pinkhover text-pastel-text'
            }`}
          >
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> 正在策划分镜...</> : '生成视频脚本'}
          </button>
        </div>
      </div>

      <div className="flex flex-col h-full overflow-hidden">
        <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm flex-1 flex flex-col overflow-hidden">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 flex-shrink-0 text-pastel-text">
            <Video className="w-5 h-5 text-pastel-highlight" />
            分镜脚本结果
          </h2>

          <div className="flex-1 bg-pastel-bg rounded-lg border border-pastel-border overflow-hidden relative flex flex-col">
            {script.length > 0 ? (
              <div className="w-full h-full overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white border-b border-pastel-border sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-xs font-bold text-pastel-muted uppercase tracking-wider w-24">时间</th>
                      <th className="p-4 text-xs font-bold text-pastel-muted uppercase tracking-wider">画面 (Visual)</th>
                      <th className="p-4 text-xs font-bold text-pastel-muted uppercase tracking-wider">音频 (Audio)</th>
                      <th className="p-4 text-xs font-bold text-pastel-muted uppercase tracking-wider w-32">字幕 (Overlay)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pastel-border">
                    {script.map((scene, idx) => (
                      <tr key={idx} className="hover:bg-white transition-colors">
                        <td className="p-4 text-sm text-pastel-highlight font-medium align-top whitespace-nowrap">
                          {scene.time}
                        </td>
                        <td className="p-4 text-sm text-pastel-text align-top">
                          {scene.visual}
                        </td>
                        <td className="p-4 text-sm text-pastel-muted align-top italic">
                          {scene.audio}
                        </td>
                        <td className="p-4 text-sm text-pastel-text align-top bg-white/50">
                          {scene.overlay}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-pastel-muted p-8">
                {isLoading ? (
                   <>
                     <div className="w-12 h-12 border-4 border-pastel-pink border-t-pastel-highlight rounded-full animate-spin mb-4"></div>
                     <p className="text-sm">AI 导演正在思考分镜...</p>
                   </>
                 ) : (
                   <>
                     <div className="bg-white p-4 rounded-full mb-4 opacity-70 border border-pastel-border shadow-sm">
                        <FileText className="w-8 h-8 text-pastel-highlight" />
                     </div>
                     <p className="text-sm">生成的视频脚本将显示在这里</p>
                   </>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoTab;