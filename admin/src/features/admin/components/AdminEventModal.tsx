import React, { useState, useEffect } from 'react';
import { type EventItem, type EventForm, emptyEventForm } from '../../../api/client';

interface AdminEventModalProps {
  isOpen: boolean;
  editingEvent: EventItem | null;
  onClose: () => void;
  onSave: (form: EventForm, eventId: number | null) => Promise<void>;
}

export const AdminEventModal: React.FC<AdminEventModalProps> = ({
  isOpen,
  editingEvent,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<EventForm>(emptyEventForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingEvent) {
      setForm({
        title: editingEvent.title,
        description: editingEvent.description,
        venue: editingEvent.venue,
        date: editingEvent.eventDate.slice(0, 10),
        time: editingEvent.eventDate.slice(11, 16),
      });
    } else {
      setForm(emptyEventForm);
    }
    setError('');
  }, [editingEvent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (!form.title.trim() || !form.description.trim() || !form.venue.trim() || !form.date || !form.time) {
        throw new Error('Please fill in all event fields.');
      }
      await onSave(form, editingEvent ? editingEvent.id : null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingEvent ? 'Edit Event (Admin)' : 'Create New Event (Admin)'}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="admin-event-title">Event Title</label>
            <input
              id="admin-event-title"
              type="text"
              required
              maxLength={160}
              placeholder="e.g. Annual Tech Symposium"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-event-description">Description</label>
            <textarea
              id="admin-event-description"
              rows={3}
              required
              maxLength={2000}
              placeholder="Provide event details, schedule, and guest speakers..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-event-venue">Venue</label>
            <input
              id="admin-event-venue"
              type="text"
              required
              maxLength={200}
              placeholder="e.g. Campus Auditorium / Hall B"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="admin-event-date">Date</label>
              <input
                id="admin-event-date"
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-event-time">Time</label>
              <input
                id="admin-event-time"
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
