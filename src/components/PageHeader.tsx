interface PageHeaderProps {
  title: string;
  subtitle: string;
  breadcrumb?: string;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 bg-[#FAFAFA] py-6 px-14 flex-shrink-0">
      {breadcrumb && (
        <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px]">
          {breadcrumb}
        </span>
      )}
      <h1 className="font-[family-name:var(--font-newsreader)] text-[38px] font-medium text-[#0D6E6E] tracking-[-2px]">
        {title}
      </h1>
      <p className="text-[15px] text-[#666666] leading-[1.5]">{subtitle}</p>
    </div>
  );
}
