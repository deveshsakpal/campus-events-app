import React, { useState, useEffect } from 'react';
import { type EventItem, type EventForm, emptyEventForm } from '../../../api/client';

interface TeacherEventModalProps {
  isOpen: boolean;
  editingEvent: EventItem | null;
  onClose: () => void;
  onSave: (form: EventForm, eventId: number | null) => Promise<void>;
}

export const TeacherEventModal: React.FC<TeacherEventModalProps> = ({
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
          <h2>{editingEvent ? 'Edit Your Event' : 'Create Department Event'}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="teacher-event-title">Event Title</label>
            <input
              id="teacher-event-title"
              type="text"
              required
              maxLength={160}
              placeholder="e.g. CS Department Guest Lecture"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="teacher-event-description">Description</label>
            <textarea
              id="teacher-event-description"
              rows={3}
              required
              maxLength={2000}
              placeholder="Describe event objectives, target audience, and key highlights..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="teacher-event-venue">Venue / Location</label>
            <input
              id="teacher-event-venue"
              type="text"
              required
              maxLength={200}
              placeholder="e.g. Science Block Room 302"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="teacher-event-date">Date</label>
              <input
                id="teacher-event-date"
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="teacher-event-time">Time</label>
              <input
                id="teacher-event-time"
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
            <button type="submit" className="btn-primary teacher-btn" disabled={busy}>
              {busy ? 'Saving...' : editingEvent ? 'Save Changes' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
