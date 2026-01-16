import { getReadingForDate } from '@/lib/readings';
import { ReadingView } from '@/components/ReadingView';

export default function Home() {
  const today = new Date();
  const reading = getReadingForDate(today);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <ReadingView reading={reading} />
    </main>
  );
}
