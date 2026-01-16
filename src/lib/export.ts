import { ReadingLog, Reading } from './types';

export function downloadCSV(logs: Record<string, ReadingLog>, readings: Reading[]) {
    const headers = ['Date', 'Reading Title', 'Author', 'Status', 'Reflection'];

    const rows = Object.values(logs).map(log => {
        const reading = readings.find(r => r.id === log.readingId);
        return [
            log.date,
            reading ? reading.title : 'Unknown Reading',
            reading ? reading.author : 'Unknown Author',
            log.status,
            // Escape quotes for CSV format
            log.reflection ? `"${log.reflection.replace(/"/g, '""')}"` : ''
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `phil_reader_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
