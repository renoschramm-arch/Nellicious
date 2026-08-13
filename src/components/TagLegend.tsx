export function TagLegend({ items }: { items: { label: string; description: string }[] }) {
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-text-muted hover:text-text list-none w-fit">
        ⓘ Begriffe erklärt
      </summary>
      <dl className="mt-2 flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="font-medium text-text inline">{item.label}: </dt>
            <dd className="inline text-text-muted">{item.description}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
