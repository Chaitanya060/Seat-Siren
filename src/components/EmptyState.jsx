import { useNavigate } from 'react-router-dom'

export default function EmptyState({
  title = 'No alerts yet.',
  description = "Choose a movie and cinema. We'll watch the booking window for you.",
  ctaText = 'Create your first alert',
  onCta = null,
}) {
  const navigate = useNavigate()

  return (
    <div className="empty-state-ticket animate-fade-in">
      <div className="empty-state-icon" aria-hidden="true">🎫</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {ctaText && (
        <button
          className="btn btn-primary"
          onClick={onCta || (() => navigate('/app/alerts/new'))}
        >
          ＋ {ctaText}
        </button>
      )}
    </div>
  )
}
