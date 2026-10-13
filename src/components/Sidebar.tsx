import React, { useState } from 'react'
import {
  FolderPlus,
  Type,
  Sliders,
  Music,
  Upload,
  Plus,
  Sparkles,
  Volume2,
  Trash2,
  PlaySquare,
  HelpCircle,
  Wand2,
  Zap,
  Activity,
  Image as ImageIcon
} from 'lucide-react'
import type { MediaItem, TextStylePreset, VideoFilters, TimelineClip, VFXEffectType, MotionAnimationType, BlendMode } from '../types/editor'
import { generateDemoVideo, generateDemoAudio, generateDemoImage } from '../utils/sampleGenerator'

interface SidebarProps {
  mediaLibrary: MediaItem[]
  onAddMedia: (media: MediaItem) => void
  onDeleteMedia: (id: string) => void
  onAddClipToTimeline: (type: 'video' | 'text' | 'audio' | 'image', options?: any) => void
  selectedClip: TimelineClip | null
  onUpdateClip: (clipId: string, updates: Partial<TimelineClip>) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  mediaLibrary,
  onAddMedia,
  onDeleteMedia,
  onAddClipToTimeline,
  selectedClip,
  onUpdateClip
}) => {
  const [activeTab, setActiveTab] = useState<'media' | 'text' | 'cg' | 'filters' | 'audio' | 'help'>('cg')
  const [isGenerating, setIsGenerating] = useState(false)
  const [customText, setCustomText] = useState('자막 내용을 입력하세요')
  const [selectedPreset, setSelectedPreset] = useState<TextStylePreset>('youtube')

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file)
      const type = file.type.startsWith('video')
        ? 'video'
        : file.type.startsWith('audio')
        ? 'audio'
        : 'image'

      if (type === 'video') {
        const v = document.createElement('video')
        v.src = url
        v.onloadedmetadata = () => {
          onAddMedia({
            id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            type: 'video',
            url,
            duration: v.duration || 5,
            width: v.videoWidth,
            height: v.videoHeight
          })
        }
      } else if (type === 'audio') {
        const a = new Audio(url)
        a.onloadedmetadata = () => {
          onAddMedia({
            id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            type: 'audio',
            url,
            duration: a.duration || 10
          })
        }
      } else {
        const img = new Image()
        img.src = url
        img.onload = () => {
          onAddMedia({
            id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            type: 'image',
            url,
            thumbnailUrl: url,
            duration: 4,
            width: img.width,
            height: img.height
          })
        }
      }
    })
    e.target.value = ''
  }

  // Generate demo clip
  const handleGenerateSample = async (type: 'synthwave' | 'gradient' | 'countdown' | 'greenscreen') => {
    setIsGenerating(true)
    try {
      const sample = await generateDemoVideo(type, 5)
      onAddMedia(sample)
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate demo BGM
  const handleGenerateBgm = async () => {
    setIsGenerating(true)
    try {
      const audioSample = await generateDemoAudio(10)
      onAddMedia(audioSample)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddTextClip = () => {
    onAddClipToTimeline('text', {
      text: customText,
      preset: selectedPreset
    })
  }

  // VFX / Motion quick apply
  const applyVFX = (effect: VFXEffectType) => {
    if (!selectedClip) return
    onUpdateClip(selectedClip.id, { vfxEffect: effect })
  }

  const applyMotion = (motion: MotionAnimationType) => {
    if (!selectedClip) return
    onUpdateClip(selectedClip.id, { motion })
  }

  const applyBlendMode = (blend: BlendMode) => {
    if (!selectedClip) return
    onUpdateClip(selectedClip.id, { blendMode: blend })
  }

  const toggleChromaKey = (enable: boolean) => {
    if (!selectedClip) return
    onUpdateClip(selectedClip.id, {
      chromaKey: {
        enabled: enable,
        color: selectedClip.chromaKey?.color || '#00ff00',
        similarity: selectedClip.chromaKey?.similarity || 45,
        smoothness: selectedClip.chromaKey?.smoothness || 15
      }
    })
  }

  const currentFilters: VideoFilters = selectedClip?.filters || {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0
  }

  const handleFilterChange = (key: keyof VideoFilters, value: number) => {
    if (!selectedClip) return
    onUpdateClip(selectedClip.id, {
      filters: {
        ...currentFilters,
        [key]: value
      }
    })
  }

  const applyPresetFilter = (preset: 'vintage' | 'cinematic' | 'vivid' | 'bw' | 'reset') => {
    if (!selectedClip) return
    let f: VideoFilters = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0 }
    if (preset === 'vintage') {
      f = { brightness: 105, contrast: 90, saturation: 80, grayscale: 0, sepia: 40, blur: 0 }
    } else if (preset === 'cinematic') {
      f = { brightness: 95, contrast: 125, saturation: 110, grayscale: 0, sepia: 10, blur: 0 }
    } else if (preset === 'vivid') {
      f = { brightness: 110, contrast: 115, saturation: 150, grayscale: 0, sepia: 0, blur: 0 }
    } else if (preset === 'bw') {
      f = { brightness: 100, contrast: 120, saturation: 0, grayscale: 100, sepia: 0, blur: 0 }
    }
    onUpdateClip(selectedClip.id, { filters: f })
  }

  return (
    <div className="w-80 bg-[#12141c] border-r border-slate-800 flex flex-col select-none z-20">
      {/* Tab navigation */}
      <div className="flex border-b border-slate-800 bg-[#0e1017]">
        <button
          onClick={() => setActiveTab('cg')}
          className={`flex-1 py-3 text-xs font-semibold flex flex-col items-center gap-1 border-b-2 transition ${
            activeTab === 'cg'
              ? 'border-indigo-500 text-indigo-400 bg-slate-800/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
          title="CG 합성 및 VFX 특수효과"
        >
          <Wand2 className="w-4 h-4 text-purple-400" />
          <span className="text-[11px]">CG / VFX</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-3 text-xs font-semibold flex flex-col items-center gap-1 border-b-2 transition ${
            activeTab === 'media'
              ? 'border-indigo-500 text-indigo-400 bg-slate-800/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span className="text-[11px]">미디어</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-3 text-xs font-semibold flex flex-col items-center gap-1 border-b-2 transition ${
            activeTab === 'text'
              ? 'border-indigo-500 text-indigo-400 bg-slate-800/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <Type className="w-4 h-4" />
          <span className="text-[11px]">자막</span>
        </button>

        <button
          onClick={() => setActiveTab('filters')}
          className={`flex-1 py-3 text-xs font-semibold flex flex-col items-center gap-1 border-b-2 transition ${
            activeTab === 'filters'
              ? 'border-indigo-500 text-indigo-400 bg-slate-800/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span className="text-[11px]">필터</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 py-3 text-xs font-semibold flex flex-col items-center gap-1 border-b-2 transition ${
            activeTab === 'audio'
              ? 'border-indigo-500 text-indigo-400 bg-slate-800/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <Music className="w-4 h-4" />
          <span className="text-[11px]">음악</span>
        </button>

        <button
          onClick={() => setActiveTab('help')}
          className={`py-3 px-2 text-xs font-semibold flex flex-col items-center gap-1 border-b-2 transition ${
            activeTab === 'help'
              ? 'border-indigo-500 text-indigo-400 bg-slate-800/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
          title="단축키"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 0: CG & VFX */}
        {activeTab === 'cg' && (
          <div className="space-y-4">
            {/* Green Screen Demo Generator */}
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>크로마키(그린스크린) CG 테스트 클립</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                초록색 배경을 완벽하게 제거하여 다른 영상 위에 합성할 수 있는 3D 사이버 오브젝트 클립을 생성합니다.
              </p>
              <button
                disabled={isGenerating}
                onClick={() => handleGenerateSample('greenscreen')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-900/40 transition"
              >
                <span>🟢 크로마키 CG 오브젝트 생성</span>
                <span className="text-[10px] bg-emerald-700/80 px-1 rounded">5s</span>
              </button>
            </div>

            {/* Selected Clip CG Quick Controls */}
            {selectedClip ? (
              <div className="space-y-4 border border-slate-800 bg-slate-900/40 p-3 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">선택된 클립:</span>
                  <span className="font-semibold text-indigo-400 truncate max-w-[140px]">{selectedClip.name}</span>
                </div>

                {/* Chroma Key Toggle */}
                {selectedClip.type === 'video' && (
                  <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        크로마키 (초록 배경 제거)
                      </span>
                      <button
                        onClick={() => toggleChromaKey(!selectedClip.chromaKey?.enabled)}
                        className={`text-xs px-2 py-0.5 rounded font-bold transition ${
                          selectedClip.chromaKey?.enabled
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {selectedClip.chromaKey?.enabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                )}

                {/* VFX Particle Effects */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    VFX 파티클 & 오버레이
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      { id: 'sparks', name: '🔥 불꽃 불티' },
                      { id: 'glitch', name: '⚡ 글리치/RGB' },
                      { id: 'snow', name: '❄️ 시네마틱 눈' },
                      { id: 'rain', name: '🌧️ 감성 빗줄기' },
                      { id: 'light_leak', name: '☀️ 렌즈 빛번짐' },
                      { id: 'laser_grid', name: '🌐 사이버 그리드' },
                      { id: 'none', name: '🚫 이펙트 해제' }
                    ].map((vfx) => (
                      <button
                        key={vfx.id}
                        onClick={() => applyVFX(vfx.id as VFXEffectType)}
                        className={`py-2 px-2 rounded-lg border text-left font-medium transition ${
                          (selectedClip.vfxEffect || 'none') === vfx.id
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                        }`}
                      >
                        {vfx.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Motion Animations */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-pink-400" />
                    카메라 모션 애니메이션
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      { id: 'shake', name: '💥 타격감 쉐이크' },
                      { id: 'pulse', name: '💓 펄스 비트' },
                      { id: 'float', name: '🎈 둥둥 부유' },
                      { id: 'spin', name: '🔄 무한 회전' },
                      { id: 'none', name: '🚫 모션 해제' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => applyMotion(m.id as MotionAnimationType)}
                        className={`py-2 px-2 rounded-lg border text-left font-medium transition ${
                          (selectedClip.motion || 'none') === m.id
                            ? 'bg-pink-600 text-white border-pink-400 shadow-sm'
                            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blend Modes */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">합성 블렌드 모드</span>
                  <div className="grid grid-cols-3 gap-1 text-[11px]">
                    {[
                      { id: 'source-over', name: '일반 (Normal)' },
                      { id: 'screen', name: '스크린 (Screen)' },
                      { id: 'lighter', name: '더하기 (Add)' },
                      { id: 'multiply', name: '곱하기 (Multiply)' },
                      { id: 'overlay', name: '오버레이' },
                      { id: 'difference', name: '반전 차이' }
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => applyBlendMode(b.id as BlendMode)}
                        className={`py-1.5 px-1 rounded border text-center font-mono transition ${
                          (selectedClip.blendMode || 'source-over') === b.id
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-white'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl p-4">
                타임라인에서 클립을 선택하면<br />
                <span className="text-indigo-400 font-semibold">크로마키 / VFX 파티클 / 모션 / 블렌드</span> 효과를<br />
                원클릭으로 적용할 수 있습니다.
              </div>
            )}
          </div>
        )}

        {/* TAB 1: MEDIA */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-800/30 hover:bg-slate-800/60 group">
              <Upload className="w-7 h-7 text-indigo-400 group-hover:scale-110 transition mb-2" />
              <span className="text-xs font-semibold text-slate-200">
                내 컴퓨터에서 영상/음악 추가
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                MP4, WebM, MOV, MP3, WAV
              </span>
              <input
                type="file"
                multiple
                accept="video/*,audio/*,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>테스트용 무료 샘플 영상 생성</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                <button
                  disabled={isGenerating}
                  onClick={() => handleGenerateSample('greenscreen')}
                  className="w-full py-2 px-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 rounded-lg text-xs font-medium flex items-center justify-between border border-emerald-500/40 transition"
                >
                  <span>🟢 크로마키 CG 오브젝트</span>
                  <span className="text-[10px] text-emerald-400 font-mono">5s</span>
                </button>
                <button
                  disabled={isGenerating}
                  onClick={() => handleGenerateSample('synthwave')}
                  className="w-full py-2 px-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-medium flex items-center justify-between border border-slate-700/60 transition"
                >
                  <span>🌆 레트로 신스웨이브 클립</span>
                  <span className="text-[10px] text-indigo-400 font-mono">5s</span>
                </button>
                <button
                  disabled={isGenerating}
                  onClick={() => handleGenerateSample('countdown')}
                  className="w-full py-2 px-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-medium flex items-center justify-between border border-slate-700/60 transition"
                >
                  <span>⏱️ 모던 카운트다운 타이머</span>
                  <span className="text-[10px] text-indigo-400 font-mono">5s</span>
                </button>
                <button
                  onClick={() => onAddMedia(generateDemoImage('badge'))}
                  className="w-full py-2 px-2.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 rounded-lg text-xs font-medium flex items-center justify-between border border-purple-500/40 transition"
                >
                  <span>⭐ VIP 홀로그램 스티커 사진</span>
                  <span className="text-[10px] text-purple-400 font-mono">PNG</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>보관함 ({mediaLibrary.length})</span>
              </div>

              {mediaLibrary.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  등록된 미디어가 없습니다.<br />파일을 업로드하거나 샘플을 생성해보세요.
                </div>
              ) : (
                <div className="space-y-2">
                  {mediaLibrary.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition group"
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt=""
                            className="w-12 h-8 rounded object-cover bg-black flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-8 rounded bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                            {item.type === 'video' ? (
                              <PlaySquare className="w-4 h-4 text-slate-400" />
                            ) : item.type === 'image' ? (
                              <ImageIcon className="w-4 h-4 text-purple-400" />
                            ) : (
                              <Volume2 className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {item.type === 'image' ? '이미지/사진' : `${item.duration.toFixed(1)}초`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => onAddClipToTimeline(item.type, { media: item })}
                          title="타임라인에 추가"
                          className="p-1.5 rounded-md bg-indigo-600/80 hover:bg-indigo-600 text-white transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteMedia(item.id)}
                          title="삭제"
                          className="p-1.5 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TEXT */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">자막 내용</label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                placeholder="화면에 표시할 자막을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">자막 스타일 프리셋</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'youtube', name: '유튜브 하이라이트', preview: '노란 볼드' },
                  { id: 'box', name: '넷플릭스 박스', preview: '블랙 박스' },
                  { id: 'neon', name: '사이버 네온', preview: '네온 발광' },
                  { id: 'meme', name: '임팩트 밈', preview: '굵은 외곽선' },
                  { id: 'simple', name: '깔끔한 미니멀', preview: '그림자 텍스트' }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id as TextStylePreset)}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      selectedPreset === preset.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-medium">{preset.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{preset.preview}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddTextClip}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>현재 위치에 자막 추가</span>
            </button>
          </div>
        )}

        {/* TAB 3: FILTERS */}
        {activeTab === 'filters' && (
          <div className="space-y-4">
            {!selectedClip || selectedClip.type !== 'video' ? (
              <div className="text-center py-10 text-xs text-slate-500 border border-slate-800 rounded-xl p-4">
                타임라인에서 비디오 클립을 먼저 선택해주세요.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs font-semibold text-slate-300">
                  선택된 클립: <span className="text-indigo-400">{selectedClip.name}</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">원클릭 색감 프리셋</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => applyPresetFilter('cinematic')}
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700/60 transition"
                    >
                      🎬 시네마틱
                    </button>
                    <button
                      onClick={() => applyPresetFilter('vivid')}
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700/60 transition"
                    >
                      🌈 비비드
                    </button>
                    <button
                      onClick={() => applyPresetFilter('vintage')}
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700/60 transition"
                    >
                      ☕ 빈티지
                    </button>
                    <button
                      onClick={() => applyPresetFilter('bw')}
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700/60 transition"
                    >
                      ⚪ 흑백 모노
                    </button>
                    <button
                      onClick={() => applyPresetFilter('reset')}
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[11px] border border-slate-700/60 col-span-2 transition"
                    >
                      🔄 기본값 초기화
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>밝기 (Brightness)</span>
                      <span className="font-mono">{currentFilters.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={currentFilters.brightness}
                      onChange={(e) => handleFilterChange('brightness', Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>대비 (Contrast)</span>
                      <span className="font-mono">{currentFilters.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={currentFilters.contrast}
                      onChange={(e) => handleFilterChange('contrast', Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>채도 (Saturation)</span>
                      <span className="font-mono">{currentFilters.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={currentFilters.saturation}
                      onChange={(e) => handleFilterChange('saturation', Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>블러 효과 (Blur)</span>
                      <span className="font-mono">{currentFilters.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={currentFilters.blur}
                      onChange={(e) => handleFilterChange('blur', Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AUDIO */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-400">
                <Music className="w-3.5 h-3.5" />
                <span>무료 Lo-Fi 배경음악 생성</span>
              </div>
              <p className="text-[11px] text-slate-400">
                저작권 걱정 없는 브라우저 즉석 신디사이저 칠(Chill) BGM을 생성합니다.
              </p>
              <button
                disabled={isGenerating}
                onClick={handleGenerateBgm}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lo-Fi BGM 생성하기</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: HELP */}
        {activeTab === 'help' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-200">단축키 모음 (Shortcuts)</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-slate-800/40 border border-slate-800">
                <span className="text-slate-300">재생 / 일시정지</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-indigo-400">Space</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-800/40 border border-slate-800">
                <span className="text-slate-300">클립 자르기 (분할)</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-indigo-400">S</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-800/40 border border-slate-800">
                <span className="text-slate-300">선택 클립 삭제</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-rose-400">Delete / Backspace</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-800/40 border border-slate-800">
                <span className="text-slate-300">1프레임 이전 / 다음</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-indigo-400">← / →</kbd>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
