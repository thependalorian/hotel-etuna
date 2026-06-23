import EmailSenderForm from '@/components/features/sofia/EmailSenderForm';
import PageHeader from '@/components/shared/PageHeader';

export default function SofiaEmailPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sofia Concierge Email Sender"
        description="Send professional emails to guests using Sofia AI"
      />
      <div className="card bg-base-100 card-hover">
        <div className="card-body">
          <EmailSenderForm />
        </div>
      </div>
    </div>
  );
}
