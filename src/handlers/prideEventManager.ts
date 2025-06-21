import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger } from './logger';

const PRIDE_EVENTS_FILE = join(process.cwd(), 'data', 'pride-events.json');

export interface PrideEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  location?: string;
  organizer?: string;
  url?: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  notificationSent: boolean;
  reminderSent: boolean;
}

// Ensure data directory exists
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

function readEventsData(): PrideEvent[] {
  try {
    if (!existsSync(PRIDE_EVENTS_FILE)) {
      writeFileSync(PRIDE_EVENTS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    
    const data = readFileSync(PRIDE_EVENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error reading pride events data: ${error}`);
    return [];
  }
}

function writeEventsData(events: PrideEvent[]): void {
  try {
    writeFileSync(PRIDE_EVENTS_FILE, JSON.stringify(events, null, 2));
  } catch (error) {
    logger.error(`Error writing pride events data: ${error}`);
  }
}

export function addGlobalPrideEvent(event: Omit<PrideEvent, 'id' | 'createdAt' | 'notificationSent' | 'reminderSent'>): string {
  const events = readEventsData();
  
  const newEvent: PrideEvent = {
    ...event,
    id: `pride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    notificationSent: false,
    reminderSent: false
  };
  
  events.push(newEvent);
  writeEventsData(events);
  
  logger.info(`Added global pride event: ${newEvent.title} on ${newEvent.date}`);
  return newEvent.id;
}

export function removeGlobalPrideEvent(eventId: string): boolean {
  const events = readEventsData();
  const index = events.findIndex(e => e.id === eventId);
  
  if (index === -1) {
    return false;
  }
  
  const removedEvent = events.splice(index, 1)[0];
  writeEventsData(events);
  
  logger.info(`Removed global pride event: ${removedEvent.title}`);
  return true;
}

export function getUpcomingGlobalEvents(daysAhead: number = 30): PrideEvent[] {
  const events = readEventsData();
  const now = new Date();
  const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
  
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= now && eventDate <= futureDate;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getEventsNeedingNotification(): PrideEvent[] {
  const events = readEventsData();
  const now = new Date();
  
  return events.filter(event => {
    const eventDate = new Date(event.date);
    const timeDiff = eventDate.getTime() - now.getTime();
    const hoursUntilEvent = timeDiff / (1000 * 60 * 60);
    
    return !event.notificationSent && hoursUntilEvent <= 2 && hoursUntilEvent > 0;
  });
}

export function getEventsNeedingReminder(): PrideEvent[] {
  const events = readEventsData();
  const now = new Date();
  
  return events.filter(event => {
    const eventDate = new Date(event.date);
    const timeDiff = eventDate.getTime() - now.getTime();
    const hoursUntilEvent = timeDiff / (1000 * 60 * 60);
    
    return !event.reminderSent && hoursUntilEvent <= 25 && hoursUntilEvent > 23;
  });
}

export function markEventNotified(eventId: string): void {
  const events = readEventsData();
  const event = events.find(e => e.id === eventId);
  
  if (event) {
    event.notificationSent = true;
    writeEventsData(events);
  }
}

export function markEventReminded(eventId: string): void {
  const events = readEventsData();
  const event = events.find(e => e.id === eventId);
  
  if (event) {
    event.reminderSent = true;
    writeEventsData(events);
  }
}