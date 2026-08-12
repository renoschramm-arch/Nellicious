export function PageFlatlay({ file }: { file: string }) {
  const src = `${import.meta.env.BASE_URL}backgrounds/${file}`
  return (
    <div
      className="page-flatlay"
      style={{ backgroundImage: `url(${src})` }}
      aria-hidden="true"
    />
  )
}
