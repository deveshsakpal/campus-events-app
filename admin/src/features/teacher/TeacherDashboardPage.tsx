import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuth,
  request,
  type AuthResponse,
  type EventItem,
  type EventForm,
} from '../../api/client';
import { Navbar } from '../shared/Navbar';
import { TeacherEventModal } from './components/TeacherEventModal';

export const TeacherDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [teacherUser, setTeacherUser] = useState<AuthResponse | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [filterMode, setFilterMode] = useState<'my' | 'all'>('my');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    const auth = getAuth('TEACHER');
    if (!auth) {
      navigate('/teacher/login');
      return;
    }
    setTeacherUser(auth);
  }, [navigate]);

  const loadEvents = useCallback(async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await request<EventItem[]>('/api/events', token);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (teacherUser?.token) {
      loadEvents(teacherUser.token);
    }
  }, [teacherUser, loadEvents]);

  const handleSaveEvent = async (form: EventForm, eventId: number | null) => {
    if (!teacherUser?.token) return;
    setError('');
    setNotice('');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      venue: form.venue.trim(),
      eventDate: `${form.date}T${form.time}:00`,
    };

    if (eventId === null) {
      await request<EventItem>('/api/events', teacherUser.token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setNotice('Event published successfully.');
    } else {
      await request<EventItem>(`/api/events/${eventId}`, teacherUser.token, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setNotice('Event updated successfully.');
    }

    await loadEvents(teacherUser.token);
  };

  const handleDeleteEvent = async (event: EventItem) => {
    if (!teacherUser?.token) return;

    if (event.createdById !== teacherUser.id) {
      setError('You are only permitted to delete events you created.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      return;
    }

    setError('');
    setNotice('');
    try {
      await request(`/api/events/${event.id}`, teacherUser.token, {
        method: 'DELETE',
      });
      setNotice('Event deleted successfully.');
      await loadEvents(teacherUser.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete event.');
    }
  };

  if (!teacherUser) return null;

  const myEvents = events.filter((e) => e.createdById === teacherUser.id);
  const displayedEvents = filterMode === 'my' ? myEvents : events;

  return (
    <div className="dashboard-layout">
      <Navbar user={teacherUser} onSignOut={() => navigate('/teacher/login')} />

      <main className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Faculty &amp; Teacher Portal</h1>
            <p className="dashboard-subtitle">
              Publish new campus events and manage events created by you.
            </p>
          </div>

          <div className="dashboard-actions">
            <button
              type="button"
              className="btn-primary teacher-btn"
              onClick={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
            >
              + Create New Event
            </button>
          </div>
        </div>

        {notice && <div className="alert-box alert-success">{notice}</div>}
        {error && <div className="alert-box alert-error">{error}</div>}

        <div className="filter-bar">
          <div className="filter-tabs">
            <button
              type="button"
              className={`tab-btn ${filterMode === 'my' ? 'active' : ''}`}
              onClick={() => setFilterMode('my')}
            >
              📌 My Events ({myEvents.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              🌐 All Campus Events ({events.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading events...</p>
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="empty-state">
            {filterMode === 'my' ? (
              <p>
                You have not created any events yet. Click "+ Create New Event" to publish an event for students.
              </p>
            ) : (
              <p>No campus events currently listed.</p>
            )}
          </div>
        ) : (
          <div className="cards-grid">
            {displayedEvents.map((event) => {
              const isOwner = event.createdById === teacherUser.id;

              return (
                <div
                  key={event.id}
                  className={`event-card ${isOwner ? 'event-card-owner' : ''}`}
                >
                  <div className="event-card-header">
                    <h3>{event.title}</h3>
                    {isOwner ? (
                      <span className="owner-badge">Created by You</span>
                    ) : (
                      <span className="creator-tag">
                        By: {event.createdByName ?? 'Admin'}
                      </span>
                    )}
                  </div>

                  <p className="event-description">{event.description}</p>

                  <div className="event-meta">
                    <div className="meta-item">
                      <span className="meta-icon">📍</span>
                      <span>{event.venue}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">🕒</span>
                      <span>
                        {new Date(event.eventDate).toLocaleDateString()} at{' '}
                        {new Date(event.eventDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="card-actions">
                    {isOwner ? (
                      <>
                        <button
                          type="button"
                          className="btn-outline btn-sm"
                          onClick={() => {
                            setEditingEvent(event);
                            setIsEventModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          onClick={() => handleDeleteEvent(event)}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="read-only-notice">
                        🔒 Read-only (Managed by {event.createdByName ?? 'Admin'})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <TeacherEventModal
        isOpen={isEventModalOpen}
        editingEvent={editingEvent}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
      />
    </div>
  );
};
