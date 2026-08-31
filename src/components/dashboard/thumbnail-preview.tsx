export function ThumbnailPreview({ svg }: { svg: string | null }) {
  const src = svg ? `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` : null;
  return (
    <div className="bg-muted/60 relative aspect-video w-full overflow-hidden border-b">
      {src ? (
        <img
          src={src}
          alt=""
          className="bg-background absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
          Empty board
        </div>
      )}
    </div>
  );
}
