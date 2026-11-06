import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import { toast } from "sonner";

import { DataTable, type TableAction } from "./data-table";
import { SearchField } from "./search-field";
import { SelectField } from "./select-field";

interface Person {
  id: string;
  name: string;
  role: string;
  status: "Active" | "Invited" | "Paused";
}

const people: Person[] = [
  "Ada Obi",
  "Tunde Bello",
  "Mira Chen",
  "Sam Okoro",
  "Lena Roy",
  "Noah Eze",
  "Ife Ade",
  "Kai Lund",
  "Zara Musa",
  "Omar Said",
  "Ruth Nwosu",
  "Theo Park",
].map((name, index) => ({
  id: String(index),
  name,
  role: ["Engineer", "Designer", "Product", "Support"][index % 4],
  status: (["Active", "Invited", "Active", "Paused"] as const)[index % 4],
}));

const columns: ColumnDef<Person>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "Active" ? "default" : "secondary"}>{row.original.status}</Badge>
    ),
  },
];

const actions: TableAction<Person>[] = [
  { label: "Edit", onClick: (person) => toast(`Editing ${person.name}`) },
  {
    label: "Resend invite",
    when: (person) => person.status === "Invited",
    onClick: (person) => toast(`Invited ${person.name}`),
  },
  { label: "Remove", variant: "destructive", onClick: (person) => toast.error(`Removed ${person.name}`) },
];

type PersonTable = React.ComponentProps<typeof DataTable<Person, unknown>>;

const meta = {
  title: "Primitives/DataTable",
  component: DataTable<Person, unknown>,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { columns, data: people },
  argTypes: {
    isLoading: { control: "boolean" },
    enableBulkSelect: { control: "boolean" },
    skeletonRowCount: { control: "number" },
    emptyMessage: { control: "text" },
  },
} satisfies Meta<PersonTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithRowActions: Story = { args: { actions } };

export const WithActionsHeader: Story = { args: { actions, actionsHeader: "Action" } };

export const WithBulkSelect: Story = {
  args: { enableBulkSelect: true, onSelectionChange: (rows) => console.log("selected", rows) },
};

export const WithoutPagination: Story = { args: { showPagination: false } };

export const ClickableRows: Story = { args: { onRowClick: (person) => toast(`Opened ${person.name}`) } };

export const Loading: Story = { args: { isLoading: true, skeletonRowCount: 3, actions } };

export const Empty: Story = { args: { data: [], emptyMessage: "No teammates yet." } };

const ServerPaged = (args: PersonTable) => {
  const [pageIndex, setPageIndex] = React.useState(0);
  const pageSize = 5;
  const page = people.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  return (
    <DataTable
      {...args}
      data={page}
      pagination={{
        pageIndex,
        pageSize,
        hasPreviousPage: pageIndex > 0,
        hasNextPage: (pageIndex + 1) * pageSize < people.length,
        onPageChange: setPageIndex,
        totalItems: people.length,
      }}
    />
  );
};

export const ServerPagination: Story = { render: (args) => <ServerPaged {...args} /> };

interface Payment {
  key: string;
  id: string;
  card: string;
  account: string;
  money: number;
  medium: "Payoneer" | "Visa" | "PayPal";
  date: string;
  time: string;
  status: PaymentStatus;
}

const STATUSES = {
  Successful: "border-transparent bg-muted text-foreground",
  Pending: "border-transparent bg-warning/15 text-warning",
  Cancel: "border-destructive/25 bg-destructive/5 text-destructive",
};
type PaymentStatus = keyof typeof STATUSES;

const DESIGN_ROWS: [string, number, Payment["medium"], string, PaymentStatus][] = [
  ["999 *** *** 123", 7000, "Payoneer", "05:12 AM", "Successful"],
  ["874 *** *** 875", 2100, "Visa", "08:17 AM", "Successful"],
  ["412 *** *** 954", 4000, "PayPal", "09:01 AM", "Pending"],
  ["135 *** *** 654", 1000, "Payoneer", "10:12 AM", "Cancel"],
  ["564 *** *** 325", 9450, "PayPal", "11:12 AM", "Successful"],
  ["354 *** *** 254", 3250, "Payoneer", "01:12 PM", "Successful"],
  ["564 *** *** 325", 2700, "Payoneer", "05:07 PM", "Pending"],
  ["354 *** *** 254", 4400, "Visa", "09:17 PM", "Successful"],
];

// The first 8 rows are from the design; the rest repeat them so paging has 100 entries to work with.
const payments: Payment[] = Array.from({ length: 100 }, (_, index) => {
  const [id, money, medium, time, status] = DESIGN_ROWS[index % DESIGN_ROWS.length];
  return {
    key: String(index),
    id,
    card: "**4291 - Exp: 12/26",
    account: "326 *** *** 124",
    money: money + Math.floor(index / DESIGN_ROWS.length) * 50,
    medium,
    date: "03/05/2029",
    time,
    status,
  };
});

const StatusSelect = ({ initial }: { initial: PaymentStatus }) => {
  const [status, setStatus] = React.useState(initial);
  return (
    <Select value={status} onValueChange={(next) => next && setStatus(next)}>
      <SelectTrigger aria-label="Payment status" className={cn("h-8 w-30 rounded-full px-3 text-xs", STATUSES[status])}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {(Object.keys(STATUSES) as PaymentStatus[]).map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const paymentColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: "id",
    header: "Payment ID",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className="text-sm">{row.original.id}</span>
        <span className="text-xs">{row.original.card}</span>
      </div>
    ),
  },
  { accessorKey: "account", header: "Transfer Account", enableSorting: false },
  { accessorKey: "money", header: "Money", cell: ({ row }) => `₦${row.original.money.toLocaleString("en-US")}` },
  { accessorKey: "medium", header: "Medium" },
  { accessorKey: "date", header: "Date", enableSorting: false },
  { accessorKey: "time", header: "Time", enableSorting: false },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusSelect initial={row.original.status} />,
  },
  {
    id: "pdf",
    header: "PDF",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Download ${row.original.id} as PDF`}
        onClick={() => toast(`Downloading ${row.original.id}`)}
      >
        <HugeiconsIcon icon={Download01Icon} />
      </Button>
    ),
  },
];

const RecentPaymentsCard = () => {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const rows = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter(
      (payment) =>
        (status === "all" || payment.status === status) &&
        (!term || `${payment.id} ${payment.account} ${payment.medium}`.toLowerCase().includes(term))
    );
  }, [search, status]);

  return (
    <Card className="gap-0 rounded-xl py-0 shadow-sm ring-0">
      <CardHeader className="mx-7 mt-7 flex flex-wrap items-center justify-between gap-4 border-b border-dashed px-0 py-0 pb-5">
        <CardTitle className="text-2xl font-semibold">Recent Payments</CardTitle>
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <SearchField
            id="recent-payments-search"
            className="w-full sm:w-64"
            value={search}
            onChange={setSearch}
            onSearch={setSearch}
          />
          <SelectField
            id="recent-payments-status"
            label="Sort By :"
            value={status}
            onChange={setStatus}
            items={[
              { value: "all", label: "All" },
              { value: "Successful", label: "Successful" },
              { value: "Pending", label: "Pending" },
              { value: "Cancel", label: "Cancel" },
            ]}
            className="flex-row items-center"
            labelClassName="font-normal whitespace-nowrap text-muted-foreground"
            triggerClassName="h-10! min-w-20 rounded-full px-3.5"
            contentClassName="min-w-32"
          />
        </div>
      </CardHeader>
      <CardContent className="px-7 py-5">
        <DataTable
          columns={paymentColumns}
          data={rows}
          pageSize={8}
          getRowId={(payment) => payment.key}
          emptyMessage="No payments match your search."
        />
      </CardContent>
    </Card>
  );
};

export const RecentPayments: Story = { render: () => <RecentPaymentsCard /> };

export const WithMixins: Story = {
  args: {
    containerClassName: "max-w-2xl",
    rowClassName: "text-primary",
    cellClassName: "py-3",
    checkboxClassName: "rounded-full",
    enableBulkSelect: true,
  },
};
