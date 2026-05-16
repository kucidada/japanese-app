type FuriganaProps = {
  html: string;
  fallback?: string;
};

export default function Furigana({ html, fallback }: FuriganaProps) {
  if (!html && fallback) {
    return <>{fallback}</>;
  }
  return (
    <span
      className="[&_ruby>rt]:text-[0.55em] [&_ruby>rt]:leading-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
