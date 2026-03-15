import Link from 'next/link';

export default function HomePage(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <h1 className="font-[family-name:var(--font-bebas-neue)] text-6xl text-white">
        DICTATOR SMACKDOWN
      </h1>
      <Link
        href="/select"
        className="mt-10 rounded-xl bg-red-600 px-12 py-4 text-2xl font-bold text-white transition-transform hover:scale-105 active:scale-95"
      >
        START GAME
      </Link>
    </main>
  );
}
