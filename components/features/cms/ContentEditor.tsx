import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';
import { Button } from '@/components/ui/Button';

interface ContentEditorProps {
  propertyId: string;
  onContentAdded?: () => void;
}

export default function ContentEditor({ propertyId, onContentAdded }: ContentEditorProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    contentType: 'room_description',
    title: '',
    content: '',
    status: 'draft',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      const payload = {
        ...formData,
        propertyId,
      };

      const response = await fetch(apiUrl('/api/cms/content'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Content created successfully!');
        setFormData({
          contentType: 'room_description',
          title: '',
          content: '',
          status: 'draft',
        });
        onContentAdded?.(); // Notify parent to refresh content list
      } else {
        setError(data.message || 'Failed to create content.');
      }
    } catch (err) {
      securityLogger.error('Error creating content:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 p-6">
      <h3 className="text-xl font-bold mb-4">Add New Content</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div>
          <label htmlFor="contentType" className="label">
            <span className="label-text">Content Type</span>
          </label>
          <select
            id="contentType"
            name="contentType"
            value={formData.contentType}
            onChange={handleChange}
            className="select select-bordered w-full"
            required
          >
            <option value="property">Property Description</option>
            <option value="room">Room Description</option>
            <option value="service">Service Information</option>
            <option value="amenity">Amenity Details</option>
            <option value="menu_item">Menu Item</option>
            <option value="policy">Policy Document</option>
            <option value="general_page">General Page</option>
          </select>
        </div>

        <div>
          <label htmlFor="title" className="label">
            <span className="label-text">Title</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="label">
            <span className="label-text">Content</span>
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="textarea textarea-bordered w-full h-32"
            required
          ></textarea>
        </div>

        <div>
          <label htmlFor="status" className="label">
            <span className="label-text">Status</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="select select-bordered w-full"
            required
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <Button type="submit" isLoading={loading}>
          Save Content
        </Button>
      </form>
    </div>
  );
}
