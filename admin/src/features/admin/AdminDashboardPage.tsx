import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuth,
  request,
  type AuthResponse,
  type EventItem,
  type TeacherItem,
  type EventForm,
} from '../../api/client';
import { Navbar } from '../shared/Navbar';
import { AdminEventModal } from './components/AdminEventModal';
import { AdminTeacherModal } from './components/AdminTeacherModal';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AuthResponse | null>(null);

  const [activeTab, setActiveTab] = useState<'events' | 'teachers'>('events');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  useEffect(() => {
    const auth = getAuth('ADMIN');
    if (!auth) {
      navigate('/admin/login');
      return;
    }
    setAdminUser(auth);
  }, [navigate]);

  const loadData = useCallback(async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const [eventsData, teachersData] = await Promise.all([
        request<EventItem[]>('/api/events', token),
        request<TeacherItem[]>('/api/admin/teachers', token),
      ]);
      setEvents(eventsData);
      setTeachers(teachersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminUser?.token) {
      loadData(adminUser.token);
    }
  }, [adminUser, loadData]);

  const handleSaveEvent = async (form: EventForm, eventId: number | null) => {
    if (!adminUser?.token) return;
    setError('');
    setNotice('');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      venue: form.venue.trim(),
      eventDate: `${form.date}T${form.time}:00`,
    };

    if (eventId === null) {
      await request<EventItem>('/api/events', adminUser.token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setNotice('Event created successfully.');
    } else {
      await request<EventItem>(`/api/events/${eventId}`, adminUser.token, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setNotice('Event updated successfully.');
    }

    await loadData(adminUser.token);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!adminUser?.token) return;
    if (!window.confirm('Are you sure you want to delete this event? All student registrations for it will also be cleared.')) {
      return;
    }

    setError('');
    setNotice('');
    try {
      await request(`/api/events/${eventId}`, adminUser.token, {
        method: 'DELETE',
      });
      setNotice('Event deleted successfully.');
      await loadData(adminUser.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete event.');
    }
  };

  const handleSaveTeacher = async (teacherData: { name: string; email: string; password: string }) => {
    if (!adminUser?.token) return;
    setError('');
    setNotice('');

    await request<TeacherItem>('/api/admin/teachers', adminUser.token, {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
    setNotice(`Teacher account created for ${teacherData.name}.`);
    await loadData(adminUser.token);
  };

  const handleDeleteTeacher = async (teacher: TeacherItem) => {
    if (!adminUser?.token) return;
    if (!window.confirm(`Are you sure you want to remove teacher ${teacher.name} (${teacher.email})?`)) {
      return;
    }

    setError('');
    setNotice('');
    try {
      await request(`/api/admin/teachers/${teacher.id}`, adminUser.token, {
        method: 'DELETE',
      });
      setNotice(`Teacher ${teacher.name} was removed.`);
      await loadData(adminUser.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove teacher.');
    }
  };

  if (!adminUser) return null;

  return (
    <div className="dashboard-layout">
      <Navbar user={adminUser} onSignOut={() => navigate('/admin/login')} />

      <main className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Admin Control Panel</h1>
            <p className="dashboard-subtitle">
              Manage campus events and oversee faculty teacher accounts.
            </p>
          </div>

          <div className="dashboard-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('events');
                setError('');
                setNotice('');
              }}
            >
              📅 Events ({events.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('teachers');
                setError('');
                setNotice('');
              }}
            >
              🧑‍🏫 Teachers ({teachers.length})
            </button>
          </div>
        </div>

        {notice && <div className="alert-box alert-success">{notice}</div>}
        {error && <div className="alert-box alert-error">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading records from campus database...</p>
          </div>
        ) : activeTab === 'events' ? (
          <div className="tab-section">
            <div className="section-toolbar">
              <h2>All Campus Events</h2>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setEditingEvent(null);
                  setIsEventModalOpen(true);
                }}
              >
                + Add New Event
              </button>
            </div>

            {events.length === 0 ? (
              <div className="empty-state">
                <p>No campus events found. Click "+ Add New Event" to publish the first event.</p>
              </div>
            ) : (
              <div className="cards-grid">
                {events.map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-card-header">
                      <h3>{event.title}</h3>
                      <span className="creator-tag">
                        By: {event.createdByName ?? 'Admin'}
                      </span>
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
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="tab-section">
            <div className="section-toolbar">
              <h2>Faculty / Teacher Accounts</h2>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsTeacherModalOpen(true)}
              >
                + Add Teacher Account
              </button>
            </div>

            {teachers.length === 0 ? (
              <div className="empty-state">
                <p>
                  No teachers registered yet. Click "+ Add Teacher Account" to create credentials for faculty members.
                </p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr key={t.id}>
                        <td><strong>{t.name}</strong></td>
                        <td>{t.email}</td>
                        <td>
                          <span className="badge badge-teacher">TEACHER</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-danger btn-xs"
                            onClick={() => handleDeleteTeacher(t)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <AdminEventModal
        isOpen={isEventModalOpen}
        editingEvent={editingEvent}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
      />

      <AdminTeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        onSave={handleSaveTeacher}
      />
    </div>
  );
};
