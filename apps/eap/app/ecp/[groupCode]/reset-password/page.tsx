import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ groupCode: string }>;
};

export default async function Page({ params }: PageProps) {
  const { groupCode } = await params;
  redirect(`/ecp/${groupCode}`);
}
