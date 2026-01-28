import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { format } from 'date-fns';
import { Booking, Room } from './WeeklyCalendar'; // Reuse types

interface BookingListProps {
    bookings: Booking[];
    rooms: Room[];
    currentUser: any;
    onEdit: (booking: Booking) => void;
    onCancel: (booking: Booking) => void;
    onSelectUser: (user: any) => void;
}

export default function BookingList({
    bookings,
    rooms,
    currentUser,
    onEdit,
    onCancel,
    onSelectUser,
}: BookingListProps) {
    const { can } = usePermissions();

    // Group by Date
    const groupedBookings = bookings.reduce(
        (groups, booking) => {
            const dateKey = format(
                new Date(booking.start_time.replace(' ', 'T')),
                'yyyy-MM-dd',
            );
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(booking);
            return groups;
        },
        {} as Record<string, Booking[]>,
    );

    const sortedDates = Object.keys(groupedBookings).sort();

    if (bookings.length === 0) {
        return (
            <p className="py-8 text-center text-sm text-gray-500">
                No bookings found for this week.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {sortedDates.map((dateKey) => (
                <div
                    key={dateKey}
                    className="border-b border-gray-100 pb-4 last:border-0 last:pb-0 dark:border-gray-800"
                >
                    <h4 className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                        {format(new Date(dateKey), 'EEEE, MMM d')}
                    </h4>
                    <div className="space-y-2">
                        {groupedBookings[dateKey]
                            .sort(
                                (a, b) =>
                                    new Date(
                                        a.start_time.replace(' ', 'T'),
                                    ).getTime() -
                                    new Date(
                                        b.start_time.replace(' ', 'T'),
                                    ).getTime(),
                            )
                            .map((booking) => (
                                <div
                                    key={booking.id}
                                    className="group flex flex-row items-center justify-between gap-2 rounded-md px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex min-w-[50px] flex-col items-center justify-center rounded bg-gray-100 px-1.5 py-1 dark:bg-gray-700">
                                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                {format(
                                                    new Date(
                                                        booking.start_time.replace(
                                                            ' ',
                                                            'T',
                                                        ),
                                                    ),
                                                    'HH:mm',
                                                )}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                {format(
                                                    new Date(
                                                        booking.end_time.replace(
                                                            ' ',
                                                            'T',
                                                        ),
                                                    ),
                                                    'HH:mm',
                                                )}
                                            </span>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                                    {booking.title}
                                                </h4>
                                                {booking.status !==
                                                    'confirmed' && (
                                                    <Badge
                                                        variant={
                                                            booking.status ===
                                                            'cancelled'
                                                                ? 'destructive'
                                                                : 'secondary'
                                                        }
                                                        className="h-4 rounded-sm px-1 text-[9px] capitalize"
                                                    >
                                                        {booking.status}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <div
                                                        className="h-1.5 w-1.5 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                rooms.find(
                                                                    (r) =>
                                                                        r.id ===
                                                                        booking.room_id,
                                                                )?.color ||
                                                                '#ccc',
                                                        }}
                                                    ></div>
                                                    {booking.room?.name ||
                                                        'Unknown Room'}
                                                </span>
                                                <span className="text-gray-300 dark:text-gray-600">
                                                    •
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        onSelectUser(
                                                            booking.user,
                                                        )
                                                    }
                                                    className="max-w-[100px] truncate text-left hover:underline sm:max-w-none"
                                                >
                                                    By{' '}
                                                    {
                                                        booking.user.name.split(
                                                            ' ',
                                                        )[0]
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {booking.status === 'confirmed' &&
                                        currentUser &&
                                        (booking.user_id === currentUser.id ||
                                            can('bookings.edit') ||
                                            can('bookings.delete')) && (
                                            <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                                {(booking.user_id ===
                                                    currentUser.id ||
                                                    can('bookings.edit')) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            onEdit(booking)
                                                        }
                                                        className="h-7 w-7 text-gray-400 hover:text-indigo-600"
                                                    >
                                                        <IconPencil size={14} />
                                                    </Button>
                                                )}
                                                {(booking.user_id ===
                                                    currentUser.id ||
                                                    can('bookings.delete')) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            onCancel(booking)
                                                        }
                                                        className="h-7 w-7 text-gray-400 hover:text-red-600"
                                                    >
                                                        <IconTrash size={14} />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                </div>
                            ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
