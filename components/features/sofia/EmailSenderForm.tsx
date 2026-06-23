'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';
import { Button } from '@/components/ui/Button';

export default function EmailSenderForm() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    emailBody: '',
    ctaLink: '',
    ctaText: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!session?.user?.tenantId) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/sofia/email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Email sent successfully!');
        setFormData({
          to: '',
          subject: '',
          emailBody: '',
          ctaLink: '',
          ctaText: '',
        });
      } else {
        setError(data.message || 'Failed to send email.');
      }
    } catch (err) {
      securityLogger.error('Error sending email:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 p-6">
      <h3 className="text-xl font-bold mb-4">Send Email via Sofia Concierge</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div>
          <label htmlFor="to" className="label">
            <span className="label-text">Recipient Email</span>
          </label>
          <input
            type="email"
            id="to"
            name="to"
            value={formData.to}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div>
          <label htmlFor="subject" className="label">
            <span className="label-text">Subject</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div>
          <label htmlFor="emailBody" className="label">
            <span className="label-text">Email Body</span>
          </label>
          <textarea
            id="emailBody"
            name="emailBody"
            value={formData.emailBody}
            onChange={handleChange}
            className="textarea textarea-bordered w-full h-32 min-h-[120px]"
            required
          ></textarea>
        </div>

        <div>
          <label htmlFor="ctaLink" className="label">
            <span className="label-text">Call to Action Link (Optional)</span>
          </label>
          <input
            type="url"
            id="ctaLink"
            name="ctaLink"
            value={formData.ctaLink}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label htmlFor="ctaText" className="label">
            <span className="label-text">Call to Action Text (Optional)</span>
          </label>
          <input
            type="text"
            id="ctaText"
            name="ctaText"
            value={formData.ctaText}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>

        <Button
          type="submit"
          isLoading={loading}
          aria-label={loading ? 'Sending email...' : 'Send email'}
        >
          Send Email
        </Button>
      </form>
    </div>
  );
}
