"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { pageWindow } from "@/lib/page-window";
import { ArrowLeft01Icon, ArrowRight01Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "cn";

export interface TableAction<TData> {
  label: string | ((row: TData) => string);
  onClick: (row: TData) => void;
  variant?: "default" | "destructive";
  when?: (row: TData) => boolean;
}

/** Server-side paging. Leave it out and the table pages through `data` itself. */
export interface DataTablePagination {
  pageIndex: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (pageIndex: number) => void;
  /** Enables "Showing 1 to 8 of 100 entries" and the page number buttons. */
  totalItems?: number;
}

interface DataTableProps<TData, TValue>
  extends
    React.ComponentProps<typeof Table>,
    MixinProps<"row", React.ComponentProps<typeof TableRow>>,
    MixinProps<"checkbox", React.ComponentProps<typeof Checkbox>>,
    MixinProps<"body", React.ComponentProps<typeof TableBody>>,
    MixinProps<"cell", React.ComponentProps<typeof TableCell>>,
    MixinProps<"container", React.ComponentProps<"div">> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  enableBulkSelect?: boolean;
  onSelectionChange?: (rows: TData[]) => void;
  actions?: TableAction<TData>[] | ((row: TData) => TableAction<TData>[]);
  /** The heading above the row actions. Empty by default. */
  actionsHeader?: React.ReactNode;
  isLoading?: boolean;
  skeletonRowCount?: number;
  emptyMessage?: React.ReactNode;
  pagination?: DataTablePagination;
  pageSize?: number;
  /** Turn off for a short, fixed list that doesn't need "Showing 1 to 8" or page buttons. */
  showPagination?: boolean;
  /** A stable id for each row. Without it, selection and cell state stay with the row's position when `data` is filtered or re-sorted. */
  getRowId?: (row: TData) => string;
}

const STICKY_ACTIONS = "sticky right-0 shadow-[-1px_0_0_0_var(--border)]";

// TanStack Table v8 calls Date.now() while rendering, which cacheComponents rejects during prerender
// unless it runs inside a Suspense boundary.
export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  return (
    <React.Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
      <DataTableContent {...props} />
    </React.Suspense>
  );
}

// ponytail: no filter pills yet; StellarTools' are ~500 lines. Add when a screen needs column filters.
function DataTableContent<TData, TValue>({
  columns,
  data,
  onRowClick,
  enableBulkSelect = false,
  onSelectionChange,
  actions,
  actionsHeader,
  isLoading = false,
  skeletonRowCount = 5,
  emptyMessage = "No results found.",
  pagination,
  pageSize: clientPageSize = 10,
  showPagination = true,
  getRowId,
  ...mixProps
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const {
    row: rowProps,
    checkbox: checkboxProps,
    body: bodyProps,
    cell: cellProps,
    container: containerProps,
    rest,
  } = splitProps(mixProps, "row", "checkbox", "body", "cell", "container");

  const tableColumns = React.useMemo(() => {
    const all: ColumnDef<TData, TValue>[] = [...columns];

    if (enableBulkSelect) {
      all.unshift({
        id: "select",
        size: 40,
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            {...checkboxProps}
            aria-label="Select all rows"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...checkboxProps}
            aria-label="Select row"
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      });
    }

    if (actions) {
      all.push({
        id: "actions",
        size: 50,
        enableSorting: false,
        header: () => actionsHeader ?? null,
        cell: ({ row }) => <RowActions row={row.original} actions={actions} />,
      });
    }

    return all;
    // checkboxProps is rebuilt every render, and only styles the checkboxes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, enableBulkSelect, actions, actionsHeader]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getRowId,
    state: {
      sorting,
      rowSelection,
      ...(pagination && { pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize } }),
    },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);
      onSelectionChange?.(
        table
          .getCoreRowModel()
          .rows.filter((r) => next[r.id])
          .map((r) => r.original)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(pagination
      ? { manualPagination: true, pageCount: -1 }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageIndex: 0, pageSize: clientPageSize } },
        }),
  });

  const rows = table.getRowModel().rows;
  const { pageIndex, pageSize } = pagination ?? table.getState().pagination;
  const totalItems = pagination ? pagination.totalItems : data.length;

  return (
    <div {...containerProps} className={cn("space-y-5", containerProps.className)}>
      <div className="overflow-hidden">
        <Table {...rest}>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow {...rowProps} key={group.id} className={cn("bg-muted hover:bg-muted", rowProps.className)}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      className={cn(
                        "h-13 px-4 font-semibold",
                        header.column.id === "actions" && `${STICKY_ACTIONS} bg-muted`
                      )}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                    >
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="inline-flex cursor-pointer items-center gap-1 rounded select-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted && <span aria-hidden>{sorted === "asc" ? "▴" : "▾"}</span>}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody {...bodyProps}>
            {isLoading ? (
              Array.from({ length: skeletonRowCount }, (_, rowIndex) => (
                <TableRow {...rowProps} key={rowIndex}>
                  {tableColumns.map((_, columnIndex) => (
                    <TableCell {...cellProps} key={columnIndex} className={cn("px-4 py-4", cellProps.className)}>
                      <Skeleton
                        className="h-4"
                        style={{ width: `${60 + ((rowIndex * 7 + columnIndex * 11) % 40)}%` }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow
                  {...rowProps}
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={cn(onRowClick && "cursor-pointer", rowProps.className)}
                  onClick={(e) => {
                    rowProps.onClick?.(e);
                    onRowClick?.(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      {...cellProps}
                      key={cell.id}
                      className={cn(
                        "px-4 py-3 text-muted-foreground",
                        cell.column.id === "actions" && `${STICKY_ACTIONS} bg-card`,
                        cellProps.className
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <DataTablePager
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalItems={totalItems}
          canPrevious={pagination ? pagination.hasPreviousPage : table.getCanPreviousPage()}
          canNext={pagination ? pagination.hasNextPage : table.getCanNextPage()}
          disabled={isLoading}
          onPageChange={(page) => (pagination ? pagination.onPageChange(page) : table.setPageIndex(page))}
        />
      )}
    </div>
  );
}

const PAGE_BUTTON = "size-9 rounded-full";

function DataTablePager({
  pageIndex,
  pageSize,
  totalItems,
  canPrevious,
  canNext,
  disabled,
  onPageChange,
}: {
  pageIndex: number;
  pageSize: number;
  totalItems: number | undefined;
  canPrevious: boolean;
  canNext: boolean;
  disabled: boolean;
  onPageChange: (pageIndex: number) => void;
}) {
  const known = totalItems !== undefined;
  const window = known ? pageWindow(pageIndex, Math.max(Math.ceil(totalItems / pageSize), 1)) : null;
  const first = pageIndex * pageSize + 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {!known
          ? `Page ${pageIndex + 1}`
          : totalItems === 0
            ? "No entries"
            : `Showing ${first} to ${Math.min(first + pageSize - 1, totalItems)} of ${totalItems} entries`}
      </p>

      {(canPrevious || canNext) && (
        <nav aria-label="Pagination" className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className={PAGE_BUTTON}
            aria-label="Previous page"
            disabled={disabled || !canPrevious}
            onClick={() => onPageChange(pageIndex - 1)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
          </Button>

          {window?.before != null && (
            <Button
              variant="outline"
              size="icon"
              className={PAGE_BUTTON}
              aria-label="Earlier pages"
              disabled={disabled}
              onClick={() => onPageChange(window.before as number)}
            >
              …
            </Button>
          )}

          {window?.pages.map((page) => (
            <Button
              key={page}
              variant={page === pageIndex ? "default" : "outline"}
              size="icon"
              className={PAGE_BUTTON}
              aria-label={`Page ${page + 1}`}
              aria-current={page === pageIndex ? "page" : undefined}
              disabled={disabled}
              onClick={() => onPageChange(page)}
            >
              {page + 1}
            </Button>
          ))}

          {window?.after != null && (
            <Button
              variant="outline"
              size="icon"
              className={PAGE_BUTTON}
              aria-label="Later pages"
              disabled={disabled}
              onClick={() => onPageChange(window.after as number)}
            >
              …
            </Button>
          )}

          <Button
            size="icon"
            className={PAGE_BUTTON}
            aria-label="Next page"
            disabled={disabled || !canNext}
            onClick={() => onPageChange(pageIndex + 1)}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} />
          </Button>
        </nav>
      )}
    </div>
  );
}

function RowActions<TData>({
  row,
  actions,
}: {
  row: TData;
  actions: NonNullable<DataTableProps<TData, unknown>["actions"]>;
}) {
  const visible = (typeof actions === "function" ? actions(row) : actions).filter((a) => !a.when || a.when(row));

  if (!visible.length) return null;

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Row actions">
              <HugeiconsIcon icon={MoreHorizontalIcon} />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {visible.map((action, index) => (
            <DropdownMenuItem key={index} variant={action.variant} onClick={() => action.onClick(row)}>
              {typeof action.label === "function" ? action.label(row) : action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
