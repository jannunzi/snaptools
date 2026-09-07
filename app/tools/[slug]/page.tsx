import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolShell } from "@/components/ToolShell";
import { getSiteUrl } from "@/lib/site";
import { ToolBody } from "@/lib/tool-components";
import { getTool, tools } from "@/lib/tools";

type ToolPageProps = PageProps<"/tools/[slug]">;

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) {
    return { title: "Tool not found" };
  }

  return {
    title: tool.title,
    description: tool.description,
    openGraph: {
      title: tool.title,
      description: tool.description,
      url: `${getSiteUrl()}/tools/${tool.slug}`,
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  return (
    <ToolShell tool={tool}>
      <ToolBody tool={tool} />
    </ToolShell>
  );
}
