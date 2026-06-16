import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';
import { Button } from '@/components/ui/Button';

interface MediaUploaderProps {
  propertyId: string;
  onMediaUploaded?: () => void;
}

export default function MediaUploader({ propertyId, onMediaUploaded }: MediaUploaderProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    fileName: '',
    filePath: '', // This would typically be a URL after upload
    fileType: 'image',
    fileSize: 0,
    mimeType: '',
    storageLocation: 'local', // Placeholder
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        fileSize: parseInt(formData.fileSize.toString()), // Ensure number type
      };

      const response = await fetch(apiUrl('/api/cms/media'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Media uploaded successfully!');
        setFormData({
          fileName: '',
          filePath: '',
          fileType: 'image',
          fileSize: 0,
          mimeType: '',
          storageLocation: 'local',
        });
        onMediaUploaded?.(); // Notify parent to refresh media list
      } else {
        setError(data.message || 'Failed to upload media.');
      }
    } catch (err) {
      securityLogger.error('Error uploading media:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl p-6">
      <h3 className="text-xl font-bold mb-4">Upload New Media</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div>
          <label htmlFor="fileName" className="label">
            <span className="label-text">File Name</span>
          </label>
          <input
            type="text"
            id="fileName"
            name="fileName"
            value={formData.fileName}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div>
          <label htmlFor="filePath" className="label">
            <span className="label-text">File Path (URL)</span>
          </label>
          <input
            type="url"
            id="filePath"
            name="filePath"
            value={formData.filePath}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div>
          <label htmlFor="fileType" className="label">
            <span className="label-text">File Type</span>
          </label>
          <select
            id="fileType"
            name="fileType"
            value={formData.fileType}
            onChange={handleChange}
            className="select select-bordered w-full"
            required
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="document">Document</option>
          </select>
        </div>

        <div>
          <label htmlFor="fileSize" className="label">
            <span className="label-text">File Size (bytes)</span>
          </label>
          <input
            type="number"
            id="fileSize"
            name="fileSize"
            value={formData.fileSize}
            onChange={handleChange}
            className="input input-bordered w-full"
            min="0"
          />
        </div>

        <div>
          <label htmlFor="mimeType" className="label">
            <span className="label-text">MIME Type (e.g., image/jpeg)</span>
          </label>
          <input
            type="text"
            id="mimeType"
            name="mimeType"
            value={formData.mimeType}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>

        <Button type="submit" isLoading={loading}>
          Upload Media
        </Button>
      </form>
    </div>
  );
}
