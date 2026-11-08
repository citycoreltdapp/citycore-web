"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed pb-4">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}
export function PageTitle({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
export function PageLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button nativeButton={false} variant="outline" render={<Link href={href} />}>
      {children}
    </Button>
  );
}
export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge
      variant={["rejected", "blacklisted", "revoked", "mismatch"].includes(value) ? "destructive" : "secondary"}
      className={
        ["pending", "suspended", "actionRequired", "blocked"].includes(value)
          ? "bg-warning/10 text-warning capitalize"
          : "capitalize"
      }
    >
      {value.replaceAll("-", " ")}
    </Badge>
  );
}
export function Notice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-muted/60 p-3 text-xs/5 text-muted-foreground">{children}</p>;
}
