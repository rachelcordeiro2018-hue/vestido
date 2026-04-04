import React, { useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

const CanvasElement = ({
  x = 0, y = 0, scale = 1,
  onUpdate,
  isSelected,
  onSelect,
  children,
  style,
  zoomFactor = 1,
  mode = 'translate', // 'translate' | 'absolute'
  className,
  isImageWrapper = false, // specific handling for the background images
  isExporting = false
}) => {
  const containerRef = useRef(null);
  
  // Track latest props for native event listeners without re-binding
  const propsRef = useRef({ x, y, scale, onUpdate, isSelected });
  propsRef.current = { x, y, scale, onUpdate, isSelected };

  // Native wheel event with passive: false to prevent page scrolling!
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isImageWrapper) return;

    const handleNativeWheel = (e) => {
      const { isSelected, scale, onUpdate, x, y } = propsRef.current;
      if (!isSelected) return;
      
      e.preventDefault(); // This is the magic bullet to stop page scroll
      e.stopPropagation();
      
      const newScale = Math.max(0.1, scale - e.deltaY * 0.0012);
      onUpdate(x, y, newScale);
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleNativeWheel);
  }, [isImageWrapper]);

  const draggingState = useRef({
    pointers: new Map(),
    type: 'none',
    startX: 0,
    startY: 0,
    startObjX: 0,
    startObjY: 0,
    initialDist: 0,
    initialScale: 1
  });

  const handlePointerDown = (e) => {
    if (e.target.closest('.resize-handle') || isExporting) return;
    
    e.stopPropagation();
    onSelect();

    if (e.pointerType === 'touch') {
      try { e.target.setPointerCapture(e.pointerId); } catch(err){}
    }

    draggingState.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (draggingState.current.pointers.size === 1) {
      draggingState.current.type = 'translate';
      draggingState.current.startX = e.clientX;
      draggingState.current.startY = e.clientY;
      draggingState.current.startObjX = x;
      draggingState.current.startObjY = y;
      
      const onPointerMove = (moveEvent) => {
        const state = draggingState.current;
        state.pointers.set(moveEvent.pointerId, { x: moveEvent.clientX, y: moveEvent.clientY });

        if (state.pointers.size === 1 && state.type === 'translate') {
          const dx = (moveEvent.clientX - state.startX) / zoomFactor;
          const dy = (moveEvent.clientY - state.startY) / zoomFactor;
          
          if (mode === 'translate') {
            const visualDx = dx / scale;
            const visualDy = dy / scale;
            onUpdate(state.startObjX + visualDx, state.startObjY + visualDy, scale);
          } else {
            onUpdate(state.startObjX + dx, state.startObjY + dy, scale);
          }
        } else if (state.pointers.size === 2) {
          const ids = Array.from(state.pointers.keys());
          const p1 = state.pointers.get(ids[0]);
          const p2 = state.pointers.get(ids[1]);
          const currentDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (state.type !== 'pinch') {
            state.type = 'pinch';
            state.initialDist = currentDist;
            state.initialScale = propsRef.current.scale;
          } else {
            const scaleChange = currentDist / state.initialDist;
            const newScale = Math.max(0.1, state.initialScale * scaleChange);
            onUpdate(propsRef.current.x, propsRef.current.y, newScale);
          }
        }
      };

      const onPointerUp = (upEvent) => {
        const state = draggingState.current;
        state.pointers.delete(upEvent.pointerId);

        if (upEvent && upEvent.pointerId && upEvent.pointerType === 'touch') {
          try { upEvent.target.releasePointerCapture(upEvent.pointerId); } catch(err){}
        }

        if (state.pointers.size === 0) {
          state.type = 'none';
          document.removeEventListener('pointermove', onPointerMove);
          document.removeEventListener('pointerup', onPointerUp);
          document.removeEventListener('pointercancel', onPointerUp);
        } else if (state.pointers.size === 1) {
          // If we went from 2 to 1 finger, reset translation start point to avoid jumping
          state.type = 'translate';
          const remainingId = Array.from(state.pointers.keys())[0];
          const p = state.pointers.get(remainingId);
          state.startX = p.x;
          state.startY = p.y;
          state.startObjX = propsRef.current.x;
          state.startObjY = propsRef.current.y;
        }
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
    } else if (draggingState.current.pointers.size === 2) {
      // Second finger added - pinch logic initialized in onPointerMove
    }
  };

  const handleResizePointerDown = (e, corner) => {
    if (isExporting) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();

    if (e.pointerType === 'touch') {
      try { e.target.setPointerCapture(e.pointerId); } catch(err){}
    }

    const startY = e.clientY;
    const startScale = scale;

    const onPointerMove = (moveEvent) => {
      const dy = (startY - moveEvent.clientY) / zoomFactor;
      const newScale = Math.max(0.1, startScale + (dy * 0.005));
      onUpdate(x, y, newScale);
    };

    const onPointerUp = (upEvent) => {
      if (upEvent && upEvent.pointerId && upEvent.pointerType === 'touch') {
        try { upEvent.target.releasePointerCapture(upEvent.pointerId); } catch(err){}
      }
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  };

  const renderHandle = (corner, posClasses) => (
    <div 
      className={`resize-handle absolute w-8 h-8 md:w-6 md:h-6 bg-red-600 rounded-full border-[3px] border-white shadow-xl z-50 transition-transform hover:scale-125 touch-action-none ${posClasses}`}
      onPointerDown={(e) => handleResizePointerDown(e, corner)}
    />
  );

  if (isImageWrapper) {
    return (
      <div 
        ref={containerRef}
        style={{ ...style, cursor: isSelected && !isExporting ? 'move' : 'pointer', touchAction: 'none' }}
        className={cn("w-full h-full relative group overflow-hidden pointer-events-auto", className)}
        onPointerDown={handlePointerDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="absolute pointer-events-none overflow-hidden"
          style={{ 
            width: `${scale * 100}%`, 
            height: `${scale * 100}%`,
            left: `${x}px`,
            top: `${y}px`,
            // If scale is 1 and x/y is 0, it fills parent perfectly
          }}
        >
          {children}
        </div>
        
        {/* Frame Highlight - Only show when NOT exporting */}
        {!isExporting && (
          <>
            <div className={cn(
              "absolute inset-0 pointer-events-none transition-all z-40",
              isSelected ? "outline outline-[6px] outline-red-600 outline-offset-[-6px] bg-red-600/10 shadow-inner" : "group-hover:outline group-hover:outline-[6px] group-hover:outline-red-400 group-hover:outline-offset-[-6px] group-hover:bg-red-400/5"
            )} />
            
            {isSelected && (
              <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none z-50">
                <div className="bg-red-600/90 text-white px-3 py-2 rounded-full shadow-2xl backdrop-blur-sm border 2 border-red-400 text-xs font-bold flex items-center gap-2 pointer-events-auto">
                   <span className="opacity-80">ZOOM:</span>
                   
                   <button 
                      onPointerDown={(e) => e.stopPropagation()} 
                      onClick={() => onUpdate(x, y, Math.max(0.2, scale - 0.05))}
                      className="w-6 h-6 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full cursor-pointer transition-colors font-black"
                   >-</button>
    
                   <input 
                     type="range" 
                     min="0.2" max="3" step="0.01" 
                     value={scale} 
                     onChange={(e) => onUpdate(x, y, parseFloat(e.target.value))}
                     onPointerDown={(e) => e.stopPropagation()}
                     className="w-20 accent-white pointer-events-auto cursor-ew-resize"
                   />
    
                   <button 
                      onPointerDown={(e) => e.stopPropagation()} 
                      onClick={() => onUpdate(x, y, Math.min(3, scale + 0.05))}
                      className="w-6 h-6 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full cursor-pointer transition-colors font-black"
                   >+</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Text/Absolute mode Elements
  return (
    <div 
      ref={containerRef}
      style={{ 
        ...style,
        cursor: isSelected && !isExporting ? 'move' : 'pointer',
        fontSize: `${scale}em`, 
        touchAction: 'none' // Prevent pull-down refresh on mobile while dragging text
      }}
      className={cn(
        "absolute pointer-events-auto transition-shadow group shrink-0",
        isSelected && !isExporting ? "outline outline-2 outline-dashed outline-red-600 z-50" : (!isExporting ? "hover:outline hover:outline-2 hover:outline-dashed hover:outline-red-400 z-40" : ""),
        className
      )}
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pointer-events-none w-full h-full">
        {children}
      </div>
      
      {isSelected && !isExporting && (
        <div className="absolute inset-0 pointer-events-none min-w-[50px] min-h-[50px]">
          {renderHandle('tl', '-top-4 -left-4 md:-top-3 md:-left-3 cursor-nwse-resize pointer-events-auto')}
          {renderHandle('tr', '-top-4 -right-4 md:-top-3 md:-right-3 cursor-nesw-resize pointer-events-auto')}
          {renderHandle('bl', '-bottom-4 -left-4 md:-bottom-3 md:-left-3 cursor-nesw-resize pointer-events-auto')}
          {renderHandle('br', '-bottom-4 -right-4 md:-bottom-3 md:-right-3 cursor-nwse-resize pointer-events-auto')}
        </div>
      )}
    </div>
  );
};

export default CanvasElement;
