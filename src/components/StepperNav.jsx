export default function StepperNav({ total, current }) {
  return (
    <div className="stepper" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`seg ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`}
        />
      ))}
    </div>
  )
}
