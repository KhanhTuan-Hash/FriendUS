import { ArrowRight } from 'lucide-react';

interface DebtRelation {
  from: string;
  to: string;
  amount: number;
}

interface Props {
  relations: DebtRelation[];
  currentUser?: string;
}

export function DebtGraph({ relations, currentUser = 'You' }: Props) {
  // Get all unique participants
  const participants = Array.from(
    new Set([
      ...relations.map((r) => r.from),
      ...relations.map((r) => r.to)
    ])
  );

  // Calculate positions for participants in a circle
  const getPosition = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    const radius = 120;
    const centerX = 200;
    const centerY = 150;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  // Get avatar for participant
  const getAvatar = (name: string) => {
    const avatars: { [key: string]: string } = {
      'You': '👤',
      'Minh': '👨',
      'Linh': '👩',
      'Tuan': '🧑',
      'Hoa': '👩‍💼'
    };
    return avatars[name] || '👤';
  };

  // Calculate arrow path
  const getArrowPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const offset = 35; // Offset from node center
    
    const startX = from.x + (dx / distance) * offset;
    const startY = from.y + (dy / distance) * offset;
    const endX = to.x - (dx / distance) * offset;
    const endY = to.y - (dy / distance) * offset;

    // Control point for curved arrow
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const perpX = -(endY - startY) / distance * 20;
    const perpY = (endX - startX) / distance * 20;
    const controlX = midX + perpX;
    const controlY = midY + perpY;

    return {
      path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
      labelX: controlX,
      labelY: controlY
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors">
      <h3 className="text-xl mb-4 dark:text-white">Debt Relations Network</h3>
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 overflow-x-auto transition-colors">
        <svg
          width="400"
          height="300"
          viewBox="0 0 400 300"
          className="mx-auto"
          style={{ minWidth: '400px' }}
        >
          {/* Draw arrows first (so they appear behind nodes) */}
          {relations.map((relation, index) => {
            const fromIndex = participants.indexOf(relation.from);
            const toIndex = participants.indexOf(relation.to);
            const fromPos = getPosition(fromIndex, participants.length);
            const toPos = getPosition(toIndex, participants.length);
            const arrow = getArrowPath(fromPos, toPos);

            return (
              <g key={index}>
                {/* Arrow line */}
                <path
                  d={arrow.path}
                  stroke="#ef4444"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  opacity="0.8"
                />
                {/* Amount label */}
                <g transform={`translate(${arrow.labelX}, ${arrow.labelY})`}>
                  <rect
                    x="-35"
                    y="-12"
                    width="70"
                    height="24"
                    fill="white"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    rx="12"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ef4444"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {(relation.amount / 1000).toFixed(0)}k ₫
                  </text>
                </g>
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Draw participant nodes */}
          {participants.map((participant, index) => {
            const pos = getPosition(index, participants.length);
            const isCurrentUser = participant === currentUser;

            return (
              <g key={participant} transform={`translate(${pos.x}, ${pos.y})`}>
                {/* Node circle */}
                <circle
                  r="30"
                  fill={isCurrentUser ? 'url(#blueGradient)' : 'url(#purpleGradient)'}
                  stroke={isCurrentUser ? '#2563eb' : '#9333ea'}
                  strokeWidth="3"
                />
                {/* Avatar emoji */}
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="24"
                  y="2"
                >
                  {getAvatar(participant)}
                </text>
                {/* Name label */}
                <text
                  textAnchor="middle"
                  y="45"
                  className="fill-gray-700 dark:fill-gray-300"
                  fontSize="13"
                  fontWeight={isCurrentUser ? '700' : '600'}
                >
                  {participant}
                </text>
              </g>
            );
          })}

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500" />
            <ArrowRight className="w-6 h-6 text-red-500" />
            <span className="text-gray-600 dark:text-gray-400">Owes money to</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">You</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Others</span>
          </div>
        </div>
      </div>

      {/* Summary text */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Network Summary:</span> The graph shows debt relationships between all group members. 
          Arrows point from the person who owes money to the person who is owed.
        </p>
      </div>
    </div>
  );
}