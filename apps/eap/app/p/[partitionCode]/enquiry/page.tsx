import { Card, Stack } from '@flu-vax/ui';
import { EnquiryForm } from '../../../../components/enquiry-form';
import { ErpShell } from '../../../../components/erp-shell';

type PageProps = {
  params: Promise<{ partitionCode: string }>;
};

export default async function Page({ params }: PageProps) {
  const { partitionCode } = await params;

  return (
    <ErpShell
      title="Appointment enquiry / cancellation"
      subtitle="Participants can request their booking details by registered email or mobile number and cancel through a secure link."
      partitionCode={partitionCode}
    >
      <Stack>
        <Card title="Receive booking information" description="Enter either your registered work email or your registered mobile number. Do not enter both.">
          <EnquiryForm />
        </Card>
      </Stack>
    </ErpShell>
  );
}
