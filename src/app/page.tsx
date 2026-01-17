import { getReadingForDate } from '@/lib/readings';
import { ReadingView } from '@/components/ReadingView';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <ReadingView />
    </main>
  );
}
