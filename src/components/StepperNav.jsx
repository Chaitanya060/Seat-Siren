import StepperProgress from './StepperProgress'

export default function StepperNav({ total = 7, current = 0 }) {
  return <StepperProgress total={total} current={current} />
}
