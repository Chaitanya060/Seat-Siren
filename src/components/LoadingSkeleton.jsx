export default function LoadingSkeleton({ count = 2 }) {
  return (
    <div style={{ width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-shimmer" />
        </div>
      ))}
    </div>
  )
}
