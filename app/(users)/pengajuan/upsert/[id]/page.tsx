import { UpsertPengajuan } from "@/components/Pages";

type params = {
  id: string;
};

export default async function Page({ params }: { params: Promise<params> }) {
  const { id } = await params;
  if (!id) return <div>DAPEM NOT FOUND!</div>;
  const req = await fetch(
    `${process.env.NEXTAUTH_URL || "/"}/api/dapem?id=${id}`,
    { method: "PATCH" }
  );
  const { data } = await req.json();
  if (!data || data.length === 0) return <div>DAPEM NOT FOUND!</div>;
  return <UpsertPengajuan data={data[0]} />;
}
