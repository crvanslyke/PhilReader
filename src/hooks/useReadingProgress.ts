'use client';

import { useState, useEffect } from 'react';
import { ReadingLog } from '@/lib/types';

const STORAGE_KEY = 'philreader_progress_v1';

export function useReadingProgress() {
    const [logs, setLogs] = useState<Record<string, ReadingLog>>({});
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const item = window.localStorage.getItem(STORAGE_KEY);
            if (item) {
                setLogs(JSON.parse(item));
            }
        } catch (error) {
            console.error('Failed to load progress', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const saveToStorage = (newLogs: Record<string, ReadingLog>) => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
        } catch (error) {
            console.error('Failed to save progress', error);
        }
    };

    const markAsRead = (readingId: string) => {
        const today = new Date().toISOString().split('T')[0];
        const newLogs = {
            ...logs,
            [readingId]: {
                ...logs[readingId],
                date: today,
                readingId,
                status: 'completed' as const,
            },
        };
        setLogs(newLogs);
        saveToStorage(newLogs);
    };

    const saveReflection = (readingId: string, reflection: string) => {
        const today = new Date().toISOString().split('T')[0];
        const existingLog = logs[readingId] || {
            date: today,
            readingId,
            status: 'unread',
        };

        const newLogs = {
            ...logs,
            [readingId]: {
                ...existingLog,
                reflection,
            },
        };
        setLogs(newLogs);
        saveToStorage(newLogs);
    };

    const getLog = (readingId: string) => logs[readingId];

    return {
        logs,
        isLoaded,
        markAsRead,
        saveReflection,
        getLog,
    };
}
