import React, { useState } from 'react';
import { editGeneratedImage, blobToBase64 } from '../services/geminiService';
import { Wand2, Image as ImageIcon, Loader2, Save, AlertCircle, Key } from 'lucide-react';

interface EditorTabProps {
  initialImage: string | null;
}

const getFriendlyErrorMessage = (error: any): string => {
  const message = error.message || JSON.stringify(error);
  if (message.includes('403')) return "权限不足 (403)。请检查您的 API 密钥。";
  if (message.includes('401')) return "身份验证失败 (401)。";
  return `操作失败: ${message.substring(0, 150)}...`;
};

const EditorTab: React.FC<EditorTabProps> = ({ initialImage }) => {
  const [currentImage, setCurrentImage] = useState<string | null>(initialImage);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await blobToBase64(file);
      setCurrentImage(`data:${file.type};base64,${base64}`);
      setError(null);
    }
  };

  const handleEdit = async () => {
    if (!currentImage || !editPrompt) return;
    setIsEditing(true);
    setError(null);
    try {
      const matches = currentImage.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (!matches) throw new Error("无效的图片格式。");
      const resultImages = await editGeneratedImage(matches[2], matches[1], editPrompt);
      if (resultImages.length > 0) {
        setCurrentImage(resultImages[0]);
        setEditPrompt('');
      }
    } catch (error: any) {
      setError(getFriendlyErrorMessage(error));
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="bg-pastel-card p-6 rounded-xl border border-pastel-border shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-pastel-text">
          <Wand2 className="w-5 h-5 text-pastel-highlight" />
          智能修图 (Smart Retouching)
        </h2>
        <p className="text-pastel-muted text-sm mb-6">
          基于 Gemini 2.5 Flash Image。使用自然语言指令快速处理产品图。<br/>
          常用指令：“去除背景”，“在桌面上添加一个咖啡杯”，“将背景改为纯白色”。
        </p>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="relative border-2 border-pastel-border bg-pastel-bg rounded-lg h-96 flex items-center justify-center overflow-hidden">
              {currentImage ? (
                <img src={currentImage} alt="To Edit" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="text-center text-pastel-muted">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30 text-pastel-highlight" />
                  <p>未选择图片。</p>
                  <label className="mt-2 inline-block px-4 py-2 bg-white hover:bg-gray-50 border border-pastel-border rounded-md cursor-pointer text-sm transition-colors text-pastel-highlight shadow-sm">
                    上传图片
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>
            
            {currentImage && (
               <div className="mt-2 text-right">
                  <a href={currentImage} download="edited-image.png" className="text-sm text-pastel-muted hover:text-pastel-highlight flex items-center justify-end gap-1 font-medium">
                    <Save className="w-3 h-3" /> 保存图片
                  </a>
               </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-pastel-text">编辑指令</label>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="在此输入修改要求，例如：Remove the background..."
                className="w-full h-32 bg-pastel-input border border-pastel-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-pastel-pink outline-none resize-none text-pastel-text"
              />
            </div>

            {error && (
               <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-2 text-sm text-red-600">
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
              onClick={handleEdit}
              disabled={!currentImage || !editPrompt || isEditing}
              className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${
                !currentImage || !editPrompt ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                isEditing ? 'bg-pastel-pink cursor-wait' : 'bg-pastel-pink hover:bg-pastel-pinkhover text-pastel-text'
              }`}
            >
              {isEditing ? <><Loader2 className="w-4 h-4 animate-spin" /> 正在处理...</> : '执行智能修改'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorTab;