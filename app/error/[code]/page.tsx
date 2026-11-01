import type { Metadata } from "next";
import ErrorLayout from "@/components/ui/error-layout";
import { getErrorConfig } from "@/lib/constants/error-configs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const config = getErrorConfig(resolvedParams.code);
  const title = `${config.title} - HIMASI`;

  return {
    title,
    description: config.description,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description: config.description,
    },
  };
}

export default async function DynamicErrorPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const resolvedParams = await params;
  return <ErrorLayout code={resolvedParams.code} />;
}


