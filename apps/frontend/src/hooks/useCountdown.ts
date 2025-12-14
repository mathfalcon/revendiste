import {useEffect, useState} from 'react';

/**
 * Hook to create a countdown timer from a target date
 * @param targetDate - The target date to count down to
 * @returns Object with remaining time breakdown and formatted string
 */
export const useCountdown = (targetDate: Date | string | null) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!targetDate) {
      setTimeRemaining({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
        isExpired: true,
      });
      return;
    }

    const target =
      typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const targetTime = target.getTime();

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetTime - now.getTime();

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
          isExpired: true,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        total: difference,
        isExpired: false,
      });
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate?.toString()]);

  const formatTimeRemaining = (): string => {
    if (timeRemaining.isExpired) {
      return 'Tiempo expirado';
    }

    const parts: string[] = [];

    if (timeRemaining.days > 0) {
      parts.push(
        `${timeRemaining.days} ${timeRemaining.days === 1 ? 'día' : 'días'}`,
      );
    }
    if (timeRemaining.hours > 0) {
      parts.push(
        `${timeRemaining.hours} ${timeRemaining.hours === 1 ? 'hora' : 'horas'}`,
      );
    }
    if (timeRemaining.minutes > 0) {
      parts.push(
        `${timeRemaining.minutes} ${timeRemaining.minutes === 1 ? 'minuto' : 'minutos'}`,
      );
    }
    if (timeRemaining.seconds > 0 || parts.length === 0) {
      parts.push(
        `${timeRemaining.seconds} ${timeRemaining.seconds === 1 ? 'segundo' : 'segundos'}`,
      );
    }

    return parts.join(', ');
  };

  return {
    ...timeRemaining,
    formatted: formatTimeRemaining(),
  };
};
