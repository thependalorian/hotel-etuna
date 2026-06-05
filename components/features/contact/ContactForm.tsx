/**
 * Contact Form
 *
 * Purpose: Client-side contact form that POSTs to /api/contact.
 * Location: components/features/contact/ContactForm.tsx
 */

'use client';

import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiUrl } from '@/lib/utils/api-url';
import { brand } from '@/lib/copy/brand';

const SUBJECTS = [
  { value: '', label: 'Select a subject' },
  { value: 'Reservation Inquiry', label: 'Reservation Inquiry' },
  { value: 'Restaurant Reservation', label: 'Restaurant Reservation' },
  { value: 'Event/Conference Inquiry', label: 'Event / Conference Inquiry' },
  { value: 'General Question', label: 'General Question' },
  { value: 'Feedback', label: 'Feedback' },
];

const inputClass = 'w-full px-4 py-3 rounded-lg border border-nude-300 focus:ring-2 focus:ring-khaki-600 focus:border-transparent bg-white text-terracotta-900';
const labelClass = 'block text-sm font-semibold text-terracotta-900 mb-2';

export function ContactForm() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', subject: '', message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject) { setError('Please select a subject.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error?.message ?? 'Failed to send message. Please email us directly.');
        return;
      }
      setSuccess(true);
    } catch {
      setError(`Network error. Please email us at ${brand.emailFrontDesk}.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-green-600" />
        <h3 className="font-display text-2xl font-bold text-terracotta-900">Message sent!</h3>
        <p className="text-terracotta-800 max-w-sm">
          Thank you for reaching out. We typically respond within 24 hours.
        </p>
        <button onClick={() => { setSuccess(false); setForm({ firstName:'',lastName:'',email:'',phone:'',subject:'',message:'' }); }}
          className="text-sm text-khaki-600 hover:underline mt-2">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <h2 className="font-display text-3xl font-bold text-terracotta-900 mb-6">Send Us a Message</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>First Name *</label>
          <input name="firstName" type="text" required value={form.firstName} onChange={handle}
            className={inputClass} placeholder="John" />
        </div>
        <div>
          <label className={labelClass}>Last Name *</label>
          <input name="lastName" type="text" required value={form.lastName} onChange={handle}
            className={inputClass} placeholder="Doe" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Email Address *</label>
        <input name="email" type="email" required value={form.email} onChange={handle}
          className={inputClass} placeholder="john@example.com" />
      </div>

      <div>
        <label className={labelClass}>Phone Number</label>
        <input name="phone" type="tel" value={form.phone} onChange={handle}
          className={inputClass} placeholder="+264 81 234 5678" />
      </div>

      <div>
        <label className={labelClass}>Subject *</label>
        <select name="subject" required value={form.subject} onChange={handle} className={inputClass}>
          {SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Message *</label>
        <textarea name="message" required rows={6} value={form.message} onChange={handle}
          className={`${inputClass} resize-none`} placeholder="Tell us how we can help..." />
        <p className="text-xs text-nude-500 mt-1 text-right">{form.message.length}/2000</p>
      </div>

      {error && (
        <div className="alert alert-error text-sm">{error}</div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? <span className="loading loading-spinner loading-sm" /> : <Send className="w-5 h-5" />}
        {submitting ? 'Sending…' : 'Send Message'}
      </Button>

      <p className="text-sm text-terracotta-800 text-center">We typically respond within 24 hours</p>
    </form>
  );
}
