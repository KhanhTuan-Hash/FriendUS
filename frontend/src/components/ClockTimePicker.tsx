import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ClockTimePickerProps {
  value: string; // Format: "HH:MM"
  onChange: (time: string) => void;
}

export function ClockTimePicker({ value, onChange }: ClockTimePickerProps) {
  const [hours, setHours] = useState(parseInt(value.split(':')[0]) || 9);
  const [minutes, setMinutes] = useState(parseInt(value.split(':')[1]) || 0);
  const [isDragging, setIsDragging] = useState<'hour' | 'minute' | null>(null);
  const clockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    onChange(formattedTime);
  }, [hours, minutes]);

  const handleMouseDown = (type: 'hour' | 'minute') => {
    setIsDragging(type);
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !clockRef.current) return;

    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;

    if (isDragging === 'hour') {
      const newHour = Math.round((angle / 360) * 12);
      setHours(newHour === 0 ? 12 : newHour);
    } else if (isDragging === 'minute') {
      const newMinute = Math.round((angle / 360) * 60);
      setMinutes(newMinute === 60 ? 0 : newMinute);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp as any);
      return () => window.removeEventListener('mouseup', handleMouseUp as any);
    }
  }, [isDragging]);

  const handleHourInput = (val: string) => {
    const num = parseInt(val) || 0;
    if (num >= 0 && num <= 23) {
      setHours(num);
    }
  };

  const handleMinuteInput = (val: string) => {
    const num = parseInt(val) || 0;
    if (num >= 0 && num <= 59) {
      setMinutes(num);
    }
  };

  const hourAngle = ((hours % 12) / 12) * 360 - 90;
  const minuteAngle = (minutes / 60) * 360 - 90;

  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    const [h, m] = timeValue.split(':');
    if (h && m) {
      const hourNum = parseInt(h);
      const minuteNum = parseInt(m);
      if (hourNum >= 0 && hourNum <= 23 && minuteNum >= 0 && minuteNum <= 59) {
        setHours(hourNum);
        setMinutes(minuteNum);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Clock Display */}
      <div
        ref={clockRef}
        className="relative w-48 h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full border-4 border-blue-200 dark:border-blue-700 shadow-lg select-none"
        onMouseMove={handleMouseMove}
      >
        {/* Hour markers */}
        {[...Array(12)].map((_, i) => {
          const hourNumber = i === 0 ? 12 : i;
          const angle = (i / 12) * 360;
          const radius = 40; // Increased radius to prevent touching the hands
          const x = 50 + radius * Math.sin((angle * Math.PI) / 180);
          const y = 50 - radius * Math.cos((angle * Math.PI) / 180);
          
          return (
            <div
              key={i}
              className="absolute text-sm font-bold text-gray-700 dark:text-gray-300 select-none"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {hourNumber}
            </div>
          );
        })}

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20 shadow-md" />

        {/* Hour hand */}
        <div
          className="absolute top-1/2 left-1/2 origin-left cursor-grab active:cursor-grabbing"
          style={{
            width: '40px',
            height: '5px',
            backgroundColor: '#3B82F6',
            transform: `translate(0, -2.5px) rotate(${hourAngle}deg)`,
            borderRadius: '3px',
            transition: isDragging === 'hour' ? 'none' : 'transform 0.2s ease',
          }}
          onMouseDown={() => handleMouseDown('hour')}
        >
          <div className="absolute right-0 top-1/2 w-3 h-3 bg-blue-600 rounded-full transform -translate-y-1/2 shadow-lg border-2 border-white" />
        </div>

        {/* Minute hand */}
        <div
          className="absolute top-1/2 left-1/2 origin-left cursor-grab active:cursor-grabbing"
          style={{
            width: '60px',
            height: '3px',
            backgroundColor: '#8B5CF6',
            transform: `translate(0, -1.5px) rotate(${minuteAngle}deg)`,
            borderRadius: '2px',
            transition: isDragging === 'minute' ? 'none' : 'transform 0.2s ease',
          }}
          onMouseDown={() => handleMouseDown('minute')}
        >
          <div className="absolute right-0 top-1/2 w-3 h-3 bg-purple-600 rounded-full transform -translate-y-1/2 shadow-lg border-2 border-white" />
        </div>
      </div>

      {/* Editable Time Display */}
      <div className="flex items-center gap-3">
        <div className="bg-white dark:bg-gray-700 px-4 py-2 rounded-lg shadow-md border-2 border-gray-200 dark:border-gray-600">
          <input
            type="time"
            value={`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`}
            onChange={handleTimeInput}
            className="text-xl font-bold text-gray-900 dark:text-white bg-transparent outline-none w-24 cursor-text"
          />
        </div>
        
        {/* AM/PM Toggle */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setHours(hours >= 12 ? hours - 12 : hours + 12)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              hours >= 12
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            PM
          </button>
          <button
            onClick={() => setHours(hours >= 12 ? hours - 12 : hours)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              hours < 12
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            AM
          </button>
        </div>
      </div>
    </div>
  );
}