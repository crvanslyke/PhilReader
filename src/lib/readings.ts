import readingsData from '@/data/readings.json';
import { Reading } from './types';

const readings: Reading[] = readingsData as Reading[];

export function getAllReadings(): Reading[] {
    return readings;
}

export function getReadingForDate(date: Date): Reading {
    if (readings.length === 0) {
        throw new Error('No readings available');
    }

    // Use a fixed epoch to ensure consistency
    const epoch = new Date('2024-01-01T00:00:00Z');

    // Reset input date to midnight UTC to avoid timezone shifts affecting the index
    const targetDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    const msPerDay = 24 * 60 * 60 * 1000;
    const diffTime = targetDate.getTime() - epoch.getTime();
    const daysSinceEpoch = Math.floor(diffTime / msPerDay);

    // Handle negative difference if date is before epoch
    const positiveIndex = daysSinceEpoch >= 0
        ? daysSinceEpoch
        : (readings.length - (Math.abs(daysSinceEpoch) % readings.length));

    const index = positiveIndex % readings.length;

    return readings[index];
}
