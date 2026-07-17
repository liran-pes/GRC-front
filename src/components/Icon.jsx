export function Icon({ name, className, size, ...props }) {
  const dimensions = size ? { width: size, height: size } : undefined

  return (
    <svg className={className} aria-hidden="true" style={dimensions} {...props}>
      <use href={`#i-${name}`} />
    </svg>
  )
}
