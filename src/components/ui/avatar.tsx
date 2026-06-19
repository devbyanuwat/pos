import { cn } from "@/lib/utils";

export function Avatar({
  name,
  src,
  className,
}: {
  name?: string;
  src?: string;
  className?: string;
}) {
  const initials = (name ?? "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? ""} className={cn("h-9 w-9 rounded-full object-cover", className)} />;
  }
  return (
    <span
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary",
        className,
      )}
    >
      {initials}
    </span>
  );
}
