interface ChallengePageProps {
  params: Promise<{ id: string }>;
}

export default async function ChallengePage({
  params,
}: ChallengePageProps): Promise<React.JSX.Element> {
  const { id } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="font-[family-name:var(--font-bebas-neue)] text-4xl">
        Challenge
      </h1>
      <p className="mt-4 text-gray-600">Challenge ID: {id}</p>
    </main>
  );
}
