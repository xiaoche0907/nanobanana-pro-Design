import React, { useState, useEffect, useRef } from 'react';
import { analyzeProductImage, generateMarketingImage, blobToBase64, inpaintImage } from '../services/geminiService';
import { AspectRatio, ImageResolution } from '../types';
import { Camera, Image as ImageIcon, Loader2, Sparkles, Wand2, Check, AlignLeft, AlertCircle, User, ToggleLeft, ToggleRight, X, Clock, Trash2, RotateCcw, Brush, Eraser, Download, MousePointer2, Ruler, Palette, Key } from 'lucide-react';

interface DirectorTabProps {
  onImageGenerated: (url: string) => void;
}

interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

const getFriendlyErrorMessage = (error: any): string => {
  const status = error.status || error.response?.status;
  const message = error.message 
    || (typeof error === 'string' ? error : null)
    || (error.error && error.error.message)
    || JSON.stringify(error);

  if (status === 400 || message.includes('400')) return "请求参数无效 (400)。请检查上传的图片格式。";
  if (status === 401 || message.includes('401')) return "身份验证失败 (401)。API 密钥无效。";
  if (status === 403 || message.includes('403') || message.includes('suspended')) return "权限不足 (403)。当前 API 密钥已被停用或未绑定付费项目。";
  if (status >= 500) return "服务器繁忙 (500)。请稍后重试。";
  
  return `操作失败: ${message.substring(0, 150)}...`;
};

const renderContent = (content: any) => {
  if (typeof content === 'string') {
     return content.split('\n').map((line, i) => <div key={i}>{line}</div>);
  }
  if (typeof content === 'number') return String(content);
  if (Array.isArray(content)) return content.join(', ');
  if (typeof content === 'object' && content !== null) {
    return (
      <ul className="list-disc list-inside mt-1 space-y-1 pl-1">
        {Object.entries(content).map(([key, value]) => (
          <li key={key} className="break-words text-pastel-text">
            <span className="text-pastel-highlight font-medium capitalize mr-1">{key.replace(/_/g, ' ')}:</span>
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </li>
        ))}
      </ul>
    );
  }
  return '';
};

const DirectorTab: React.FC<DirectorTabProps> = ({ onImageGenerated }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFixModel, setIsFixModel] = useState(false);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [modelPreviewUrl, setModelPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  
  // Inputs
  const [userContext, setUserContext] = useState('');
  const [productScale, setProductScale] = useState('');
  const [styleStrategy, setStyleStrategy] = useState('Daily Commuter');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [resolution, setResolution] = useState<ImageResolution>(ImageResolution.RES_1K);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [inpaintPrompt, setInpaintPrompt] = useState('');
  const [isInpainting, setIsInpainting] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('vp_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.warn("Failed to load history", e);
    }
  }, []);

  useEffect(() => {
      if (canvasRef.current && activeImage) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              const img = new Image();
              img.src = activeImage;
              img.onload = () => {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx.clearRect(0, 0, canvas.width, canvas.height); 
              };
          }
      }
  }, [activeImage]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeImage) return;
    setIsDrawing(true);
    drawLayered(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if(canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.beginPath();
    }
  };
  
  const drawLayered = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'brush') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255, 196, 214, 0.6)'; // Pastel Pink Mask
    } else {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  
  const handleInpaint = async () => {
      if (!activeImage || !canvasRef.current || !inpaintPrompt) return;
      setIsInpainting(true);
      setGenerateError(null);

      try {
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = canvasRef.current.width;
          maskCanvas.height = canvasRef.current.height;
          const maskCtx = maskCanvas.getContext('2d');
          if (!maskCtx) throw new Error("Could not create mask");
          
          maskCtx.fillStyle = 'black';
          maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
          maskCtx.globalCompositeOperation = 'source-over';
          maskCtx.drawImage(canvasRef.current, 0, 0);
          
          const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
          const data = imageData.data;
          for(let i = 0; i < data.length; i += 4) {
              if (data[i+3] > 0) {
                  data[i] = 255; data[i+1] = 255; data[i+2] = 255; data[i+3] = 255;
              } else {
                  data[i] = 0; data[i+1] = 0; data[i+2] = 0; data[i+3] = 255;
              }
          }
          maskCtx.putImageData(imageData, 0, 0);
          const maskBase64 = maskCanvas.toDataURL('image/png').split(',')[1];
          const originalBase64 = activeImage.split(',')[1];
          
          const resultImages = await inpaintImage(originalBase64, maskBase64, inpaintPrompt);
          if (resultImages.length > 0) {
             const newImage = resultImages[0];
             setActiveImage(newImage);
             addToHistory(newImage, "Inpaint: " + inpaintPrompt);
             const ctx = canvasRef.current.getContext('2d');
             ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
             setInpaintPrompt('');
          }
      } catch (error: any) {
          console.error("Inpaint error", error);
          setGenerateError("重绘失败: " + (error.message || "未知错误"));
      } finally {
          setIsInpainting(false);
      }
  };

  const addToHistory = (url: string, usedPrompt: string) => {
    const newItem: HistoryItem = { id: Date.now().toString(), url, prompt: usedPrompt, timestamp: Date.now() };
    const updatedHistory = [newItem, ...history].slice(0, 20);
    setHistory(updatedHistory);
    try { localStorage.setItem('vp_history', JSON.stringify(updatedHistory)); } catch (e) { /* Quota handled silently */ }
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    try { localStorage.setItem('vp_history', JSON.stringify(updated)); } catch (e) {}
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null); setPrompt(''); setActiveImage(null); setAnalyzeError(null); setGenerateError(null);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setPrompt('');
    setActiveImage(null);
  };

  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setModelFile(e.target.files[0]);
      setModelPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const clearModelFile = (e: React.MouseEvent) => {
    e.preventDefault();
    setModelFile(null);
    setModelPreviewUrl(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const base64 = await blobToBase64(selectedFile);
      const result = await analyzeProductImage(base64, selectedFile.type, userContext, productScale, styleStrategy);
      setAnalysisResult(result);
      setPrompt(result.final_prompt || '');
    } catch (error: any) {
      setAnalyzeError(getFriendlyErrorMessage(error));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    if (isFixModel && !modelFile) { setGenerateError("开启了“固定模特”模式，请上传模特参考图。"); return; }
    
    setGenerateError(null);
    if ((window as any).aistudio) {
      try { const hasKey = await (window as any).aistudio.hasSelectedApiKey(); if (!hasKey) await (window as any).aistudio.openSelectKey(); } catch (e) {}
    }

    setIsGenerating(true);
    setActiveImage(null);
    
    try {
      let referenceImage = undefined;
      if (selectedFile) {
        referenceImage = { base64: await blobToBase64(selectedFile), mimeType: selectedFile.type };
      }
      let modelReferenceImage = undefined;
      if (isFixModel && modelFile) {
        modelReferenceImage = { base64: await blobToBase64(modelFile), mimeType: modelFile.type };
      }

      const images = await generateMarketingImage(prompt, aspectRatio, resolution, referenceImage, modelReferenceImage);
      if (images.length > 0) {
        setActiveImage(images[0]);
        onImageGenerated(images[0]);
        addToHistory(images[0], prompt);
      }
    } catch (error: any) {
      const isPermissionError = error.status === 403 || (error.message && error.message.includes("permission"));
      if (isPermissionError) {
        setGenerateError("权限不足：需要配置 API 密钥。");
      } else {
        setGenerateError(getFriendlyErrorMessage(error));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-y-auto p-4 md:p-6">
      {/* Left Column: Input & Analysis */}
      <div className="space-y-6">
        <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-pastel-text">
            <Camera className="w-5 h-5 text-pastel-highlight" />
            上传与需求
          </h2>
          
          <div className="relative group cursor-pointer border-2 border-dashed border-pastel-border rounded-lg p-4 transition-colors hover:border-pastel-pink hover:bg-pastel-bg">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {!previewUrl ? (
              <div className="text-center text-pastel-muted py-8">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50 text-pastel-highlight" />
                <p>点击上传产品图片</p>
                <p className="text-sm mt-1">推荐使用白底图</p>
              </div>
            ) : (
              <div className="relative h-48 w-full flex items-center justify-center">
                <img src={previewUrl} alt="Preview" className="max-h-full max-w-full rounded shadow-sm object-contain" />
                <div className="absolute top-0 right-0 p-1 bg-white/50 rounded-bl-lg z-10">
                   <button onClick={clearFile} className="text-gray-500 hover:text-red-400">
                     <X className="w-5 h-5" />
                   </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
             <label className="block text-sm font-medium text-pastel-muted mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4 text-pastel-highlight" />
                风格与策略 (Analysis & Style)
             </label>
             <select
               value={styleStrategy}
               onChange={(e) => setStyleStrategy(e.target.value)}
               className="w-full bg-pastel-input border border-pastel-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-pastel-pink outline-none text-pastel-text"
             >
               <option value="Daily Commuter">🚇 Daily Commuter (日常通勤)</option>
               <option value="Light Travel">✈️ Light Travel / City Break (轻度旅游/城市漫游)</option>
               <option value="Chill Weekend">☕ Chill Weekend / Cafe (松弛周末/探店)</option>
               <option value="Business Elite">💼 Business Elite (商务精英)</option>
               <option value="Gorpcore Outdoor">🌲 Gorpcore / Outdoor (山系户外)</option>
               <option value="Gen Z Street">🛹 Gen Z Street (Z世代街头)</option>
             </select>
          </div>

          <div className="mt-4">
             <label className="block text-sm font-medium text-pastel-muted mb-2 flex items-center gap-2">
                <AlignLeft className="w-4 h-4" />
                关键创作需求 (可选)
             </label>
             <textarea
               value={userContext}
               onChange={(e) => setUserContext(e.target.value)}
               placeholder="在此输入您的品牌要求。例如：极致简约风格，户外探险感..."
               className="w-full h-24 bg-pastel-input border border-pastel-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-pastel-pink outline-none resize-none placeholder-pastel-muted text-pastel-text"
             />
          </div>

          <div className="mt-4">
             <label className="block text-sm font-medium text-pastel-muted mb-2 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-pastel-highlight" />
                产品尺寸 / 比例 (Product Scale)
             </label>
             <input
               type="text"
               value={productScale}
               onChange={(e) => setProductScale(e.target.value)}
               placeholder="例如：高50cm，大容量，覆盖全背..."
               className="w-full bg-pastel-input border border-pastel-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-pastel-pink outline-none placeholder-pastel-muted text-pastel-text"
             />
          </div>

          {analyzeError && (
             <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-2 text-sm text-red-600">
               <div className="flex items-start gap-3">
                 <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                 <p>{analyzeError}</p>
               </div>
               {(analyzeError.includes("403") || analyzeError.includes("权限")) && (
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
            onClick={handleAnalyze}
            disabled={!selectedFile || isAnalyzing}
            className={`mt-4 w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              !selectedFile ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
              isAnalyzing ? 'bg-pastel-pink cursor-wait' : 'bg-pastel-pink hover:bg-pastel-pinkhover text-pastel-text shadow-sm'
            }`}
          >
            {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> 正在分析...</> : <><Sparkles className="w-5 h-5" /> 分析品牌与视觉策略</>}
          </button>
        </div>

        {analysisResult && (
          <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm animate-fade-in">
            <h3 className="text-lg font-semibold text-pastel-highlight mb-3">🎬 Visual Narrative & Styling (视觉叙事与造型)</h3>
            <div className="space-y-4 text-sm text-pastel-text">
              <div className="p-3 bg-pastel-bg rounded-lg border border-pastel-border">
                <span className="block text-xs font-bold text-pastel-muted uppercase tracking-wider mb-1">Scene Atmosphere (场景氛围)</span>
                {renderContent(analysisResult.scene_atmosphere || analysisResult.target_persona)}
              </div>
              <div className="p-3 bg-pastel-bg rounded-lg border border-pastel-border">
                <span className="block text-xs font-bold text-pastel-muted uppercase tracking-wider mb-1">Model & Outfit (模特与穿搭)</span>
                {renderContent(analysisResult.model_outfit || analysisResult.outfit_recommendation)}
              </div>
              <div className="p-3 bg-pastel-bg rounded-lg border border-pastel-border">
                <span className="block text-xs font-bold text-pastel-muted uppercase tracking-wider mb-1">Lighting & Tone (光影与影调)</span>
                {renderContent(analysisResult.lighting_tone || analysisResult.visual_vibe)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Generation Controls */}
      <div className="space-y-6">
        
        {/* === Generation Studio Panel === */}
        {!activeImage && (
          <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-pastel-text">
              <Wand2 className="w-5 h-5 text-pastel-highlight" />
              生成工作室
            </h2>

            {/* Reference Image Indicators */}
            {(selectedFile || modelFile) && (
              <div className="mb-4 p-3 bg-pastel-bg border border-pastel-border rounded-lg flex flex-col gap-2">
                <div className="flex items-center gap-2">
                   <h3 className="text-sm font-medium text-pastel-highlight flex-1">素材绑定状态</h3>
                   <span className="text-xs text-pastel-highlight bg-white border border-pastel-border px-2 py-0.5 rounded">
                      Gemini 3 Pro
                   </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-1">
                   {selectedFile && previewUrl ? (
                      <div className="flex items-center gap-2 bg-white p-2 rounded border border-pastel-border shadow-sm">
                          <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                             <img src={previewUrl} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                             <p className="text-xs text-pastel-text font-medium">产品底图</p>
                             <p className="text-[10px] text-green-500 flex items-center gap-0.5"><Check className="w-3 h-3"/> 已绑定</p>
                          </div>
                      </div>
                   ) : null}

                   {isFixModel ? (
                      modelFile && modelPreviewUrl ? (
                          <div className="flex items-center gap-2 bg-white p-2 rounded border border-pastel-border shadow-sm">
                              <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                 <img src={modelPreviewUrl} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-xs text-pastel-text font-medium">模特参考</p>
                                 <p className="text-[10px] text-green-500 flex items-center gap-0.5"><Check className="w-3 h-3"/> 已绑定</p>
                              </div>
                          </div>
                      ) : (
                          <div className="flex items-center gap-2 bg-red-50 p-2 rounded border border-red-200 text-red-500">
                               <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                                  <User className="w-4 h-4" />
                               </div>
                               <span className="text-xs">请上传模特!</span>
                          </div>
                      )
                   ) : (
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-dashed border-gray-300 text-gray-400 opacity-70">
                          <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                              <User className="w-4 h-4" />
                          </div>
                          <span className="text-xs">模特固定: 关</span>
                      </div>
                   )}
                </div>
              </div>
            )}

            <div className="space-y-4">
               <div className="flex items-center justify-between bg-pastel-bg p-3 rounded-lg border border-pastel-border">
                  <div className="flex items-center gap-2">
                     <User className="w-4 h-4 text-pastel-highlight" />
                     <span className="text-sm font-medium text-pastel-text">固定模特长相 (Fix Model Face)</span>
                  </div>
                  <button 
                    onClick={() => setIsFixModel(!isFixModel)}
                    className={`transition-colors ${isFixModel ? 'text-pastel-highlight' : 'text-pastel-muted'}`}
                  >
                     {isFixModel ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
               </div>

               {isFixModel && (
                  <div className="relative border-2 border-dashed border-pastel-border bg-white rounded-lg p-3 animate-fade-in transition-all">
                    {!modelPreviewUrl ? (
                      <div className="text-center">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleModelFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex flex-col items-center py-2 text-pastel-highlight">
                             <User className="w-6 h-6 mb-1 opacity-70" />
                             <p className="text-sm font-medium">上传模特参考图</p>
                             <p className="text-xs opacity-70 mt-1">请上传一张清晰的模特面部照片</p>
                          </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                          <div className="h-16 w-16 rounded bg-gray-100 overflow-hidden border border-pastel-border">
                             <img src={modelPreviewUrl} alt="Model Ref" className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1">
                             <p className="text-sm font-medium text-pastel-text">模特参考已加载</p>
                             <button onClick={clearModelFile} className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1 mt-1">
                               <X className="w-3 h-3" /> 移除并更换
                             </button>
                          </div>
                      </div>
                    )}
                  </div>
               )}

              <div>
                <label className="block text-sm font-medium text-pastel-muted mb-1">提示词 (Prompt)</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-24 bg-pastel-input border border-pastel-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-pastel-pink outline-none resize-none text-pastel-text"
                  placeholder="完成分析步骤以自动生成专业提示词..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-pastel-muted mb-1">画幅比例</label>
                  <select 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full bg-pastel-input border border-pastel-border rounded-lg p-2 text-sm focus:ring-1 focus:ring-pastel-pink outline-none text-pastel-text"
                  >
                    {Object.entries(AspectRatio).map(([key, value]) => (
                      <option key={key} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-pastel-muted mb-1">分辨率</label>
                  <select 
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as ImageResolution)}
                    className="w-full bg-pastel-input border border-pastel-border rounded-lg p-2 text-sm focus:ring-1 focus:ring-pastel-pink outline-none text-pastel-text"
                  >
                    {Object.entries(ImageResolution).map(([key, value]) => (
                      <option key={key} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {generateError && (
                 <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-2 text-sm text-red-600">
                   <div className="flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>{generateError}</p>
                   </div>
                   {(generateError.includes("403") || generateError.includes("权限")) && (
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
                disabled={!prompt || isGenerating}
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${
                  !prompt ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                  isGenerating ? 'bg-pastel-pink cursor-wait' : 'bg-pastel-pink hover:bg-pastel-pinkhover text-pastel-text'
                }`}
              >
                {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> 正在生成...</> : '生成视觉图'}
              </button>
            </div>
          </div>
        )}

        {/* === Inpainting Canvas Area === */}
        {activeImage && (
          <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm animate-fade-in">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-semibold flex items-center gap-2 text-pastel-text">
                 <Wand2 className="w-5 h-5 text-pastel-highlight" />
                 局部重绘画板
               </h2>
               <div className="flex items-center gap-2">
                   <button 
                      onClick={() => setActiveImage(null)}
                      className="text-xs text-pastel-muted hover:text-pastel-text"
                   >
                     返回生成
                   </button>
                   <a 
                      href={activeImage} 
                      download={`generated-${Date.now()}.png`} 
                      className="p-2 bg-pastel-bg hover:bg-white border border-pastel-border rounded-lg text-pastel-highlight transition-colors shadow-sm"
                      title="下载当前图片"
                    >
                      <Download className="w-4 h-4" />
                   </a>
               </div>
             </div>
             
             {/* Toolbar */}
             <div className="flex items-center gap-4 mb-3 p-2 bg-pastel-bg rounded-lg border border-pastel-border">
                 <button 
                   onClick={() => setTool('brush')}
                   className={`p-2 rounded transition-colors shadow-sm ${tool === 'brush' ? 'bg-pastel-pink text-pastel-text' : 'text-pastel-muted hover:bg-white'}`}
                   title="涂抹蒙版"
                 >
                   <Brush className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => setTool('eraser')}
                   className={`p-2 rounded transition-colors shadow-sm ${tool === 'eraser' ? 'bg-pastel-pink text-pastel-text' : 'text-pastel-muted hover:bg-white'}`}
                   title="橡皮擦"
                 >
                   <Eraser className="w-4 h-4" />
                 </button>
                 
                 <div className="h-6 w-px bg-pastel-border mx-2"></div>
                 
                 <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-pastel-muted">笔刷大小</span>
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      value={brushSize} 
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-32 accent-pastel-pink"
                    />
                 </div>
             </div>

             {/* Canvas Container */}
             <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-pastel-border cursor-crosshair">
                <div 
                   className="absolute inset-0 bg-contain bg-no-repeat bg-center opacity-100 pointer-events-none"
                   style={{ backgroundImage: `url(${activeImage})` }}
                ></div>
                <canvas 
                   ref={canvasRef}
                   onMouseDown={startDrawing}
                   onMouseUp={stopDrawing}
                   onMouseLeave={stopDrawing}
                   onMouseMove={drawLayered}
                   className="absolute inset-0 w-full h-full"
                />
             </div>

             <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                   <input 
                      type="text" 
                      value={inpaintPrompt}
                      onChange={(e) => setInpaintPrompt(e.target.value)}
                      placeholder="想要修改什么？例如：Change the shirt to blue silk..."
                      className="flex-1 bg-pastel-input border border-pastel-border rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-pastel-pink outline-none text-pastel-text"
                   />
                   <button 
                      onClick={handleInpaint}
                      disabled={isInpainting || !inpaintPrompt}
                      className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm ${
                        isInpainting ? 'bg-pastel-pink cursor-wait' : 'bg-pastel-pink hover:bg-pastel-pinkhover text-pastel-text'
                      }`}
                   >
                      {isInpainting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4" />}
                      重绘
                   </button>
                </div>
                <p className="text-xs text-pastel-muted">
                   * 使用画笔涂抹需要修改的区域，然后在输入框中描述修改内容。
                </p>
             </div>
          </div>
        )}

        {/* History Gallery */}
        {history.length > 0 && (
          <div className="bg-pastel-card p-4 rounded-xl border border-pastel-border shadow-sm mt-6">
            <h3 className="text-sm font-semibold text-pastel-muted mb-3 flex items-center gap-2">
               <Clock className="w-4 h-4" /> 历史记录 ({history.length})
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-3">
               {history.map((item) => (
                 <div 
                   key={item.id} 
                   className={`relative group aspect-square rounded-lg overflow-hidden border bg-gray-50 cursor-pointer transition-colors ${
                     activeImage === item.url ? 'border-pastel-highlight ring-2 ring-pastel-pink' : 'border-pastel-border hover:border-pastel-highlight'
                   }`}
                   onClick={() => setActiveImage(item.url)}
                 >
                    <img src={item.url} alt="History" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
                        <button 
                           onClick={(e) => deleteFromHistory(item.id, e)}
                           className="p-1.5 bg-white rounded-full hover:bg-red-50 text-red-400 shadow-sm border border-red-100"
                           title="删除"
                        >
                           <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectorTab;