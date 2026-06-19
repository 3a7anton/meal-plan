import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { getBookingTimeRemaining } from '../../store'
import { useTranslation } from '../../hooks/useTranslation'

interface BookingTimerProps {
  scheduledDate: string
  timeSlot: string
  bookingTimeLimit: number // in minutes
}

export function BookingTimer({ scheduledDate, timeSlot, bookingTimeLimit }: BookingTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() =>
    getBookingTimeRemaining(scheduledDate, timeSlot, bookingTimeLimit)
  )
  const { t } = useTranslation()

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getBookingTimeRemaining(scheduledDate, timeSlot, bookingTimeLimit)
      setTimeLeft(remaining)

      if (remaining.isExpired) {
        clearInterval(interval)
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [scheduledDate, timeSlot, bookingTimeLimit])

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-1 text-red-600 font-medium">
        <Clock className="h-4 w-4" />
        <span className="text-xs">{t('bookingClosed')}</span>
      </div>
    )
  }

  const formatTime = () => {
    if (timeLeft.hours > 0) {
      return `${timeLeft.hours}${t('hourShort')} ${timeLeft.minutes}${t('minuteShort')}`
    }
    return `${timeLeft.minutes}${t('minuteShort')}`
  }

  const getColorClass = () => {
    if (timeLeft.totalMinutes <= 15) return 'text-red-600'
    if (timeLeft.totalMinutes <= 60) return 'text-amber-600'
    return 'text-green-600'
  }

  return (
    <div className={`flex items-center gap-1 font-medium ${getColorClass()}`}>
      <Clock className="h-4 w-4 animate-pulse" />
      <span className="text-xs">
        {t('bookIn')} {formatTime()}
      </span>
    </div>
  )
}
