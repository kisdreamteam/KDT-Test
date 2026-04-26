import type { CSSProperties } from 'react';

interface SeatingCanvasDecorProps {
  showGrid: boolean;
  showObjects: boolean;
  layoutOrientation: string;
  isTeacherView?: boolean;
  borderClassName?: string;
}

export default function SeatingCanvasDecor({
  showGrid,
  showObjects,
  layoutOrientation,
  isTeacherView = false,
  borderClassName = 'border-gray-800',
}: SeatingCanvasDecorProps) {
  const teacherViewLabelStyle: CSSProperties | undefined = isTeacherView
    ? { display: 'inline-block', transform: 'rotate(-180deg)' }
    : undefined;

  return (
    <>
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(209 213 219) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(209 213 219) 1px, transparent 1px)
            `,
            backgroundSize: '38px 38px',
            zIndex: 0,
          }}
        />
      )}

      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          className={`absolute bg-gray-700 border-2 ${borderClassName} rounded-lg flex items-center justify-center`}
          style={{
            top: '0px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '30px',
            zIndex: 0,
          }}
        >
          <span className="text-white font-semibold text-lg" style={teacherViewLabelStyle}>
            Whiteboard and TV
          </span>
        </div>

        {showObjects && (
          <div
            className={`absolute bg-gray-700 border-2 ${borderClassName} rounded-lg flex items-center justify-center`}
            style={{
              top: '55px',
              ...(layoutOrientation === 'Left' ? { left: '75px' } : { right: '75px' }),
              width: '200px',
              height: '75px',
              zIndex: 0,
            }}
          >
            <span className="text-white font-semibold" style={teacherViewLabelStyle}>
              Teacher's Desk
            </span>
          </div>
        )}
      </div>
    </>
  );
}

