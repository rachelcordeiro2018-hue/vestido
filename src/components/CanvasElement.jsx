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
  isImageWrapper = false // specific handling for the background images
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

  const pointersRef = useRef(new Map());
  const dragStartRef = useRef(null);

  const handlePointerDown = (e) => {
    // If clicking a resize handle, ignore drag
    if (e.target?.closest?.('.resize-handle')) return;
    
    e.stopPropagation();
    onSelect();

    // For touch devices, preventDefault stops scrolling while dragging
    if (e.pointerType === 'touch') {
      try { e.target.setPointerCapture(e.pointerId); } catch(err){}
    }

    const { x: currentX, y: currentY, scale: currentScale } = propsRef.current;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
        dragStartRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startObjX: currentX,
            startObjY: currentY
        };
    } 
    else if (pointersRef.current.size === 2 && isImageWrapper) {
        const ptrs = Array.from(pointersRef.current.values());
        dragStartRef.current.initialPinchDist = Math.hypot(ptrs[0].x - ptrs[1].x, ptrs[0].y - ptrs[1].y);
        dragStartRef.current.initialScale = currentScale;
    }

    const onPointerMove = (moveEvent) => {
      if (!pointersRef.current.has(moveEvent.pointerId)) return;
      pointersRef.current.set(moveEvent.pointerId, { x: moveEvent.clientX, y: moveEvent.clientY });

      if (pointersRef.current.size === 2 && isImageWrapper) {
         const ptrs = Array.from(pointersRef.current.values());
         const dist = Math.hypot(ptrs[0].x - ptrs[1].x, ptrs[0].y - ptrs[1].y);
         const scaleMultiplier = dist / dragStartRef.current.initialPinchDist;
         const newScale = Math.max(0.1, dragStartRef.current.initialScale * scaleMultiplier);
         propsRef.current.onUpdate(propsRef.current.x, propsRef.current.y, newScale);
      } 
      else if (pointersRef.current.size === 1) {
         const dx = (moveEvent.clientX - dragStartRef.current.startX) / zoomFactor;
         const dy = (moveEvent.clientY - dragStartRef.current.startY) / zoomFactor;
         const { scale } = propsRef.current;
         
         if (mode === 'translate') {
           const visualDx = dx / scale;
           const visualDy = dy / scale;
           propsRef.current.onUpdate(
               dragStartRef.current.startObjX + visualDx, 
               dragStartRef.current.startObjY + visualDy, 
               scale
           );
         } else {
           propsRef.current.onUpdate(
               dragStartRef.current.startObjX + dx, 
               dragStartRef.current.startObjY + dy, 
               scale
           );
         }
      }
    };

    const onPointerUp = (upEvent) => {
      if (upEvent && upEvent.pointerId) {
        pointersRef.current.delete(upEvent.pointerId);
        try { upEvent.target.releasePointerCapture(upEvent.pointerId); } catch(err){}
      }
      
      // Recalibrate arrasto se um dedo for solto e sobrar outro
      if (pointersRef.current.size === 1) {
          const remainingPtr = Array.from(pointersRef.current.values())[0];
          dragStartRef.current = {
              startX: remainingPtr.x,
              startY: remainingPtr.y,
              startObjX: propsRef.current.x,
              startObjY: propsRef.current.y
          };
      }

      if (pointersRef.current.size === 0) {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);
      }
    };

    if (pointersRef.current.size === 1) {
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);
    }
  };

  const handleResizePointerDown = (e, corner) => {
    e.stopPropagation();
    e.preventDefault(); // prevent native behavior
    onSelect();

    if (e.pointerType === 'touch') {
      try { e.target.setPointerCapture(e.pointerId); } catch(err){}
    }

    const startY = e.clientY;
    const startScale = scale;

    const onPointerMove = (moveEvent) => {
      // Move up (negative delta) means scale UP 
      // Move down (positive delta) means scale DOWN
      const dy = (startY - moveEvent.clientY) / zoomFactor;
      const newScale = Math.max(0.1, startScale + (dy * 0.005));
      onUpdate(x, y, newScale);
    };

    const onPointerUp = (upEvent) => {
      if (upEvent && upEvent.pointerId) {
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
        style={{ ...style, cursor: isSelected ? 'move' : 'pointer', touchAction: 'none' }}
        className={cn("w-full h-full relative group overflow-hidden pointer-events-auto", className)}
        onPointerDown={handlePointerDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="w-full h-full absolute inset-0 pointer-events-none"
          style={{ transform: `scale(${scale}) translate(${x}px, ${y}px)` }}
        >
          {children}
        </div>
        
        {/* Frame Highlight */}
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
      </div>
    );
  }

  // Text/Absolute mode Elements
  return (
    <div 
      ref={containerRef}
      style={{ 
        ...style,
        cursor: isSelected ? 'move' : 'pointer',
        transform: `scale(${scale})`, 
        transformOrigin: 'bottom left',
        touchAction: 'none' // Prevent pull-down refresh on mobile while dragging text
      }}
      className={cn(
        "absolute pointer-events-auto transition-shadow group shrink-0",
        isSelected ? "outline outline-2 outline-dashed outline-red-600 z-50" : "hover:outline hover:outline-2 hover:outline-dashed hover:outline-red-400 z-40",
        className
      )}
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pointer-events-none w-full h-full">
        {children}
      </div>
      
      {isSelected && (
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
