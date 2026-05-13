type ClubLogoProps = {
  clubName: string;
  logoUrl: string | null;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
};

export function ClubLogo({
  clubName,
  logoUrl,
  className = "",
  imageClassName = "",
  textClassName = ""
}: ClubLogoProps) {
  const initials = clubName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`${clubName} logo`}
          className={`h-12 w-12 rounded-2xl object-cover shadow-soft ${imageClassName}`.trim()}
          src={logoUrl}
        />
      ) : (
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-court-ball text-sm font-black text-court-ink shadow-glow">
          {initials || "CP"}
        </div>
      )}
      <span className={`font-black ${textClassName}`.trim()}>{clubName}</span>
    </div>
  );
}
