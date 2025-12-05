import React, { useState } from 'react';
import { generateSeatCoverFit, blobToBase64 } from '../services/geminiService';
import { AspectRatio, ImageResolution } from '../types';
import { CarFront, Upload, Loader2, AlertCircle, Eye, Image as ImageIcon, Sparkles, Check, Monitor, Grid, Key } from 'lucide-react';

const SeatCoverTab: React.FC = () => {
  const [seatFile, setSeatFile] = useState<File | null>(null);
  const [seatPreview, setSeatPreview] = useState<string | null>(null);
  const [carModel, setCarModel] = useState('');
  const [year, setYear] = useState('');
  const [seatConfig, setSeatConfig] = useState('5-Seater');
  const [targetRow, setTargetRow] = useState('Front Row (Driver/Passenger)');
  const [angleMode, setAngleMode] = useState<'PRESET' | 'REFERENCE'>('PRESET');
  const [anglePreset, setAnglePreset] = useState("Driver's View");
  const [angleRefFile, setAngleRefFile] = useState<File | null>(null);
  const [angleRefPreview, setAngleRefPreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [qualityMode, setQualityMode] = useState<ImageResolution>(ImageResolution.RES_1K);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSeatFile(file);
      setSeatPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleAngleRefFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAngleRefFile(file);
      setAngleRefPreview(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!seatFile || !carModel || !year) {
      setError("请填写所有必填项（产品图、车型、年份）。");
      return;
    }
    
    if (angleMode === 'REFERENCE' && !angleRefFile) {
        setError("选择参考图模式时，必须上传角度参考图。");
        return;
    }

    if ((window as any).aistudio) {
      try { const hasKey = await (window as any).aistudio.hasSelectedApiKey(); if (!hasKey) await (window as any).aistudio.openSelectKey(); } catch (e) {}
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const seatBase64 = await blobToBase64(seatFile);
      let angleValue: string | { base64: string, mime: string } = anglePreset;
      if (angleMode === 'REFERENCE' && angleRefFile) {
          const refBase64 = await blobToBase64(angleRefFile);
          angleValue = { base64: refBase64, mime: angleRefFile.type };
      }

      const images = await generateSeatCoverFit(seatBase64, seatFile.type, carModel, year, seatConfig, targetRow, angleMode, angleValue, aspectRatio, qualityMode);
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
      {/* Left Column: Configuration Wizard */}
      <div className="space-y-6">
        <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-pastel-text">
            <CarFront className="w-5 h-5 text-pastel-highlight" />
            座套试装配置
          </h2>

          {/* === Section 1: Product & Car Info === */}
          <div className="mb-6">
            <h3 className="text-pastel-highlight font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-pastel-bg border border-pastel-pink flex items-center justify-center text-[10px] text-pastel-highlight">1</span>
              产品与车型信息
            </h3>
            
            <label className="block text-sm font-medium text-pastel-muted mb-2">上传座套白底图</label>
            <div className="relative group cursor-pointer border-2 border-dashed border-pastel-border rounded-lg p-3 transition-colors hover:border-pastel-pink hover:bg-pastel-bg mb-4">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleSeatFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {!seatPreview ? (
                <div className="flex items-center gap-3 text-pastel-muted">
                  <div className="p-2 bg-pastel-bg rounded-lg"><Upload className="w-5 h-5 text-pastel-highlight" /></div>
                  <span className="text-sm">点击上传座套图片</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded bg-gray-100 overflow-hidden border border-pastel-border">
                     <img src={seatPreview} alt="Seat" className="h-full w-full object-contain" />
                  </div>
                  <div className="flex-1">
                     <p className="text-sm font-medium text-pastel-text">座套素材已就绪</p>
                     <p className="text-xs text-green-500 flex items-center gap-1 mt-1"><Check className="w-3 h-3"/> 上传成功</p>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); setSeatFile(null); setSeatPreview(null); }} className="text-xs text-pastel-muted hover:text-red-400 px-3">
                     更换
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs text-pastel-muted mb-1">车型型号 (Model)</label>
                    <input 
                        type="text" 
                        value={carModel}
                        onChange={(e) => setCarModel(e.target.value)}
                        placeholder="例如: Tesla Model Y"
                        className="w-full bg-pastel-input border border-pastel-border rounded-lg p-2 text-sm focus:ring-1 focus:ring-pastel-pink outline-none text-pastel-text"
                    />
                </div>
                <div>
                    <label className="block text-xs text-pastel-muted mb-1">年份 (Year)</label>
                    <input 
                        type="text" 
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="例如: 2023"
                        className="w-full bg-pastel-input border border-pastel-border rounded-lg p-2 text-sm focus:ring-1 focus:ring-pastel-pink outline-none text-pastel-text"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs text-pastel-muted mb-1">座椅布局 (Config)</label>
                <select 
                  value={seatConfig}
                  onChange={(e) => setSeatConfig(e.target.value)}
                  className="w-full bg-pastel-input border border-pastel-border rounded-lg p-2 text-sm focus:ring-1 focus:ring-pastel-pink outline-none text-pastel-text"
                >
                  <option value="5-Seater">5-Seater (五座)</option>
                  <option value="7-Seater">7-Seater (七座)</option>
                  <option value="8-Seater">8-Seater (八座)</option>
                  <option value="Captain Seats">Captain Seats (独立航空座椅)</option>
                </select>
            </div>
          </div>

          <div className="border-t border-pastel-border my-6"></div>

          {/* === Section 2: Camera & View Control === */}
          <div className="mb-6">
            <h3 className="text-pastel-highlight font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-pastel-bg border border-pastel-pink flex items-center justify-center text-[10px] text-pastel-highlight">2</span>
              镜头与视角控制
            </h3>

            <div className="mb-4">
               <label className="block text-xs text-pastel-muted mb-1">对焦区域 (Focus Row)</label>
               <select 
                  value={targetRow}
                  onChange={(e) => setTargetRow(e.target.value)}
                  className="w-full bg-pastel-input border border-pastel-border rounded-lg p-2 text-sm focus:ring-1 focus:ring-pastel-pink outline-none text-pastel-text"
                >
                  <option value="Front Row">前排 (主驾驶/副驾驶)</option>
                  <option value="2nd Row">第二排 (后座)</option>
                  <option value="3rd Row">第三排</option>
                  <option value="Full Interior">全车内饰 (广角全景)</option>
                </select>
            </div>
            
            <label className="block text-xs text-pastel-muted mb-2">视角模式 (Angle Mode)</label>
            <div className="flex bg-pastel-bg p-1 rounded-lg mb-4 border border-pastel-border">
                <button 
                  onClick={() => setAngleMode('PRESET')}
                  className={`flex-1 text-xs py-2 rounded transition-all ${angleMode === 'PRESET' ? 'bg-white text-pastel-text shadow-sm' : 'text-pastel-muted hover:text-pastel-text'}`}
                >
                  预设视角
                </button>
                <button 
                  onClick={() => setAngleMode('REFERENCE')}
                  className={`flex-1 text-xs py-2 rounded transition-all ${angleMode === 'REFERENCE' ? 'bg-white text-pastel-text shadow-sm' : 'text-pastel-muted hover:text-pastel-text'}`}
                >
                  参考图匹配
                </button>
            </div>

            {angleMode === 'PRESET' ? (
                <div>
                   <select 
                      value={anglePreset}
                      onChange={(e) => setAnglePreset(e.target.value)}
                      className="w-full bg-pastel-input border border-pastel-border rounded-lg p-2 text-sm focus:ring-1 focus:ring-pastel-pink outline-none text-pastel-text"
                    >
                      <option value="Driver's View">主驾驶视角 (Driver's View)</option>
                      <option value="Rear Row Perspective">后排视角 (Rear Row Perspective)</option>
                      <option value="Side Open Door View">侧开门视角 (Side Open Door View)</option>
                      <option value="Top Down View">俯视视角 (Top Down View)</option>
                      <option value="Detail Shot of Stitching">细节特写 (Detail Shot)</option>
                    </select>
                </div>
            ) : (
                <div className="relative group cursor-pointer border-2 border-dashed border-pastel-border rounded-lg p-3 transition-colors hover:border-pastel-pink hover:bg-pastel-bg">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAngleRefFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {!angleRefPreview ? (
                    <div className="flex flex-col items-center justify-center py-4 text-pastel-muted">
                      <ImageIcon className="w-6 h-6 mb-2 opacity-50 text-pastel-highlight" />
                      <p className="text-xs">上传想要的实拍角度图</p>
                    </div>
                  ) : (
                     <div className="flex items-center gap-3">
                        <div className="h-16 w-16 rounded bg-gray-100 overflow-hidden border border-pastel-border">
                           <img src={angleRefPreview} alt="Ref" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                           <p className="text-sm font-medium text-pastel-text">角度参考已加载</p>
                           <button onClick={(e) => { e.preventDefault(); setAngleRefFile(null); setAngleRefPreview(null); }} className="text-xs text-red-400 hover:text-red-500 mt-1">
                             移除
                           </button>
                        </div>
                     </div>
                  )}
                </div>
            )}
          </div>

          <div className="border-t border-pastel-border my-6"></div>

          {/* === Section 3: Output Settings === */}
          <div className="mb-8">
            <h3 className="text-pastel-highlight font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-pastel-bg border border-pastel-pink flex items-center justify-center text-[10px] text-pastel-highlight">3</span>
              输出设置
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs text-pastel-muted mb-1 flex items-center gap-1"><Grid className="w-3 h-3" /> 图片比例</label>
                  <select 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full bg-pastel-input border border-pastel-border rounded-lg p-2 text-sm focus:ring-1 focus:ring-pastel-pink outline-none text-pastel-text"
                  >
                    <option value={AspectRatio.SQUARE}>1:1 (亚马逊主图)</option>
                    <option value={AspectRatio.PORTRAIT_9_16}>9:16 (手机/TikTok)</option>
                    <option value={AspectRatio.LANDSCAPE_16_9}>16:9 (横屏/Banner)</option>
                    <option value={AspectRatio.LANDSCAPE_4_3}>4:3 (标准)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs text-pastel-muted mb-1 flex items-center gap-1"><Monitor className="w-3 h-3" /> 画质精度</label>
                  <select 
                    value={qualityMode}
                    onChange={(e) => setQualityMode(e.target.value as ImageResolution)}
                    className="w-full bg-pastel-input border border-pastel-border rounded-lg p-2 text-sm focus:ring-1 focus:ring-pastel-pink outline-none text-pastel-text"
                  >
                    <option value={ImageResolution.RES_1K}>标准 (快速)</option>
                    <option value={ImageResolution.RES_2K}>高清 (HD)</option>
                    <option value={ImageResolution.RES_4K}>超清 4K (商业级/较慢)</option>
                  </select>
               </div>
            </div>
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
            disabled={!seatFile || isGenerating}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${
              !seatFile || isGenerating ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-pastel-pink hover:bg-pastel-pinkhover text-pastel-text'
            }`}
          >
            {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> 正在渲染座舱...</> : <><Sparkles className="w-5 h-5" /> 生成试装效果图</>}
          </button>
        </div>
      </div>

      {/* Right Column: Output */}
      <div className="flex flex-col h-full overflow-hidden">
        <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm flex-1 flex flex-col overflow-hidden">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 flex-shrink-0 text-pastel-text">
            <Eye className="w-5 h-5 text-pastel-highlight" />
            渲染结果 (Gemini 3 Pro)
          </h2>

          <div className="flex-1 bg-pastel-bg rounded-lg border border-pastel-border overflow-hidden relative flex flex-col p-2">
            {generatedImages.length > 0 ? (
               <div className="w-full h-full overflow-y-auto">
                 {generatedImages.map((imgSrc, idx) => (
                    <div key={idx} className="mb-4 last:mb-0">
                        <img src={imgSrc} alt="Seat Fit Result" className="w-full h-auto rounded-lg shadow-sm border border-pastel-border" />
                        <div className="mt-2 text-right">
                           <a href={imgSrc} download={`seat-fit-${carModel}-${Date.now()}.png`} className="text-sm text-pastel-highlight hover:text-pastel-pinkhover inline-flex items-center gap-1 font-medium">
                              下载高清图
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
                     <p className="text-sm">正在计算座舱光影与材质贴合...</p>
                   </>
                 ) : (
                   <>
                     <div className="bg-white p-4 rounded-full mb-4 shadow-sm border border-pastel-border text-pastel-highlight">
                        <CarFront className="w-8 h-8" />
                     </div>
                     <p className="text-sm">试装效果图将显示在这里</p>
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

export default SeatCoverTab;