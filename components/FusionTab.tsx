import React, { useState } from 'react';
import { generateFusionImage, blobToBase64 } from '../services/geminiService';
import { Layers, Upload, Loader2, AlertCircle, Box, Image as ImageIcon, Sparkles, Key } from 'lucide-react';

const FusionTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'3D' | 'REAL'>('3D');
  const [description, setDescription] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImages([]);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile || !description) return;
    setError(null);
    if ((window as any).aistudio) {
      try { const hasKey = await (window as any).aistudio.hasSelectedApiKey(); if (!hasKey) await (window as any).aistudio.openSelectKey(); } catch (e) {}
    }
    setIsGenerating(true);
    setGeneratedImages([]);
    try {
      const base64 = await blobToBase64(selectedFile);
      const images = await generateFusionImage(base64, selectedFile.type, description, sourceType);
      setGeneratedImages(images);
    } catch (error: any) {
      const isPermissionError = error.status === 403 || (error.message && error.message.includes("permission"));
      if (isPermissionError) {
        setError("权限不足：需要配置 API Key。");
      } else {
        setError("生成失败: " + (error.message || "未知错误"));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-y-auto p-4 md:p-6">
      <div className="space-y-6">
        <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-pastel-text">
            <Layers className="w-5 h-5 text-pastel-highlight" />
            场景融合 (Scene Fusion)
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
                  <p className="text-sm">点击上传图片</p>
                  <p className="text-xs text-pastel-muted mt-1">支持白底图或实拍图</p>
                </div>
              ) : (
                <div className="relative h-48 w-full flex items-center justify-center">
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
            <label className="block text-sm font-medium text-pastel-muted mb-2">2. 选择原图类型</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer rounded-lg border p-3 flex items-start gap-3 transition-all ${
                sourceType === '3D' 
                  ? 'bg-pastel-bg border-pastel-pink ring-1 ring-pastel-pink shadow-sm' 
                  : 'bg-white border-pastel-border hover:bg-pastel-bg'
              }`}>
                <input 
                  type="radio" 
                  name="sourceType" 
                  value="3D" 
                  checked={sourceType === '3D'} 
                  onChange={() => setSourceType('3D')}
                  className="hidden"
                />
                <Box className={`w-5 h-5 mt-0.5 ${sourceType === '3D' ? 'text-pastel-highlight' : 'text-pastel-muted'}`} />
                <div>
                  <div className="text-sm font-medium text-pastel-text">3D建模 / 白底图</div>
                  <div className="text-xs text-pastel-muted mt-1">AI 自动生成光影。</div>
                </div>
              </label>

              <label className={`cursor-pointer rounded-lg border p-3 flex items-start gap-3 transition-all ${
                sourceType === 'REAL' 
                  ? 'bg-pastel-bg border-pastel-pink ring-1 ring-pastel-pink shadow-sm' 
                  : 'bg-white border-pastel-border hover:bg-pastel-bg'
              }`}>
                <input 
                  type="radio" 
                  name="sourceType" 
                  value="REAL" 
                  checked={sourceType === 'REAL'} 
                  onChange={() => setSourceType('REAL')}
                  className="hidden"
                />
                <ImageIcon className={`w-5 h-5 mt-0.5 ${sourceType === 'REAL' ? 'text-pastel-highlight' : 'text-pastel-muted'}`} />
                <div>
                  <div className="text-sm font-medium text-pastel-text">实拍图</div>
                  <div className="text-xs text-pastel-muted mt-1">扩展或迁移背景。</div>
                </div>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-pastel-muted mb-2">3. 场景描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述您想要的背景环境（例如：放在木质桌面上，阳光透过树叶洒下来...）"
              className="w-full h-24 bg-pastel-input border border-pastel-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-pastel-pink outline-none resize-none placeholder-pastel-muted text-pastel-text"
            />
          </div>

          {error && (
             <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-2 text-sm text-red-600">
               <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
               </div>
               {(error.includes("403") || error.includes("权限")) && (
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
            disabled={!selectedFile || !description || isGenerating}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${
              !selectedFile || !description ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
              isGenerating ? 'bg-pastel-pink cursor-wait' : 'bg-pastel-pink hover:bg-pastel-pinkhover text-pastel-text'
            }`}
          >
            {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> 正在融合...</> : <><Sparkles className="w-5 h-5" /> 生成融合场景</>}
          </button>
        </div>
      </div>

      <div className="flex flex-col h-full overflow-hidden">
        <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm flex-1 flex flex-col overflow-hidden">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 flex-shrink-0 text-pastel-text">
            <Layers className="w-5 h-5 text-pastel-highlight" />
            融合结果
          </h2>

          <div className="flex-1 bg-pastel-bg rounded-lg border border-pastel-border overflow-hidden relative flex flex-col p-2">
            {generatedImages.length > 0 ? (
               <div className="w-full h-full overflow-y-auto">
                 {generatedImages.map((imgSrc, idx) => (
                    <div key={idx} className="mb-4 last:mb-0">
                        <img src={imgSrc} alt="Fused Result" className="w-full h-auto rounded-lg shadow-sm" />
                        <div className="mt-2 text-right">
                           <a href={imgSrc} download={`scene-fusion-${Date.now()}.png`} className="text-sm text-pastel-highlight hover:text-pastel-pinkhover inline-flex items-center gap-1 font-medium">
                              下载图片
                           </a>
                        </div>
                    </div>
                 ))}
               </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-pastel-muted p-8">
                 {isGenerating ? (
                   <>
                     <div className="w-12 h-12 border-4 border-pastel-pink border-t-pastel-highlight rounded-full animate-spin mb-4"></div>
                     <p className="text-sm">Gemini 3 Pro 正在进行光影合成...</p>
                   </>
                 ) : (
                   <>
                     <div className="bg-white p-4 rounded-full mb-4 opacity-70 border border-pastel-border shadow-sm">
                        <Layers className="w-8 h-8 text-pastel-highlight" />
                     </div>
                     <p className="text-sm">融合后的场景图将显示在这里</p>
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

export default FusionTab;