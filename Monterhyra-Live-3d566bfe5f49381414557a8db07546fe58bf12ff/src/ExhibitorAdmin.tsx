import React, { useState } from 'react';
import { ExhibitorManager } from './ExhibitorManager';
import type { Event, Exhibitor, MonterSize } from './ExhibitorManager';

interface ExhibitorAdminProps {
  onClose?: () => void;
}

export const ExhibitorAdmin: React.FC<ExhibitorAdminProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'exhibitors'>('events');
  const [events, setEvents] = useState<Event[]>(ExhibitorManager.getEvents());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(events.length > 0 ? events[0] : null);
  
  // Event creation form
  const [newEventName, setNewEventName] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');

  // Exhibitor creation form
  const [newExhibitorCompany, setNewExhibitorCompany] = useState('');
  const [newExhibitorPerson, setNewExhibitorPerson] = useState('');
  const [newExhibitorEmail, setNewExhibitorEmail] = useState('');
  const [newExhibitorPhone, setNewExhibitorPhone] = useState('');
  const [newExhibitorWidth, setNewExhibitorWidth] = useState('3');
  const [newExhibitorDepth, setNewExhibitorDepth] = useState('3');
  const [newExhibitorHeight, setNewExhibitorHeight] = useState('2.5');

  const handleCreateEvent = () => {
    if (!newEventName.trim()) {
      alert('Fyll i eventnamn');
      return;
    }
    const event = ExhibitorManager.createEvent(
      newEventName,
      newEventDesc,
      newEventStart,
      newEventEnd
    );
    setEvents(ExhibitorManager.getEvents());
    setSelectedEvent(event);
    setNewEventName('');
    setNewEventDesc('');
    setNewEventStart('');
    setNewEventEnd('');
  };

  const handleAddExhibitor = () => {
    if (!selectedEvent) {
      alert('Välj en event först');
      return;
    }
    if (!newExhibitorCompany.trim() || !newExhibitorEmail.trim()) {
      alert('Fyll i företagsnamn och e-post');
      return;
    }

    // Determine monterSize based on dimensions
    const width = parseFloat(newExhibitorWidth);
    const depth = parseFloat(newExhibitorDepth);
    const height = parseFloat(newExhibitorHeight);
    
    let monterSize: MonterSize = 'medium';
    if (width <= 2 && depth <= 2) {
      monterSize = 'small';
    } else if (width >= 4 || depth >= 4) {
      monterSize = 'large';
    }

    const monterDimensions = {
      width: width,
      depth: depth,
      height: height
    };

    ExhibitorManager.addExhibitor(
      selectedEvent.id,
      newExhibitorPerson || newExhibitorCompany,
      newExhibitorEmail,
      newExhibitorCompany,
      monterSize,
      monterDimensions,
      newExhibitorPerson,
      newExhibitorPhone
    );

    setEvents(ExhibitorManager.getEvents());
    setSelectedEvent(ExhibitorManager.getEvent(selectedEvent.id) || null);
    
    // Reset form
    setNewExhibitorCompany('');
    setNewExhibitorPerson('');
    setNewExhibitorEmail('');
    setNewExhibitorPhone('');
    setNewExhibitorWidth('3');
    setNewExhibitorDepth('3');
    setNewExhibitorHeight('2.5');
  };

  const handleDeleteExhibitor = (exhibitorId: string) => {
    if (window.confirm('Är du säker?')) {
      ExhibitorManager.deleteExhibitor(exhibitorId);
      setEvents(ExhibitorManager.getEvents());
      setSelectedEvent(ExhibitorManager.getEvent(selectedEvent?.id || '') || null);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Radera denna event? Detta kan inte ångras.')) {
      ExhibitorManager.deleteEvent(eventId);
      const newEvents = ExhibitorManager.getEvents();
      setEvents(newEvents);
      setSelectedEvent(newEvents.length > 0 ? newEvents[0] : null);
    }
  };

  const copyInviteLink = (exhibitor: Exhibitor) => {
    const link = ExhibitorManager.getInviteLink(exhibitor);
    navigator.clipboard.writeText(link);
    alert('Invite-länk kopierad!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🎪 Exhibitor Portal - Admin</h1>
        {onClose && (
          <button onClick={onClose} style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px' }}>
            Stäng
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('events')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'events' ? '3px solid #3b82f6' : 'none',
            backgroundColor: activeTab === 'events' ? '#f0f9ff' : 'transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px',
            color: activeTab === 'events' ? '#3b82f6' : '#666'
          }}
        >
          📅 Events
        </button>
        <button
          onClick={() => setActiveTab('exhibitors')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'exhibitors' ? '3px solid #3b82f6' : 'none',
            backgroundColor: activeTab === 'exhibitors' ? '#f0f9ff' : 'transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px',
            color: activeTab === 'exhibitors' ? '#3b82f6' : '#666'
          }}
        >
          🏢 Exhibitors
        </button>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ marginTop: 0 }}>Skapa ny event</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Event namn (ex: Göteborgsvarvet Mässa 2025)"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
              />
              <input
                type="text"
                placeholder="Beskrivning"
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
              />
              <input
                type="date"
                value={newEventStart}
                onChange={(e) => setNewEventStart(e.target.value)}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
              />
              <input
                type="date"
                value={newEventEnd}
                onChange={(e) => setNewEventEnd(e.target.value)}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
              />
            </div>
            <button
              onClick={handleCreateEvent}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              ➕ Skapa Event
            </button>
          </div>

          <div>
            <h3>Events ({events.length})</h3>
            {events.length === 0 ? (
              <p style={{ color: '#999' }}>Inga events skapade än</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {events.map(event => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    style={{
                      padding: '16px',
                      border: selectedEvent?.id === event.id ? '2px solid #3b82f6' : '1px solid #dee2e6',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedEvent?.id === event.id ? '#f0f9ff' : '#fff',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0' }}>{event.name}</h4>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
                          📍 {event.startDate} - {event.endDate}
                        </p>
                        <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>
                          👥 {event.exhibitors.length} exhibitors
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.id);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Radera
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exhibitors Tab */}
      {activeTab === 'exhibitors' && (
        <div>
          {!selectedEvent ? (
            <p style={{ color: '#999' }}>Välj en event först</p>
          ) : (
            <>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #dee2e6'
              }}>
                <h3 style={{ marginTop: 0 }}>Lägg till exhibitor - {selectedEvent.name}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Företagsnamn *"
                    value={newExhibitorCompany}
                    onChange={(e) => setNewExhibitorCompany(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <input
                    type="text"
                    placeholder="Kontaktperson"
                    value={newExhibitorPerson}
                    onChange={(e) => setNewExhibitorPerson(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <input
                    type="email"
                    placeholder="E-post *"
                    value={newExhibitorEmail}
                    onChange={(e) => setNewExhibitorEmail(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <input
                    type="tel"
                    placeholder="Telefon"
                    value={newExhibitorPhone}
                    onChange={(e) => setNewExhibitorPhone(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <input
                    type="number"
                    placeholder="Monterbredd (m)"
                    value={newExhibitorWidth}
                    onChange={(e) => setNewExhibitorWidth(e.target.value)}
                    step="0.5"
                    min="1"
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <input
                    type="number"
                    placeholder="Monterdjup (m)"
                    value={newExhibitorDepth}
                    onChange={(e) => setNewExhibitorDepth(e.target.value)}
                    step="0.5"
                    min="1"
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <input
                    type="number"
                    placeholder="Vägg höjd (m)"
                    value={newExhibitorHeight}
                    onChange={(e) => setNewExhibitorHeight(e.target.value)}
                    step="0.5"
                    min="1"
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                </div>
                <button
                  onClick={handleAddExhibitor}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  ➕ Lägg till Exhibitor
                </button>
              </div>

              <div>
                <h3>Exhibitors ({selectedEvent.exhibitors.length})</h3>
                {selectedEvent.exhibitors.length === 0 ? (
                  <p style={{ color: '#999' }}>Inga exhibitors än</p>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {selectedEvent.exhibitors.map(exhibitor => (
                      <div
                        key={exhibitor.id}
                        style={{
                          padding: '16px',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px',
                          backgroundColor: '#fff'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0' }}>{exhibitor.companyName}</h4>
                            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
                              👤 {exhibitor.contactPerson || 'N/A'} | 📧 {exhibitor.email}
                            </p>
                            <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>
                              📏 {exhibitor.monterDimensions.width}m × {exhibitor.monterDimensions.depth}m × {exhibitor.monterDimensions.height}m
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteExhibitor(exhibitor.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                        <div style={{
                          padding: '10px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                          marginBottom: '8px'
                        }}>
                          {ExhibitorManager.getInviteLink(exhibitor)}
                        </div>
                        <button
                          onClick={() => copyInviteLink(exhibitor)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          📋 Kopiera länk
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ExhibitorAdmin;
