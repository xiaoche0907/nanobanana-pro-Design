import React, { useState } from 'react';
import { generateListingCopy, blobToBase64 } from '../services/geminiService';
import { FileText, Upload, Copy, Check, Loader2, ShoppingBag, Video, Instagram, AlertCircle, Key } from 'lucide-react';

type Platform = 'Amazon' | 'TikTok' | 'Instagram';

const ListingTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>('Amazon');
  const [keywords, setKeywords] = useState('');
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedCopy('');
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const base64 = await blobToBase64(selectedFile);
      const text = await generateListingCopy(base64, selectedFile.type, platform, keywords);
      setGeneratedCopy(text);
    } catch (err: any) {
      console.error(err);
      setError("生成文案失败，请稍后重试或检查 API 密钥。");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedCopy) {
      navigator.clipboard.writeText(generatedCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-y-auto p-4 md:p-6">
      <div className="space-y-6">
        <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-pastel-text">
            <FileText className="w-5 h-5 text-pastel-highlight" />
            配置文案助手
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
            <label className="block text-sm font-medium text-pastel-muted mb-2">2. 选择发布平台</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPlatform('Amazon')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  platform === 'Amazon' 
                    ? 'bg-pastel-pink text-pastel-text border-pastel-border font-medium shadow-sm' 
                    : 'bg-white border-pastel-border text-pastel-muted hover:bg-pastel-bg'
                }`}
              >
                <ShoppingBag className={`w-5 h-5 mb-1 ${platform === 'Amazon' ? 'text-pastel-text' : 'text-pastel-muted'}`} />
                <span className="text-xs font-medium">Amazon</span>
              </button>
              
              <button
                onClick={() => setPlatform('TikTok')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  platform === 'TikTok' 
                    ? 'bg-pastel-pink text-pastel-text border-pastel-border font-medium shadow-sm' 
                    : 'bg-white border-pastel-border text-pastel-muted hover:bg-pastel-bg'
                }`}
              >
                <Video className={`w-5 h-5 mb-1 ${platform === 'TikTok' ? 'text-pastel-text' : 'text-pastel-muted'}`} />
                <span className="text-xs font-medium">TikTok</span>
              </button>
              
              <button
                onClick={() => setPlatform('Instagram')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  platform === 'Instagram' 
                    ? 'bg-pastel-pink text-pastel-text border-pastel-border font-medium shadow-sm' 
                    : 'bg-white border-pastel-border text-pastel-muted hover:bg-pastel-bg'
                }`}
              >
                <Instagram className={`w-5 h-5 mb-1 ${platform === 'Instagram' ? 'text-pastel-text' : 'text-pastel-muted'}`} />
                <span className="text-xs font-medium">Instagram</span>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-pastel-muted mb-2">3. 核心卖点 / 关键词</label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="输入核心卖点（如：轻便、防水、适合送礼）..."
              className="w-full h-24 bg-pastel-input border border-pastel-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-pastel-pink outline-none resize-none placeholder-pastel-muted text-pastel-text"
            />
          </div>

          {error && (
             <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-2 text-sm text-red-600">
               <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
               </div>
               {error.includes("API 密钥") && (
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
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> 分析并生成文案...</> : '一键生成文案'}
          </button>
        </div>
      </div>

      <div className="flex flex-col h-full overflow-hidden">
        <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-pastel-text">
              <FileText className="w-5 h-5 text-pastel-highlight" />
              文案结果
            </h2>
            {generatedCopy && (
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-pastel-bg hover:bg-white border border-pastel-border rounded-md text-sm text-pastel-highlight transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制' : '复制全文'}
              </button>
            )}
          </div>

          <div className="flex-1 bg-pastel-bg rounded-lg border border-pastel-border overflow-hidden relative">
            {generatedCopy ? (
              <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar">
                <pre className="whitespace-pre-wrap font-sans text-sm text-pastel-text leading-relaxed">
                  {generatedCopy}
                </pre>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-pastel-muted p-8">
                 {isLoading ? (
                   <>
                     <div className="w-12 h-12 border-4 border-pastel-pink border-t-pastel-highlight rounded-full animate-spin mb-4"></div>
                     <p className="text-sm">正在分析产品图并撰写文案...</p>
                   </>
                 ) : (
                   <>
                     <div className="bg-white p-4 rounded-full mb-4 opacity-70 shadow-sm border border-pastel-border">
                        <FileText className="w-8 h-8 text-pastel-highlight" />
                     </div>
                     <p className="text-sm">生成的文案将显示在这里</p>
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

export default ListingTab;