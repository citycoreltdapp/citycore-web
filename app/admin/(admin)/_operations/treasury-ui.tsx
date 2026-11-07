"use client";
import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { DateField } from "@/components/primitives/date-field";
import { NumberField } from "@/components/primitives/number-field";
import { SelectField } from "@/components/primitives/select-field";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { independentBatchRequestSchema } from "@/constant/schemas/admin-treasury";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, type FieldPathByValue, type FieldValues, type UseFormReturn, useForm } from "react-hook-form";
import { z } from "zod";

import { STAFF } from "./data";
import { Notice } from "./ui";

export { money } from "../account/_data";
export function TreasuryStats({ items }: { items: { title: string; value: string; note: string }[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {items.map((item) => (
        <Card key={item.title}>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">{item.title}</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
export function downloadCsv(filename: string, contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
export function FinanceText<T extends FieldValues>({
  form,
  name,
  label,
  area = false,
}: {
  form: UseFormReturn<T>;
  name: FieldPathByValue<T, string>;
  label: string;
  area?: boolean;
}) {
  const id = React.useId();
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => {
        const Component = area ? TextAreaField : TextField;
        return (
          <Component
            {...field}
            id={id}
            label={label}
            value={String(field.value ?? "")}
            error={fieldState.error?.message}
          />
        );
      }}
    />
  );
}
export function FinanceNumber<T extends FieldValues>({
  form,
  name,
  label,
  prefix,
}: {
  form: UseFormReturn<T>;
  name: FieldPathByValue<T, number>;
  label: string;
  prefix?: string;
}) {
  const id = React.useId();
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <NumberField
          {...field}
          id={id}
          label={label}
          value={typeof field.value === "number" ? field.value : undefined}
          allowDecimal
          prefix={prefix}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
export function FinanceDate<T extends FieldValues>({
  form,
  name,
  label,
}: {
  form: UseFormReturn<T>;
  name: FieldPathByValue<T, string>;
  label: string;
}) {
  const id = React.useId();
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <DateField
          {...field}
          id={id}
          label={label}
          value={String(field.value ?? "")}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
export function FinanceSelect<T extends FieldValues>({
  form,
  name,
  label,
  items,
}: {
  form: UseFormReturn<T>;
  name: FieldPathByValue<T, string>;
  label: string;
  items: { value: string; label: string }[];
}) {
  const id = React.useId();
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <SelectField
          {...field}
          id={id}
          label={label}
          value={String(field.value ?? "")}
          items={items}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
type Request = z.infer<typeof independentBatchRequestSchema>;
function ReviewForm({
  batchId,
  children,
  onSave,
}: {
  batchId: string;
  children: React.ReactNode;
  onSave: (values: Request) => boolean;
}) {
  const form = useForm<Request>({
    resolver: zodResolver(independentBatchRequestSchema),
    defaultValues: {
      batchId,
      requestedBy: "staff-tunde",
      checkerId: "staff-nneka",
      version: 1,
      idempotencyKey: crypto.randomUUID(),
      reason: "",
    },
  });
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        if (onSave(values)) AppModal.close();
      })}
    >
      {children}
      <FinanceSelect
        form={form}
        name="checkerId"
        label="Independent checker"
        items={STAFF.filter((s) => s.id !== "staff-tunde" && s.role === "super-admin").map((s) => ({
          value: s.id,
          label: s.name,
        }))}
      />
      <FinanceText form={form} name="reason" label="Recorded review reason" area />
      <Notice>
        Prepared by Tunde Bello · Finance. This saves a local review request only. No bank transfer, wallet credit or
        ledger entry is executed.
      </Notice>
      <Button type="submit">Save review request</Button>
    </form>
  );
}
export function reviewBatch(options: {
  title: string;
  batchId: string;
  content: React.ReactNode;
  onSave: (values: Request) => boolean;
}) {
  AppModal.open({
    title: options.title,
    description: options.batchId,
    content: (
      <ReviewForm batchId={options.batchId} onSave={options.onSave}>
        {options.content}
      </ReviewForm>
    ),
  });
}
