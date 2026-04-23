import { Loader2 } from 'lucide-react'

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  )
}
