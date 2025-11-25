import React from 'react';
import { InventorySlot } from './types';

interface ToolbarProps {
  inventory: InventorySlot[];
  onSelect: (slotId: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ inventory, onSelect }) => {
  return (
    <div 
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* 背景装饰板 - 模仿星露谷的木质/米色背景 */}
      <div className="flex gap-1 p-1 bg-[#E8C089] border-t-2 border-l-2 border-[#FFE0B5] rounded-sm shadow-2xl"
           style={{
             boxShadow: '4px 4px 0px rgba(0,0,0,0.4), inset -2px -2px 0px #B68258'
           }}>
        {inventory.map((slot, index) => (
          <div
            key={slot.id || `slot-${index}`}
            onClick={() => slot.id && onSelect(slot.id)}
            className={`
              relative w-12 h-12 cursor-pointer transition-transform active:scale-95
              flex items-center justify-center
              ${slot.selected 
                ? 'bg-[#FFDFA0] border-4 border-red-500' 
                : 'bg-[#D8A670] border-2 border-[#98643C] hover:bg-[#E6B885]'}
            `}
            style={{
              boxShadow: slot.selected 
                ? '0 0 0 2px #640000' 
                : 'inset 2px 2px 0px rgba(0,0,0,0.2), inset -2px -2px 0px rgba(255,255,255,0.2)'
            }}
          >
            {/* 快捷键数字 */}
            <span className="absolute top-0.5 left-1 text-[10px] font-bold text-[#5D4037] font-mono">
              {index + 1}
            </span>
            
            {/* 物品图标 */}
            <div className="w-10 h-10 flex items-center justify-center">
              {slot.type === 'hoe' && (
                <img src="/homeland/tools/hoe.png" alt="锄头" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
              )}
              {slot.type === 'water' && (
                <img src="/homeland/tools/watering.png" alt="喷壶" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
              )}
              {slot.type === 'seed' && slot.cropType && (
                <img 
                  src={`/homeland/crops/${slot.cropType}.png`} 
                  alt={slot.name} 
                  className="w-full h-full object-contain" 
                  style={{ imageRendering: 'pixelated' }} 
                />
              )}
              {slot.type === 'hand' && (
                <div className="text-2xl">👋</div>
              )}
            </div>

            {/* 数量角标 - 像素风字体感 */}
            {slot.count > 0 && (
              <span className="absolute bottom-0 right-0.5 text-xs font-bold text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)] font-mono">
                {slot.count}
              </span>
            )}
            
            {/* 选中时的光标动画 */}
            {slot.selected && (
              <div className="absolute -top-1 -left-1 -right-1 -bottom-1 border-2 border-white/50 animate-pulse pointer-events-none" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Toolbar;
