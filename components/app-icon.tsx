import { Stethoscope } from "lucide-react"

interface AppIconProps {
  size?: number
  className?: string
}

export function AppIcon({ size = 24, className = "" }: AppIconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 bg-blue-500 rounded-lg opacity-20"></div>
      <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 text-white p-2 rounded-lg shadow-md">
        <Stethoscope size={size} />
      </div>
    </div>
  )
}

