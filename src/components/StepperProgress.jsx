export default function StepperProgress({ total = 7, current = 0 }) {
  return (
    <div className="wizard-stepper" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`stepper-segment ${
            i < current ? 'completed' : i === current ? 'active' : ''
          }`}
        />
      ))}
    </div>
  )
}
