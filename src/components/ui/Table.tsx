import { cn } from "@/lib/utils";

export function Table({ className, children, ...rest }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="scrollbar-thin w-full overflow-x-auto border border-line rounded-md">
      <table className={cn("w-full border-collapse text-sm", className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, children, align = "left", ...rest }: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line bg-bg px-3 py-2 text-xs font-semibold whitespace-nowrap text-muted",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({ className, children, align = "left", highlight, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center"; highlight?: boolean }) {
  return (
    <td
      className={cn(
        "border-b border-line px-3 py-2.5 whitespace-nowrap text-ink",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        highlight && "bg-success-bg/60 font-semibold text-success",
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

export function Tr({ className, ...rest }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("last:[&>td]:border-b-0 hover:bg-bg/60", className)} {...rest} />;
}
