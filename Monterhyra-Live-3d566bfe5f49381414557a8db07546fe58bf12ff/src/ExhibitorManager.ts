/**
 * ExhibitorManager - Hanterar exhibitors/customers och deras monterdata
 */

export interface MonterSize {
  width: number;  // meter
  depth: number;  // meter
  height: number; // meter (vägg höjd)
}

export interface Exhibitor {
  id: string;
  eventId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  monterSize: MonterSize;
  inviteToken: string; // Unik länk-token
  orderData?: any; // Sparad monte-design
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  exhibitors: Exhibitor[];
  createdAt: string;
  updatedAt: string;
}

class ExhibitorManagerClass {
  private static instance: ExhibitorManagerClass;
  private storageKey = 'exhibitor_portal_data';
  private data: { events: Event[] } = { events: [] };

  constructor() {
    this.loadFromStorage();
  }

  static getInstance(): ExhibitorManagerClass {
    if (!ExhibitorManagerClass.instance) {
      ExhibitorManagerClass.instance = new ExhibitorManagerClass();
    }
    return ExhibitorManagerClass.instance;
  }

  /**
   * Ladda data från localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.data = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Fel vid laddning av exhibitor data:', error);
    }
  }

  /**
   * Spara data till localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.error('Fel vid sparning av exhibitor data:', error);
    }
  }

  /**
   * Skapa ny event
   */
  createEvent(name: string, description: string, startDate: string, endDate: string): Event {
    const event: Event = {
      id: `event_${Date.now()}`,
      name,
      description,
      startDate,
      endDate,
      exhibitors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.events.push(event);
    this.saveToStorage();
    return event;
  }

  /**
   * Hämta alla events
   */
  getEvents(): Event[] {
    return this.data.events;
  }

  /**
   * Hämta event med ID
   */
  getEvent(eventId: string): Event | undefined {
    return this.data.events.find(e => e.id === eventId);
  }

  /**
   * Lägg till exhibitor till event
   */
  addExhibitor(
    eventId: string,
    companyName: string,
    contactPerson: string,
    email: string,
    phone: string,
    monterSize: MonterSize
  ): Exhibitor {
    const event = this.getEvent(eventId);
    if (!event) throw new Error(`Event ${eventId} inte funnen`);

    const exhibitor: Exhibitor = {
      id: `exhibitor_${Date.now()}`,
      eventId,
      companyName,
      contactPerson,
      email,
      phone,
      monterSize,
      inviteToken: this.generateToken(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    event.exhibitors.push(exhibitor);
    this.saveToStorage();
    return exhibitor;
  }

  /**
   * Hämta alla exhibitors för en event
   */
  getExhibitors(eventId: string): Exhibitor[] {
    const event = this.getEvent(eventId);
    return event ? event.exhibitors : [];
  }

  /**
   * Hämta exhibitor med ID
   */
  getExhibitor(exhibitorId: string): Exhibitor | undefined {
    for (const event of this.data.events) {
      const exhibitor = event.exhibitors.find(e => e.id === exhibitorId);
      if (exhibitor) return exhibitor;
    }
    return undefined;
  }

  /**
   * Hämta exhibitor via invite-token
   */
  getExhibitorByToken(token: string): Exhibitor | undefined {
    for (const event of this.data.events) {
      const exhibitor = event.exhibitors.find(e => e.inviteToken === token);
      if (exhibitor) return exhibitor;
    }
    return undefined;
  }

  /**
   * Uppdatera exhibitor
   */
  updateExhibitor(exhibitorId: string, updates: Partial<Exhibitor>): Exhibitor {
    const exhibitor = this.getExhibitor(exhibitorId);
    if (!exhibitor) throw new Error(`Exhibitor ${exhibitorId} inte funnen`);

    Object.assign(exhibitor, updates, { updatedAt: new Date().toISOString() });
    this.saveToStorage();
    return exhibitor;
  }

  /**
   * Spara monte-design för exhibitor
   */
  saveMonteDesign(exhibitorId: string, orderData: any): Exhibitor {
    return this.updateExhibitor(exhibitorId, { orderData });
  }

  /**
   * Radera exhibitor
   */
  deleteExhibitor(exhibitorId: string): boolean {
    for (const event of this.data.events) {
      const index = event.exhibitors.findIndex(e => e.id === exhibitorId);
      if (index !== -1) {
        event.exhibitors.splice(index, 1);
        this.saveToStorage();
        return true;
      }
    }
    return false;
  }

  /**
   * Radera event
   */
  deleteEvent(eventId: string): boolean {
    const index = this.data.events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      this.data.events.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Generera unik invite-token
   */
  private generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generera invite-länk
   */
  getInviteLink(exhibitor: Exhibitor): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/exhibitor/${exhibitor.inviteToken}`;
  }

  /**
   * Exportera exhibitor-data till JSON (för backup)
   */
  exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Importera exhibitor-data från JSON
   */
  importData(jsonData: string): void {
    try {
      const imported = JSON.parse(jsonData);
      if (imported.events && Array.isArray(imported.events)) {
        this.data = imported;
        this.saveToStorage();
      } else {
        throw new Error('Ogiltigt data-format');
      }
    } catch (error) {
      console.error('Fel vid import:', error);
      throw error;
    }
  }
}

// Singleton
export const ExhibitorManager = new ExhibitorManagerClass();

// Also export the class for type checking
export { ExhibitorManagerClass };
