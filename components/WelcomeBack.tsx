'use client';

interface WelcomeBackProps {
  displayName: string;
  currentStreak: number;
  onDismiss: () => void;
}

export default function WelcomeBack({
  displayName,
  currentStreak,
  onDismiss,
}: WelcomeBackProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-bebas-neue)] text-xl text-yellow-400">
            Welcome back, {displayName}!
          </h3>
          {currentStreak > 0 && (
            <p className="text-sm text-gray-400">
              Win streak: {currentStreak}
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-white"
          aria-label="Dismiss welcome banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
