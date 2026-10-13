import React from 'react'
import {
  X,
  Type,
  Gauge,
  Volume2,
  Layers,
  Wand2,
  Move,
  Activity,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react'
import type { TimelineClip, TextStylePreset, BlendMode, VFXEffectType, MotionAnimationType } from '../types/editor'

interface InspectorProps {
  clip: TimelineClip | null
  onClose: () => void
  onUpdateClip: (clipId: string, updates: Partial<TimelineClip>) => void
}

export const Inspector: React.FC<InspectorProps> = ({
  clip,
  onClose,
  onUpdateClip
}) => {
  if (!clip) return null

  const handleTextPropChange = (key: string, value: any) => {
    onUpdateClip(clip.id, {
      textProps: {
        ...(clip.textProps as any),
        [key]: value
      }
    })
  }

  const handleChromaChange = (key: string, value: any) => {
    onUpdateClip(clip.id, {
      chromaKey: {
        enabled: clip.chromaKey?.enabled ?? false,
        color: clip.chromaKey?.color ?? '#00ff00',
        similarity: clip.chromaKey?.similarity ?? 45,
        smoothness: clip.chromaKey?.smoothness ?? 15,
        [key]: value
      }
    })
  }

  const handleTransformChange = (key: string, value: number) => {
    onUpdateClip(clip.id, {
      transform: {
        x: clip.transform?.x ?? 0,
        y: clip.transform?.y ?? 0,
        scale: clip.transform?.scale ?? 1,
        rotation: clip.transform?.rotation ?? 0,
        [key]: value
      }
    })
  }

  return (
    <div className="w-80 bg-[#12141c] border-l border-slate-800 flex flex-col select-none z-20">
      {/* Header */}
      <div className="h-10 px-3.5 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300 bg-[#0e1017]">
        <div className="flex items-center space-x-2">
          {clip.type === 'text' && <Type className="w-3.5 h-3.5 text-purple-400" />}
          {clip.type === 'video' && <Layers className="w-3.5 h-3.5 text-indigo-400" />}
          {clip.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-pink-400" />}
          {clip.type === 'audio' && <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{clip.type === 'image' ? '사진 & 스티커 속성' : '클립 & CG 속성 설정'}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Basic Clip Info */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">클립 이름</label>
          <input
            type="text"
            value={clip.name}
            onChange={(e) => onUpdateClip(clip.id, { name: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Time Info */}
        <div className="grid grid-cols-2 gap-2 bg-slate-800/30 p-2.5 rounded-lg border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 block">시작 시간</span>
            <span className="font-mono text-slate-300 font-semibold">{clip.startTime.toFixed(2)}s</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">재생 길이</span>
            <span className="font-mono text-slate-300 font-semibold">{clip.duration.toFixed(2)}s</span>
          </div>
        </div>

        {/* Image Duration Slider */}
        {clip.type === 'image' && (
          <div className="space-y-1 bg-slate-800/20 p-2.5 rounded-lg border border-slate-700/40">
            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span>사진 표시 시간 (길이)</span>
              <span className="font-mono text-indigo-400">{clip.duration.toFixed(1)}초</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              value={clip.duration}
              onChange={(e) => onUpdateClip(clip.id, { duration: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        )}

        {/* ===================== CG & VFX SECTION FOR VIDEO / IMAGE ===================== */}
        {(clip.type === 'video' || clip.type === 'image') && (
          <div className="space-y-4 pt-1 border-t border-slate-800">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-400">
              <Wand2 className="w-4 h-4" />
              <span>CG 특수효과 및 합성</span>
            </div>

            {/* 1. CHROMA KEY (Green Screen) */}
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">🟢 크로마키 (배경색 제거)</span>
                  <span className="text-[10px] text-slate-400">초록/파랑 스크린을 투명하게 제거</span>
                </div>
                <button
                  onClick={() => handleChromaChange('enabled', !clip.chromaKey?.enabled)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                    clip.chromaKey?.enabled
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {clip.chromaKey?.enabled ? '사용 중' : '꺼짐'}
                </button>
              </div>

              {clip.chromaKey?.enabled && (
                <div className="space-y-2.5 pt-2 border-t border-slate-700/50">
                  {/* Key Color */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">제거할 색상</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleChromaChange('color', '#00ff00')}
                        className={`w-5 h-5 rounded-full border ${clip.chromaKey.color === '#00ff00' ? 'ring-2 ring-white' : ''}`}
                        style={{ backgroundColor: '#00ff00' }}
                        title="초록색 스크린"
                      />
                      <button
                        onClick={() => handleChromaChange('color', '#0000ff')}
                        className={`w-5 h-5 rounded-full border ${clip.chromaKey.color === '#0000ff' ? 'ring-2 ring-white' : ''}`}
                        style={{ backgroundColor: '#0000ff' }}
                        title="파란색 스크린"
                      />
                      <input
                        type="color"
                        value={clip.chromaKey.color || '#00ff00'}
                        onChange={(e) => handleChromaChange('color', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border border-slate-600 bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Similarity threshold */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>색상 민감도 (Similarity)</span>
                      <span className="font-mono text-emerald-400">{clip.chromaKey.similarity || 45}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={clip.chromaKey.similarity || 45}
                      onChange={(e) => handleChromaChange('similarity', Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Smoothness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>가장자리 부드러움 (Smoothness)</span>
                      <span className="font-mono text-emerald-400">{clip.chromaKey.smoothness || 15}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={clip.chromaKey.smoothness || 15}
                      onChange={(e) => handleChromaChange('smoothness', Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. TRANSFORM (SCALE, ROTATION, POSITION) */}
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 space-y-3">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-200">
                <Move className="w-3.5 h-3.5 text-indigo-400" />
                <span>CG 오브젝트 크기 & 위치 변형 (Transform)</span>
              </div>

              {/* Scale */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>크기 확대/축소 (Scale)</span>
                  <span className="font-mono text-indigo-400">{Math.round((clip.transform?.scale || 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  value={clip.transform?.scale || 1}
                  onChange={(e) => handleTransformChange('scale', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Rotation */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>각도 회전 (Rotation)</span>
                  <span className="font-mono text-indigo-400">{clip.transform?.rotation || 0}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={clip.transform?.rotation || 0}
                  onChange={(e) => handleTransformChange('rotation', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Position X / Y */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>가로 위치 (X)</span>
                    <span className="font-mono">{clip.transform?.x || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={clip.transform?.x || 0}
                    onChange={(e) => handleTransformChange('x', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>세로 위치 (Y)</span>
                    <span className="font-mono">{clip.transform?.y || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={clip.transform?.y || 0}
                    onChange={(e) => handleTransformChange('y', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. BLEND MODE */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400">블렌드 합성 모드</label>
              <select
                value={clip.blendMode || 'source-over'}
                onChange={(e) => onUpdateClip(clip.id, { blendMode: e.target.value as BlendMode })}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="source-over">일반 겹치기 (Normal)</option>
                <option value="screen">스크린 - 검은 배경 투명화 (Screen)</option>
                <option value="lighter">더하기 - 빛 발광 효과 (Add / Lighter)</option>
                <option value="multiply">곱하기 - 어두운 그림자 합성 (Multiply)</option>
                <option value="overlay">오버레이 - 강렬한 대비 (Overlay)</option>
                <option value="difference">차이 - 색상 반전 (Difference)</option>
              </select>
            </div>

            {/* 4. VFX & MOTION */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  VFX 파티클
                </label>
                <select
                  value={clip.vfxEffect || 'none'}
                  onChange={(e) => onUpdateClip(clip.id, { vfxEffect: e.target.value as VFXEffectType })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-1.5 text-slate-200 text-xs"
                >
                  <option value="none">없음</option>
                  <option value="sparks">🔥 불꽃 파티클</option>
                  <option value="glitch">⚡ 글리치/RGB</option>
                  <option value="snow">❄️ 눈 내림</option>
                  <option value="rain">🌧️ 빗줄기</option>
                  <option value="light_leak">☀️ 렌즈 빛번짐</option>
                  <option value="laser_grid">🌐 사이버 그리드</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-pink-400" />
                  카메라 모션
                </label>
                <select
                  value={clip.motion || 'none'}
                  onChange={(e) => onUpdateClip(clip.id, { motion: e.target.value as MotionAnimationType })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-1.5 text-slate-200 text-xs"
                >
                  <option value="none">없음</option>
                  <option value="shake">💥 타격감 쉐이크</option>
                  <option value="pulse">💓 펄스 비트</option>
                  <option value="float">🎈 둥둥 부유</option>
                  <option value="spin">🔄 무한 회전</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TEXT CLIP PROPERTIES */}
        {clip.type === 'text' && clip.textProps && (
          <div className="space-y-4 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">자막 내용</label>
              <textarea
                value={clip.textProps.text}
                onChange={(e) => handleTextPropChange('text', e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">스타일 프리셋</label>
              <select
                value={clip.textProps.stylePreset}
                onChange={(e) => handleTextPropChange('stylePreset', e.target.value as TextStylePreset)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="youtube">유튜브 강조 자막 (노란 볼드)</option>
                <option value="box">넷플릭스 박스 (블랙 박스)</option>
                <option value="neon">사이버 네온 (발광 효과)</option>
                <option value="meme">임팩트 밈 스타일</option>
                <option value="simple">깔끔한 미니멀</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-pink-400" />
                자막 모션 애니메이션
              </label>
              <select
                value={clip.motion || 'none'}
                onChange={(e) => onUpdateClip(clip.id, { motion: e.target.value as MotionAnimationType })}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 text-xs"
              >
                <option value="none">모션 없음</option>
                <option value="shake">💥 타격감 쉐이크</option>
                <option value="pulse">💓 펄스 비트</option>
                <option value="float">🎈 둥둥 부유</option>
                <option value="spin">🔄 무한 회전</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[11px] font-semibold text-slate-400">글자 크기</span>
                <span className="font-mono text-slate-500">{clip.textProps.fontSize}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="96"
                value={clip.textProps.fontSize}
                onChange={(e) => handleTextPropChange('fontSize', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">글자 색상</label>
                <input
                  type="color"
                  value={clip.textProps.color}
                  onChange={(e) => handleTextPropChange('color', e.target.value)}
                  className="w-full h-8 bg-slate-900 border border-slate-700 rounded cursor-pointer p-0.5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">정렬</label>
                <select
                  value={clip.textProps.textAlign}
                  onChange={(e) => handleTextPropChange('textAlign', e.target.value)}
                  className="w-full h-8 bg-slate-900 border border-slate-700 rounded px-1.5 text-slate-200 text-xs"
                >
                  <option value="left">왼쪽</option>
                  <option value="center">가운데</option>
                  <option value="right">오른쪽</option>
                </select>
              </div>
            </div>

            {/* Position Y (Top / Middle / Bottom) */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[11px] font-semibold text-slate-400">화면 위치 (Y)</span>
                <span className="font-mono text-slate-500">{clip.textProps.posY}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={clip.textProps.posY}
                onChange={(e) => handleTextPropChange('posY', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        )}

        {/* BASIC PLAYBACK PROPERTIES */}
        {(clip.type === 'video' || clip.type === 'audio') && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            {clip.type === 'video' && (
              <div className="space-y-1.5">
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>재생 배속</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[0.5, 1, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => onUpdateClip(clip.id, { playbackRate: rate })}
                      className={`py-1 rounded text-xs font-mono transition ${
                        (clip.playbackRate || 1) === rate
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>음량 (볼륨)</span>
                </div>
                <button
                  onClick={() => onUpdateClip(clip.id, { muted: !clip.muted })}
                  className={`text-[11px] px-1.5 py-0.5 rounded ${
                    clip.muted ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {clip.muted ? '음소거 됨' : '음소거'}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={clip.muted}
                value={clip.volume ?? 1}
                onChange={(e) => onUpdateClip(clip.id, { volume: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
