"use client";

import * as React from "react";

import { type FieldProps, FieldShell, fieldDescribedBy, fieldMixins } from "@/components/primitives/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { ArrowTurnBackwardIcon, Search01Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

// Ported from the PayRoutes shared-ui ResourceField: a searchable select over any item type.

export interface ResourceFieldProps<T>
  extends FieldProps, MixinProps<"popover", Omit<React.ComponentProps<typeof PopoverContent>, "children">> {
  value: T | null;
  onChange: (value: T | null) => void;
  items: T[];
  /** Must be unique; it keys the rows and decides which one is selected. */
  getItemKey: (item: T) => string;
  /** Shown in the trigger when no `renderSummary` is given. */
  getItemTitle: (item: T) => string;
  /** Rows are grouped under these headings, in the order the groups first appear in `items`. */
  getItemGroup?: (item: T) => string;
  renderSearchItem: (item: T, isSelected: boolean) => React.ReactNode;
  /** Replaces the selected title inside the trigger. */
  renderSummary?: (item: T) => React.ReactNode;
  searchFilter: (item: T, query: string) => boolean;
  /** Shown above the results while the search is empty, such as an "Add new" row. */
  renderActions?: React.ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  triggerClassName?: string;
}

/** A selectable row with a marker on the left and an enter hint on the right. */
export function ResourceFieldItem({
  selected,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { selected?: boolean }) {
  return (
    <div
      data-slot="resource-field-item"
      data-selected={selected || undefined}
      className={cn(
        "group/row relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-lg py-2 pr-3 pl-3 text-left text-sm text-foreground",
        "before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-foreground before:opacity-0 before:content-['']",
        "group-data-active/option:bg-muted group-data-active/option:before:opacity-100",
        selected && "bg-muted before:opacity-100",
        className
      )}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">{children}</span>
      <HugeiconsIcon
        icon={ArrowTurnBackwardIcon}
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground opacity-0 group-data-active/option:opacity-100"
      />
    </div>
  );
}

export function ResourceField<T>({
  id,
  value,
  onChange,
  items,
  getItemKey,
  getItemTitle,
  getItemGroup,
  renderSearchItem,
  renderSummary,
  searchFilter,
  renderActions,
  label,
  error,
  helpText,
  className,
  placeholder = "Select",
  searchPlaceholder = "Search",
  emptyMessage = "No results found",
  isLoading = false,
  disabled = false,
  triggerClassName,
  ...mixProps
}: ResourceFieldProps<T>) {
  const {
    label: labelProps,
    error: errorProps,
    helpText: helpTextProps,
    popover: popoverProps,
  } = splitProps(mixProps, ...fieldMixins, "popover");

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const listId = `${id}-listbox`;

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? items.filter((item) => searchFilter(item, term)) : items;
  }, [items, query, searchFilter]);

  // Groups keep the order they first appear in, so callers control it by sorting `items`.
  const groupRows = React.useCallback(
    (list: T[]) => {
      const map = new Map<string, T[]>();
      for (const item of list) {
        const group = getItemGroup?.(item) ?? "";
        map.set(group, [...(map.get(group) ?? []), item]);
      }
      return [...map.entries()];
    },
    [getItemGroup]
  );
  const groups = React.useMemo(() => groupRows(filtered), [groupRows, filtered]);
  const ordered = React.useMemo(() => groups.flatMap(([, rows]) => rows), [groups]);

  const selectedKey = value ? getItemKey(value) : null;

  const changeOpen = (next: boolean) => {
    setOpen(next);
    setQuery("");
    const all = groupRows(items).flatMap(([, rows]) => rows);
    const selectedIndex = next && selectedKey ? all.findIndex((item) => getItemKey(item) === selectedKey) : -1;
    setActiveIndex(Math.max(selectedIndex, 0));
  };

  const select = (item: T) => {
    onChange(item);
    changeOpen(false);
  };

  // Keeps the highlighted row in view while moving with the arrow keys.
  React.useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (ordered.length ? (index + step + ordered.length) % ordered.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = ordered[activeIndex];
      if (item) select(item);
    }
  };

  let rowIndex = -1;

  return (
    <FieldShell {...{ id, label, error, helpText, className, labelProps, errorProps, helpTextProps }}>
      <Popover open={open} onOpenChange={changeOpen}>
        <PopoverTrigger
          id={id}
          type="button"
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={fieldDescribedBy(id, { error, helpText })}
          className={cn(
            "flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm transition-colors outline-none select-none dark:bg-input/30",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
            !value && "text-muted-foreground",
            triggerClassName
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2.5 truncate">
            {value ? (renderSummary?.(value) ?? getItemTitle(value)) : placeholder}
          </span>
          {isLoading ? (
            <Spinner className="size-4 shrink-0" />
          ) : (
            <HugeiconsIcon icon={UnfoldMoreIcon} aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          )}
        </PopoverTrigger>

        <PopoverContent
          align="start"
          initialFocus={inputRef}
          {...popoverProps}
          className={cn("w-(--anchor-width) min-w-72 gap-0 overflow-hidden p-0", popoverProps.className)}
        >
          <div className="border-b border-border p-2">
            <InputGroup className="h-9 rounded-lg bg-card shadow-none dark:bg-card">
              <InputGroupAddon align="inline-start">
                <HugeiconsIcon icon={Search01Icon} aria-hidden className="size-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                ref={inputRef}
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={ordered[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onSearchKeyDown}
              />
            </InputGroup>
          </div>

          <div ref={listRef} id={listId} role="listbox" className="max-h-80 overflow-y-auto overscroll-contain py-1">
            {renderActions && !query ? <div className="px-1 pb-1">{renderActions}</div> : null}

            {groups.map(([group, rows]) => (
              <div key={group || "all"} role="group" aria-label={group || undefined} className="px-1">
                {group && (
                  <p className="sticky top-0 z-10 bg-popover px-3 pt-2.5 pb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {group}
                  </p>
                )}
                <div className="flex flex-col gap-0.5">
                  {rows.map((item) => {
                    rowIndex += 1;
                    const index = rowIndex;
                    const isSelected = getItemKey(item) === selectedKey;
                    return (
                      <div
                        key={getItemKey(item)}
                        id={`${id}-option-${index}`}
                        role="option"
                        aria-selected={isSelected}
                        data-index={index}
                        data-active={index === activeIndex || undefined}
                        className="group/option cursor-pointer"
                        onMouseMove={() => index !== activeIndex && setActiveIndex(index)}
                        onClick={() => select(item)}
                      >
                        {renderSearchItem(item, isSelected)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {ordered.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
}
