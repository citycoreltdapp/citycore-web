import type { Meta, StoryObj } from "@storybook/react-vite";

import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./table";

const meta = {
  title: "UI/Table",
  component: Table,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const invoices = [
  { id: "INV-001", status: "Paid", amount: "$250.00" },
  { id: "INV-002", status: "Pending", amount: "$150.00" },
  { id: "INV-003", status: "Unpaid", amount: "$350.00" },
];

export const Default: Story = {
  render: (args) => (
    <Table {...args}>
      <TableCaption>Your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right">$750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};
