import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Agent } from 'https';

const CSV_PATH = path.join(process.cwd(), 'readings.csv');
const OUTPUT_PATH = path.join(process.cwd(), 'src', 'data', 'readings.json');

// Using a custom agent to handle potential SSL issues with older sites or Gutenberg
const httpsAgent = new Agent({ rejectUnauthorized: false });

interface CsvRow {
    Document: string;
    Links: string;
}

interface ReadingOutput {
    id: string;
    title: string;
    author: string;
    content: string;
    url: string;
    wordCount: number;
}

async function fetchAndProcess(url: string): Promise<string[]> {
    try {
        const { data } = await axios.get(url, {
            httpsAgent,
            headers: {
                'User-Agent': 'PhilReader/1.0 (Educational Purpose; contact@example.com)'
            }
        });
        const $ = cheerio.load(data);

        // Remove non-content elements
        $('script, style, nav, footer, header, aside, .advertisement, .mb-4').remove();

        // Heuristics for Project Gutenberg and others
        // Gutenberg often puts the main text in 'body' or specific containers
        // We'll broaden the search
        let $content = $('body');

        // Gutenberg specific cleanup
        $('pre').remove(); // often frontmatter/license
        $('.chapter').each((_, el) => {
            // Keep chapter headers but maybe wrap them? 
        });

        // Extract paragraphs
        const paragraphs: string[] = [];
        $content.find('p, h1, h2, h3, h4').each((_, el) => {
            const tagName = $(el).prop('tagName').toLowerCase();
            const text = $(el).text().trim();
            const html = $(el).html();

            if (!html) return;

            if (tagName.startsWith('h')) {
                paragraphs.push(`<${tagName} class="text-xl font-bold mt-4 mb-2">${text}</${tagName}>`);
            } else if (text.length > 50) { // Filter out tiny snippets/navigation links
                paragraphs.push(`<p>${html}</p>`);
            }
        });

        return paragraphs;
    } catch (error) {
        console.error(`Failed to fetch ${url}`, error);
        return [];
    }
}

function chunkContent(paragraphs: string[], targetWordCount = 2000): string[] {
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentWordCount = 0;

    for (const p of paragraphs) {
        // Rough word count
        const wordCount = p.replace(/<[^>]+>/g, '').split(/\s+/).length;

        if (currentWordCount + wordCount > targetWordCount && currentChunk.length > 0) {
            chunks.push(currentChunk.join(''));
            currentChunk = [];
            currentWordCount = 0;
        }

        currentChunk.push(p);
        currentWordCount += wordCount;
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(''));
    }

    return chunks;
}

async function main() {
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`CSV file not found at ${CSV_PATH}`);
        process.exit(1);
    }

    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    // Allow loose parsing for BOM or mixed separators
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true
    }) as CsvRow[];

    const outputReadings: ReadingOutput[] = [];

    for (const record of records) {
        if (!record.Links) continue;

        // Parse Title and Author from "Author — Title"
        // Separators might be em dash, en dash, or hyphen
        let author = 'Unknown';
        let title = record.Document;

        // Try splitting by common separators
        const separators = ['—', ' – ', ' - '];
        for (const sep of separators) {
            if (record.Document.includes(sep)) {
                const parts = record.Document.split(sep);
                author = parts[0].trim();
                // Rejoin the rest in case title has the separator too (unlikely but safe)
                title = parts.slice(1).join(sep).trim();
                break;
            }
        }

        // Clean up title quotes if present ("Title")
        title = title.replace(/^"|"$/g, '');

        console.log(`Processing: ${title} by ${author}`);
        const paragraphs = await fetchAndProcess(record.Links);

        if (paragraphs.length === 0) {
            console.warn(`Warning: No content found for ${title}`);
            continue;
        }

        const chunks = chunkContent(paragraphs);

        chunks.forEach((chunk, index) => {
            const partTitle = chunks.length > 1 ? `${title} (Part ${index + 1})` : title;
            // Generate a stable ID
            const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const readingId = `${safeTitle}-${index + 1}`;

            const wordCount = chunk.replace(/<[^>]+>/g, '').split(/\s+/).length;

            outputReadings.push({
                id: readingId,
                title: partTitle,
                author: author,
                content: chunk,
                url: record.Links,
                wordCount
            });
        });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputReadings, null, 2));
    console.log(`Generated ${outputReadings.length} readings in ${OUTPUT_PATH}`);
}

main().catch(console.error);
