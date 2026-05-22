import React from "react"

type Props = React.HTMLAttributes<HTMLDivElement> & {
  maxTilt?: number
  scale?: number
  perspective?: number
  transitionMs?: number
}

export default function MouseTiltCard({
  children,
  className = "",
  ...rest
}: Props) {
  return (
    <div
      className={className}
      {...rest}
    >
      {children}
    </div>
  )
}
