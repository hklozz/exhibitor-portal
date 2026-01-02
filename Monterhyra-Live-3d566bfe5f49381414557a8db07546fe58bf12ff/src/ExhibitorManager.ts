/*
 * Copyright © 2025 Klozz Holding AB. All rights reserved.
 * MONTERHYRA™ - Proprietary and Confidential
 * Unauthorized copying or distribution is strictly prohibited.
 */

export type MonterSize = 'small' | 'medium' | 'large';

export interface MonterDimensions {
  width: number;   // i meter
  depth: number;   // i meter
  height: number;  // i meter
}

export interface Exhibitor {
  id: string;
  name: string;
  email: string;
  companyName: string;
  contactPerson?: string;
  phone?: string;
  monterSize: MonterSize;
  monterDimensions: MonterDimensions; // actual width/depth/height
  eventId: string;
  token: string;
  inviteLink: string;
  createdAt: Date;
  boothConfig?: {
    furniture: string[];
    decorations: string[];
    customizations: Record<string, any>;
  };
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  exhibitors: Exhibitor[];
  createdAt: Date;
}

// Default dimensions for each monterSize
const DEFAULT_DIMENSIONS: Record<MonterSize, MonterDimensions> = {
  small: { width: 2, depth: 2, height: 2.5 },
  medium: { width: 3, depth: 3, height: 2.5 },
  large: { width: 4, depth: 4, height: 2.5 }
};

class ExhibitorManagerClass {
  private events: Event[] = [];
  private exhibitors: Exhibitor[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('exhibitor-portal-data');
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.events || [];
        this.exhibitors = data.exhibitors || [];
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('exhibitor-portal-data', JSON.stringify({
        events: this.events,
        exhibitors: this.exhibitors,
      }));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }

  // Event methods
  createEvent(name: string, description?: string, startDate?: string, endDate?: string): Event {
    const event: Event = {
      id: `event-${Date.now()}`,
      name,
      description,
      startDate,
      endDate,
      exhibitors: [],
      createdAt: new Date(),
    };
    this.events.push(event);
    this.saveToLocalStorage();
    return event;
  }

  getEvents(): Event[] {
    return this.events;
  }

  getEvent(eventId: string): Event | undefined {
    return this.events.find(e => e.id === eventId);
  }

  deleteEvent(eventId: string): void {
    this.events = this.events.filter(e => e.id !== eventId);
    this.exhibitors = this.exhibitors.filter(ex => ex.eventId !== eventId);
    this.saveToLocalStorage();
  }

  // Exhibitor methods
  addExhibitor(
    eventId: string,
    name: string,
    email: string,
    companyName: string,
    monterSize: MonterSize,
    monterDimensions?: MonterDimensions,
    contactPerson?: string,
    phone?: string
  ): Exhibitor {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const dimensions = monterDimensions || DEFAULT_DIMENSIONS[monterSize];
    
    const exhibitor: Exhibitor = {
      id: `exhibitor-${Date.now()}`,
      name,
      email,
      companyName,
      contactPerson,
      phone,
      monterSize,
      monterDimensions: dimensions,
      eventId,
      token,
      inviteLink: `${typeof window !== 'undefined' ? window.location.origin : ''}/?invite=${token}&monterSize=${monterSize}&width=${dimensions.width}&depth=${dimensions.depth}&height=${dimensions.height}`,
      createdAt: new Date(),
      boothConfig: {
        furniture: [],
        decorations: [],
        customizations: {},
      },
    };

    this.exhibitors.push(exhibitor);

    // Add exhibitor to event
    const event = this.getEvent(eventId);
    if (event) {
      event.exhibitors.push(exhibitor);
    }

    this.saveToLocalStorage();
    return exhibitor;
  }

  getExhibitors(eventId?: string): Exhibitor[] {
    if (eventId) {
      return this.exhibitors.filter(e => e.eventId === eventId);
    }
    return this.exhibitors;
  }

  getExhibitor(exhibitorId: string): Exhibitor | undefined {
    return this.exhibitors.find(e => e.id === exhibitorId);
  }

  getExhibitorByToken(token: string): Exhibitor | undefined {
    return this.exhibitors.find(e => e.token === token);
  }

  deleteExhibitor(exhibitorId: string): void {
    const exhibitor = this.getExhibitor(exhibitorId);
    if (exhibitor) {
      this.exhibitors = this.exhibitors.filter(e => e.id !== exhibitorId);
      
      // Remove from event
      const event = this.getEvent(exhibitor.eventId);
      if (event) {
        event.exhibitors = event.exhibitors.filter(e => e.id !== exhibitorId);
      }
    }
    this.saveToLocalStorage();
  }

  updateExhibitor(exhibitorId: string, updates: Partial<Exhibitor>): Exhibitor | undefined {
    const exhibitor = this.getExhibitor(exhibitorId);
    if (exhibitor) {
      Object.assign(exhibitor, updates);
      this.saveToLocalStorage();
      return exhibitor;
    }
    return undefined;
  }

  getInviteLink(exhibitor: Exhibitor): string {
    return exhibitor.inviteLink;
  }

  // Booth configuration
  saveBoothConfig(
    exhibitorId: string,
    config: {
      furniture: string[];
      decorations: string[];
      customizations: Record<string, any>;
    }
  ): void {
    const exhibitor = this.getExhibitor(exhibitorId);
    if (exhibitor) {
      exhibitor.boothConfig = config;
      this.saveToLocalStorage();
    }
  }

  getBoothConfig(exhibitorId: string) {
    const exhibitor = this.getExhibitor(exhibitorId);
    return exhibitor?.boothConfig;
  }
}

// Export singleton instance
export const ExhibitorManager = new ExhibitorManagerClass();
