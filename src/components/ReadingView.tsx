'use client';

import { useState, useEffect } from 'react';
import { Reading } from '@/lib/types';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle, Download } from 'lucide-react';
import { downloadCSV } from '@/lib/export';
import { getAllReadings } from '@/lib/readings';

interface ReadingViewProps {
    reading: Reading;
}

export function ReadingView({ reading }: ReadingViewProps) {
    const { isLoaded, logs, getLog, markAsRead, saveReflection } = useReadingProgress();
    const [reflectionText, setReflectionText] = useState('');

    // Load existing reflection when data is ready
    useEffect(() => {
        if (isLoaded) {
            const log = getLog(reading.id);
            if (log?.reflection) {
                setReflectionText(log.reflection);
            }
        }
    }, [isLoaded, reading.id, getLog]);

    if (!isLoaded) {
        return <div className="p-8 text-center text-muted-foreground">Loading progress...</div>;
    }

    const log = getLog(reading.id);
    const isCompleted = log?.status === 'completed';

    const handleComplete = () => {
        markAsRead(reading.id);
    };

    const handleReflectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setReflectionText(text);
        saveReflection(reading.id, text);
    };

    const handleExport = () => {
        downloadCSV(logs, getAllReadings());
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-8 pb-32">
            <header className="space-y-2 text-center py-8">
                <div className="text-sm uppercase tracking-widest text-muted-foreground">Daily Reading</div>
                <h1 className="text-3xl font-serif font-medium">{reading.title}</h1>
                <p className="text-lg text-muted-foreground font-serif italic">{reading.author}</p>
            </header>

            <div className="prose prose-lg dark:prose-invert mx-auto font-serif leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: reading.content }} />
            </div>

            <div className="pt-12 space-y-6">
                <div className="flex justify-center">
                    <Button
                        size="lg"
                        onClick={handleComplete}
                        variant={isCompleted ? "outline" : "default"}
                        className={isCompleted ? "text-green-600 border-green-200 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30" : ""}
                    >
                        {isCompleted ? (
                            <>
                                <CheckCircle2 className="mr-2 h-5 w-5" /> Completed
                            </>
                        ) : (
                            <>
                                <Circle className="mr-2 h-5 w-5" /> Mark as Read
                            </>
                        )}
                    </Button>
                </div>

                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-lg">Reflection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="What are your thoughts on today's reading?"
                            className="min-h-[150px] bg-background resize-none border-muted-foreground/20 focus-visible:ring-1"
                            value={reflectionText}
                            onChange={handleReflectionChange}
                        />
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground justify-between">
                        <span>Changes are saved automatically to your device.</span>
                    </CardFooter>
                </Card>

                <div className="flex justify-center pt-8 border-t border-muted/40">
                    <Button variant="ghost" size="sm" onClick={handleExport} className="text-muted-foreground hover:text-foreground">
                        <Download className="mr-2 h-4 w-4" /> Export Reading History
                    </Button>
                </div>
            </div>
        </div>
    );
}
