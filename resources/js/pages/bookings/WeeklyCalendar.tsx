import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    addDays,
    differenceInMinutes,
    format,
    isSameDay,
    setHours,
    setMinutes,
} from 'date-fns';
import { useMemo } from 'react';

export interface Room {
    id: number;
    name: string;
    capacity: number;
    location: string;
    amenities: string[];
    color: string;
    description?: string;
}

export interface Booking {
    id: number;
    start_time: string;
    end_time: string;
    title: string;
    status: 'confirmed' | 'cancelled' | 'completed';
    room_id: number;
    user_id: number;
    user: {
        id: number;
        name: string;
        avatar: string;
        email?: string;
        phone?: string;
    };
    description?: string;
    room?: Room;
}

interface WeeklyCalendarProps {
    currentDate: string;
    bookings: Booking[];
    onEventClick: (booking: Booking) => void;
    onSlotClick: (date: Date) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

export default function WeeklyCalendar({
    currentDate,
    bookings,
    onEventClick,
    onSlotClick,
}: WeeklyCalendarProps) {
    const weekStart = useMemo(() => new Date(currentDate), [currentDate]);

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    }, [weekStart]);

    const getEventStyle = (booking: Booking) => {
        const start = new Date(booking.start_time.replace(' ', 'T'));
        const end = new Date(booking.end_time.replace(' ', 'T'));

        // Calculate top offset (minutes from 8:00 AM)
        const startOfDayTime = setMinutes(setHours(start, 8), 0);
        const minutesFromStart = differenceInMinutes(start, startOfDayTime);
        const top = Math.max(0, (minutesFromStart / 60) * 64); // 64px per hour

        // Calculate height
        const duration = differenceInMinutes(end, start);
        const height = (duration / 60) * 64;

        return {
            top: `${top}px`,
            height: `${height}px`,
            backgroundColor: booking.room?.color || '#3b82f6',
        };
    };

    return (
        <div className="flex h-[800px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {/* Header: Days */}
            <div className="flex border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                <div className="sticky left-0 z-10 w-16 shrink-0 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"></div>
                <div className="grid flex-1 grid-cols-7 divide-x divide-gray-200 dark:divide-gray-700">
                    {weekDays.map((date) => {
                        const isToday = isSameDay(date, new Date());
                        return (
                            <div
                                key={date.toString()}
                                className={cn(
                                    'py-3 text-center text-sm font-semibold',
                                    isToday
                                        ? 'bg-indigo-50/50 text-indigo-600 dark:bg-indigo-900/10 dark:text-indigo-400'
                                        : 'text-gray-700 dark:text-gray-300',
                                )}
                            >
                                <div className="text-xs font-medium text-gray-500 uppercase">
                                    {format(date, 'EEE')}
                                </div>
                                <div
                                    className={cn(
                                        'mt-1 text-lg',
                                        isToday && 'font-bold',
                                    )}
                                >
                                    {format(date, 'd')}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Scrollable Grid */}
            <div className="relative flex-1 overflow-y-auto">
                <div className="flex min-w-[800px]">
                    {' '}
                    {/* Ensure min-width for horizontal scroll on mobile */}
                    {/* Time Column */}
                    <div className="sticky left-0 z-10 flex w-16 shrink-0 flex-col divide-y divide-gray-100 border-r border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-700 dark:bg-gray-800">
                        {HOURS.map((hour) => (
                            <div
                                key={hour}
                                className="relative -mt-2.5 h-16 pt-2 pr-2 text-right text-xs text-gray-400"
                            >
                                {hour}:00
                            </div>
                        ))}
                    </div>
                    {/* Days Columns */}
                    <div className="relative grid flex-1 grid-cols-7 divide-x divide-gray-200 dark:divide-gray-700">
                        {/* Background Grid Lines */}
                        <div className="pointer-events-none absolute inset-0 z-0 flex flex-col">
                            {HOURS.map((hour) => (
                                <div
                                    key={`grid-${hour}`}
                                    className="h-16 w-full border-b border-dashed border-gray-100 dark:border-gray-800"
                                />
                            ))}
                        </div>

                        {weekDays.map((date) => (
                            <div
                                key={date.toString()}
                                className="group relative h-[832px]"
                            >
                                {' '}
                                {/* 13 hours * 64px */}
                                {/* Click handlers for slots */}
                                {HOURS.map((hour) => (
                                    <div
                                        key={`slot-${hour}`}
                                        className="absolute z-0 h-16 w-full cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                                        style={{ top: `${(hour - 8) * 64}px` }}
                                        onClick={() => {
                                            const slotDate = setMinutes(
                                                setHours(date, hour),
                                                0,
                                            );
                                            onSlotClick(slotDate);
                                        }}
                                    />
                                ))}
                                {/* Events */}
                                {bookings
                                    .filter((b) =>
                                        isSameDay(
                                            new Date(
                                                b.start_time.replace(' ', 'T'),
                                            ),
                                            date,
                                        ),
                                    )
                                    .map((booking) => (
                                        <TooltipProvider key={booking.id}>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className="absolute inset-x-1 z-10 cursor-pointer overflow-hidden rounded border border-white/20 px-2 py-1 text-xs text-white shadow-sm transition-all hover:z-20 hover:brightness-95"
                                                        style={getEventStyle(
                                                            booking,
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEventClick(
                                                                booking,
                                                            );
                                                        }}
                                                    >
                                                        <div className="truncate font-semibold">
                                                            {booking.title}
                                                        </div>
                                                        <div className="flex items-center gap-1 truncate text-[10px] opacity-90">
                                                            <Avatar className="inline-block h-3 w-3">
                                                                <AvatarImage
                                                                    src={
                                                                        booking
                                                                            .user
                                                                            .avatar
                                                                    }
                                                                />
                                                                <AvatarFallback className="bg-black/20 text-[6px] text-white">
                                                                    {
                                                                        booking
                                                                            .user
                                                                            .name[0]
                                                                    }
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            {format(
                                                                new Date(
                                                                    booking.start_time.replace(
                                                                        ' ',
                                                                        'T',
                                                                    ),
                                                                ),
                                                                'HH:mm',
                                                            )}
                                                            {' - '}
                                                            {format(
                                                                new Date(
                                                                    booking.end_time.replace(
                                                                        ' ',
                                                                        'T',
                                                                    ),
                                                                ),
                                                                'HH:mm',
                                                            )}
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className="text-xs">
                                                        <p className="font-bold">
                                                            {booking.title}
                                                        </p>
                                                        <p>
                                                            {format(
                                                                new Date(
                                                                    booking.start_time.replace(
                                                                        ' ',
                                                                        'T',
                                                                    ),
                                                                ),
                                                                'h:mm a',
                                                            )}{' '}
                                                            -{' '}
                                                            {format(
                                                                new Date(
                                                                    booking.end_time.replace(
                                                                        ' ',
                                                                        'T',
                                                                    ),
                                                                ),
                                                                'h:mm a',
                                                            )}
                                                        </p>
                                                        <p className="text-gray-400">
                                                            {booking.room?.name}{' '}
                                                            •{' '}
                                                            {booking.user.name}
                                                        </p>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
