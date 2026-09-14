import { cn } from "@/lib/utils/cn";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <p className="text-accent text-sm font-medium tracking-[0.08em]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl leading-[1.45] font-semibold tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mt-5 text-base leading-8 sm:text-lg sm:leading-9">
          {description}
        </p>
      ) : null}
    </div>
  );
}
