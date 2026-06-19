import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    IconCalendar,
    IconChevronLeft,
    IconChevronRight,
    IconClock,
    IconLayoutGrid,
    IconList,
    IconMail,
    IconPencil,
    IconPhone,
    IconPlus,
    IconRepeat,
    IconTrash,
} from '@tabler/icons-react';
import {
    addDays,
    addMinutes,
    addWeeks,
    differenceInMinutes,
    endOfWeek,
    format,
    isSameDay,
    startOfWeek,
    subWeeks,
} from 'date-fns';
import React, { useState } from 'react';
import { toast } from 'sonner';
import BookingList from './BookingList';
import WeeklyCalendar from './WeeklyCalendar';

interface Room {
    id: number;
    name: string;
    capacity: number;
    location: string;
    amenities: string[];
    color: string;
    description?: string;
}

interface Booking {
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

interface Props {
    rooms: Room[];
    bookings: Booking[];
    currentDate: string;
    roomStatuses: Record<
        number,
        { status: 'busy' | 'available'; message: string }
    >;
    bookingHistory: Record<string, number>;
}

function BookingHeatmap({ history }: { history: Record<string, number> }) {
    const today = new Date();
    // Generate last 52 weeks
    const weeks = Array.from({ length: 53 }).map((_, weekIndex) => {
        // We want the last 52 weeks, ending with the current week
        // So we start from 52 weeks ago
        const weekStart = startOfWeek(subWeeks(today, 52 - weekIndex));
        return Array.from({ length: 7 }).map((_, dayIndex) => {
            return addDays(weekStart, dayIndex);
        });
    });

    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-100 dark:bg-gray-700/50';
        if (count <= 2) return 'bg-emerald-200 dark:bg-emerald-900/50';
        if (count <= 5) return 'bg-emerald-400 dark:bg-emerald-700';
        return 'bg-emerald-600 dark:bg-emerald-500';
    };

    const totalBookings = Object.values(history).reduce((a, b) => a + b, 0);

    const handleDateClick = (dateStr: string) => {
        router.visit(route('admin.bookings.index'), {
            data: { date: dateStr },
            preserveState: true,
            preserveScroll: true,
            only: ['bookings', 'currentDate'],
        });
    };

    // Calculate month labels positions
    const monthLabels: { label: string; index: number }[] = [];
    let currentMonth = -1;

    weeks.forEach((week, i) => {
        const firstDayOfWeek = week[0];
        const month = firstDayOfWeek.getMonth();

        // If month changes, adds label. We check the first week, and subsequent changes.
        // We also want to skip if the change happens very close to the end (though GitHub handles this gracefully)
        if (month !== currentMonth) {
            monthLabels.push({
                label: format(firstDayOfWeek, 'MMM'),
                index: i,
            });
            currentMonth = month;
        }
    });

    return (
        <div className="w-full overflow-x-auto">
            <div className="mb-2 text-xs text-gray-500">
                {totalBookings} bookings in the last year
            </div>

            <div className="flex">
                {/* Weekday Labels Column */}
                <div className="mr-2 flex flex-col gap-1 pt-[20px] text-[9px] text-gray-400">
                    <div className="h-2.5" /> {/* Mon (Empty or specific) */}
                    <div className="h-2.5">Mon</div>
                    <div className="h-2.5" />
                    <div className="h-2.5">Wed</div>
                    <div className="h-2.5" />
                    <div className="h-2.5">Fri</div>
                    <div className="h-2.5" />
                </div>

                <div className="flex flex-col">
                    {/* Month Labels Row */}
                    <div className="relative mb-1 flex h-4 text-[9px] text-gray-400">
                        {monthLabels.map((month, idx) => (
                            <div
                                key={idx}
                                className="absolute"
                                style={{
                                    left: `${month.index * 14}px`, // 10px width + 4px gap approx
                                }}
                            >
                                {month.label}
                            </div>
                        ))}
                    </div>

                    {/* Heatmap Grid */}
                    <div className="flex min-w-max gap-1 pb-2">
                        {weeks.map((week, i) => (
                            <div key={i} className="flex flex-col gap-1">
                                {week.map((date, j) => {
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    const count = history[dateStr] || 0;
                                    const isToday = isSameDay(date, new Date());

                                    return (
                                        <TooltipProvider key={dateStr}>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        onClick={() =>
                                                            handleDateClick(
                                                                dateStr,
                                                            )
                                                        }
                                                        className={cn(
                                                            'h-2.5 w-2.5 cursor-pointer rounded-sm transition-all hover:ring-2 hover:ring-gray-400 hover:ring-offset-1 dark:hover:ring-gray-500',
                                                            getColor(count),
                                                            isToday &&
                                                                'ring-1 ring-black ring-offset-1 dark:ring-white',
                                                        )}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="font-semibold">
                                                        {count} bookings
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(
                                                            date,
                                                            'MMM do, yyyy',
                                                        )}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-gray-400">
                <span>Less</span>
                <div className="h-2.5 w-2.5 rounded-sm bg-gray-100 dark:bg-gray-700/50" />
                <div className="h-2.5 w-2.5 rounded-sm bg-emerald-200 dark:bg-emerald-900/50" />
                <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
                <div className="h-2.5 w-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
                <span>More</span>
            </div>
        </div>
    );
}

export default function BookingIndex({
    rooms,
    bookings,
    currentDate,
    roomStatuses,
    bookingHistory,
}: Props) {
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false); // New state for room modal
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const { auth } = usePage().props as any;
    const { can } = usePermissions();
    const user = auth.user;

    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [scheduleRoom, setScheduleRoom] = useState<Room | null>(null); // For viewing schedule
    const [selectedUser, setSelectedUser] = useState<Booking['user'] | null>(
        null,
    );
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const {
        data: bookingData,
        setData: setBookingData,
        post: postBooking,
        put: putBooking,
        processing: processingBooking,
        errors: bookingErrors,
        reset: resetBooking,
        clearErrors: clearBookingErrors,
    } = useForm({
        room_id: '',
        title: '',
        start_time: '',
        end_time: '',
        description: '',
        repeat_weekly: false,
        repeat_count: 1,
    });

    // Separate form for creating rooms
    const {
        data: roomData,
        setData: setRoomData,
        post: postRoom,
        put: putRoom,
        processing: processingRoom,
        errors: roomErrors,
        reset: resetRoom,
        clearErrors: clearRoomErrors,
        delete: deleteRoom,
    } = useForm({
        name: '',
        capacity: 10,
        location: '',
        color: '#6366f1',
        description: '',
        amenities: [] as string[], // Explicitly typed as string[]
    });

    const handleBookClick = (room: Room) => {
        setSelectedRoom(room);
        setBookingData('room_id', room.id.toString());
        setIsBookingModalOpen(true);
    };

    const closeBookingModal = () => {
        setIsBookingModalOpen(false);
        resetBooking();
        clearBookingErrors();
    };

    const resetBookingForm = () => {
        resetBooking();
        clearBookingErrors();
        setEditingBooking(null);
    };

    const closeRoomModal = () => {
        setIsRoomModalOpen(false);
        resetRoom();
        clearRoomErrors();
    };

    const handleBookingSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingBooking) {
            putBooking(route('admin.bookings.update', editingBooking.id), {
                onSuccess: () => {
                    setIsBookingModalOpen(false);
                    resetBookingForm();
                    toast.success('Booking updated successfully!');
                },
                onError: () => {
                    toast.error('Failed to update booking.');
                },
            });
        } else {
            postBooking(route('admin.bookings.store'), {
                onSuccess: () => {
                    setIsBookingModalOpen(false);
                    resetBookingForm();
                    toast.success('Room booked successfully!');
                },
                onError: () => {
                    toast.error('Failed to book room.');
                },
            });
        }
    };

    const handleEditBooking = (booking: Booking) => {
        setEditingBooking(booking);
        // Find the full room object
        const room = rooms.find((r) => r.id === booking.room_id);
        setSelectedRoom(room || null);

        setBookingData({
            room_id: booking.room_id.toString(),
            title: booking.title,
            start_time: booking.start_time,
            end_time: booking.end_time,
            description: booking.description || '',
        });
        setIsBookingModalOpen(true);
    };

    const handleEditRoom = (room: Room) => {
        setEditingRoom(room);
        setRoomData({
            name: room.name,
            capacity: room.capacity,
            location: room.location,
            color: room.color,
            description: room.description || '',
            amenities: room.amenities || [],
        });
        setIsRoomModalOpen(true);
    };

    const submitRoom = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingRoom) {
            putRoom(route('admin.rooms.update', editingRoom.id), {
                onSuccess: () => {
                    setIsRoomModalOpen(false);
                    // Reset will be handled by onOpenChange
                    toast.success('Room updated successfully!');
                },
                onError: () => toast.error('Failed to update room.'),
            });
        } else {
            postRoom(route('admin.rooms.store'), {
                onSuccess: () => {
                    setIsRoomModalOpen(false);
                    // Reset will be handled by onOpenChange
                    toast.success('New room added!');
                },
                onError: () => toast.error('Failed to add room.'),
            });
        }
    };

    const resetRoomForm = () => {
        resetRoom();
        clearRoomErrors();
        setEditingRoom(null);
    };

    const handleDeleteRoom = (roomId: number) => {
        if (confirm('Are you sure? This action cannot be undone.')) {
            deleteRoom(route('admin.rooms.destroy', roomId), {
                onSuccess: () => toast.success('Room deleted.'),
            });
        }
    };

    const handleCancelBooking = (booking: Booking) => {
        if (confirm('Are you sure you want to cancel this booking?')) {
            router.post(
                route('admin.bookings.cancel', booking.id),
                {},
                {
                    onSuccess: () => toast.success('Booking cancelled.'),
                },
            );
        }
    };

    const handleSlotClick = (date: Date) => {
        // Default to first room if none selected
        const room = selectedRoom || rooms[0];
        setSelectedRoom(room);

        // Set date and time
        // Note: format is imported from date-fns
        const startStr = format(date, 'yyyy-MM-dd HH:mm');
        const endStr = format(addMinutes(date, 60), 'yyyy-MM-dd HH:mm');

        setBookingData({
            room_id: room.id.toString(),
            title: '',
            start_time: startStr,
            end_time: endStr,
            description: '',
            repeat_weekly: false,
            repeat_count: 1,
        });

        setIsBookingModalOpen(true);
    };

    const handlePrevWeek = () => {
        const prevDate = subWeeks(new Date(currentDate), 1);
        router.visit(
            route('admin.bookings.index', {
                date: format(prevDate, 'yyyy-MM-dd'),
            }),
            {
                preserveState: true,
                preserveScroll: true,
                only: ['bookings', 'currentDate'],
            },
        );
    };

    const handleNextWeek = () => {
        const nextDate = addWeeks(new Date(currentDate), 1);
        router.visit(
            route('admin.bookings.index', {
                date: format(nextDate, 'yyyy-MM-dd'),
            }),
            {
                preserveState: true,
                preserveScroll: true,
                only: ['bookings', 'currentDate'],
            },
        );
    };

    const weekStart = new Date(currentDate);
    const weekEnd = endOfWeek(weekStart);

    const breadcrumbs = [
        {
            title: 'Dashboard',
            href: route('admin.landing'),
        },
        {
            title: 'Meeting Rooms',
            href: route('admin.bookings.index'),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Meeting Rooms" />

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header Actions */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Available Rooms
                        </h2>
                        {/* Only show if authorized */}
                        {can('rooms.create') && (
                            <Button
                                onClick={() => setIsRoomModalOpen(true)}
                                className="gap-2"
                            >
                                <IconPlus className="h-4 w-4" />
                                Add Room
                            </Button>
                        )}
                    </div>

                    {/* Room Cards */}
                    <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {rooms.map((room) => {
                            const status = roomStatuses[room.id] || {
                                status: 'available',
                                message: 'Check availability',
                            };
                            const isBusy = status.status === 'busy';

                            return (
                                <div
                                    key={room.id}
                                    className="group relative flex flex-col overflow-hidden border-l-4 bg-white shadow-sm transition hover:shadow-md sm:rounded-lg dark:bg-gray-800"
                                    style={{ borderLeftColor: room.color }}
                                >
                                    {/* Status Badge */}
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <Badge
                                            variant={
                                                isBusy
                                                    ? 'destructive'
                                                    : 'default'
                                            }
                                            className={cn(
                                                'text-xs font-normal',
                                                !isBusy &&
                                                    'bg-emerald-500 hover:bg-emerald-600',
                                            )}
                                        >
                                            {status.message}
                                        </Badge>

                                        {/* Admin Actions (only visible on hover and if authorized) */}
                                        {(can('rooms.edit') ||
                                            can('rooms.delete')) && (
                                            <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                                {can('rooms.edit') && (
                                                    <button
                                                        onClick={() =>
                                                            handleEditRoom(room)
                                                        }
                                                        className="rounded-full bg-white p-1 text-gray-400 shadow-sm hover:text-indigo-600 dark:bg-gray-800"
                                                        title="Edit Room"
                                                    >
                                                        <IconPencil size={16} />
                                                    </button>
                                                )}
                                                {can('rooms.delete') && (
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteRoom(
                                                                room.id,
                                                            )
                                                        }
                                                        className="rounded-full bg-white p-1 text-gray-400 shadow-sm hover:text-red-500 dark:bg-gray-800"
                                                        title="Delete Room"
                                                    >
                                                        <IconTrash size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 p-6">
                                        {/* ... existing card content ... */}
                                        <div className="mb-4 flex items-start justify-between">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {room.name}
                                            </h3>
                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                {room.capacity} ppl
                                            </span>
                                        </div>

                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                            {room.location}
                                        </p>
                                        {room.description && (
                                            <p className="mb-4 line-clamp-2 text-xs text-gray-400 dark:text-gray-500">
                                                {room.description}
                                            </p>
                                        )}

                                        <div className="mb-6 flex flex-wrap gap-2">
                                            {room.amenities?.map(
                                                (amenity, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="rounded border border-gray-200 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-gray-500 uppercase dark:border-gray-700"
                                                    >
                                                        {amenity}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-auto flex flex-col gap-2 px-6 pb-6">
                                        {can('bookings.create') && (
                                            <Button
                                                onClick={() =>
                                                    handleBookClick(room)
                                                }
                                                className="w-full bg-gray-900 text-white hover:opacity-90 dark:bg-white dark:text-gray-900"
                                            >
                                                Book Now
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setScheduleRoom(room)
                                            }
                                            className="w-full"
                                        >
                                            View Schedule
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Booking History Heatmap */}
                    <div className="mb-6 overflow-hidden bg-white p-4 shadow-sm sm:rounded-lg sm:p-6 dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                            Booking History
                        </h3>
                        <BookingHeatmap history={bookingHistory} />
                    </div>

                    {/* Upcoming List with Filter */}
                    <div className="overflow-hidden bg-white p-4 shadow-sm sm:rounded-lg sm:p-6 dark:bg-gray-800">
                        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div className="flex w-full flex-col items-start gap-4 sm:w-auto sm:flex-row sm:items-center">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Weekly Bookings
                                </h3>
                                <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-100 p-1 sm:w-auto dark:bg-gray-700/50">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={handlePrevWeek}
                                    >
                                        <IconChevronLeft size={16} />
                                    </Button>
                                    <span className="flex-1 px-2 text-center text-sm font-medium sm:min-w-[140px]">
                                        {format(weekStart, 'MMM d')} -{' '}
                                        {format(weekEnd, 'MMM d, yyyy')}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={handleNextWeek}
                                    >
                                        <IconChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex w-full items-center gap-2 sm:w-auto">
                                <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
                                    <button
                                        onClick={() => setViewMode('calendar')}
                                        className={cn(
                                            'rounded px-2 py-1 transition-colors',
                                            viewMode === 'calendar'
                                                ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300',
                                        )}
                                        title="Calendar View"
                                    >
                                        <IconLayoutGrid size={16} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={cn(
                                            'rounded px-2 py-1 transition-colors',
                                            viewMode === 'list'
                                                ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300',
                                        )}
                                        title="List View"
                                    >
                                        <IconList size={16} />
                                    </button>
                                </div>
                                <div className="w-[180px]">
                                    <Select
                                        value={filterStatus}
                                        onValueChange={setFilterStatus}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Bookings
                                            </SelectItem>
                                            <SelectItem value="confirmed">
                                                Confirmed
                                            </SelectItem>
                                            <SelectItem value="cancelled">
                                                Cancelled
                                            </SelectItem>
                                            <SelectItem value="completed">
                                                Completed
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            {(() => {
                                const filteredBookings = bookings.filter(
                                    (b) =>
                                        filterStatus === 'all' ||
                                        b.status === filterStatus,
                                );

                                if (viewMode === 'list') {
                                    return (
                                        <BookingList
                                            bookings={filteredBookings}
                                            rooms={rooms}
                                            currentUser={user}
                                            onEdit={handleEditBooking}
                                            onCancel={handleCancelBooking}
                                            onSelectUser={(u: any) => {
                                                setSelectedUser(u);
                                                setIsUserModalOpen(true);
                                            }}
                                        />
                                    );
                                }

                                return (
                                    <WeeklyCalendar
                                        currentDate={currentDate}
                                        bookings={filteredBookings}
                                        onEventClick={handleEditBooking}
                                        onSlotClick={handleSlotClick}
                                    />
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal (existing) using isBookingModalOpen */}
            <Dialog
                open={isBookingModalOpen}
                onOpenChange={(open) => {
                    if (!open) resetBookingForm(); // Reset on close
                    setIsBookingModalOpen(open);
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingBooking ? 'Edit Booking' : 'Book Room'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingBooking
                                ? `Modify booking for ${selectedRoom?.name}`
                                : `Create a new booking for ${selectedRoom?.name}`}
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={handleBookingSubmit}
                        className="grid gap-4 py-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="title">Meeting Title</Label>
                            <Input
                                id="title"
                                value={bookingData.title}
                                onChange={(e) =>
                                    setBookingData('title', e.target.value)
                                }
                                placeholder="e.g., Weekly Sync"
                                required
                            />
                            {bookingErrors.title && (
                                <span className="text-xs text-red-500">
                                    {bookingErrors.title}
                                </span>
                            )}
                        </div>
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                            {/* Date Section */}
                            <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                                <Label className="mb-2 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                    Date
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={'outline'}
                                            className={cn(
                                                'h-11 w-full justify-start border-gray-300 bg-white text-left text-base font-normal shadow-sm dark:border-gray-600 dark:bg-gray-900',
                                                !bookingData.start_time &&
                                                    'text-muted-foreground',
                                            )}
                                        >
                                            <IconCalendar className="mr-3 h-5 w-5 opacity-70" />
                                            {bookingData.start_time ? (
                                                <span className="font-medium">
                                                    {format(
                                                        new Date(
                                                            bookingData.start_time.replace(
                                                                ' ',
                                                                'T',
                                                            ),
                                                        ),
                                                        'EEEE, MMMM do, yyyy',
                                                    )}
                                                </span>
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={
                                                bookingData.start_time
                                                    ? new Date(
                                                          bookingData.start_time.replace(
                                                              ' ',
                                                              'T',
                                                          ),
                                                      )
                                                    : undefined
                                            }
                                            onSelect={(date) => {
                                                if (!date) return;
                                                const dateStr = format(
                                                    date,
                                                    'yyyy-MM-dd',
                                                );
                                                // Preserve time if exists, else defaults
                                                let currentStartTime = '09:00';
                                                if (bookingData.start_time) {
                                                    const parsed = new Date(
                                                        bookingData.start_time.replace(
                                                            ' ',
                                                            'T',
                                                        ),
                                                    );
                                                    if (
                                                        !isNaN(parsed.getTime())
                                                    ) {
                                                        currentStartTime =
                                                            format(
                                                                parsed,
                                                                'HH:mm',
                                                            );
                                                    }
                                                }

                                                let currentEndTime = '10:00';
                                                if (bookingData.end_time) {
                                                    const parsed = new Date(
                                                        bookingData.end_time.replace(
                                                            ' ',
                                                            'T',
                                                        ),
                                                    );
                                                    if (
                                                        !isNaN(parsed.getTime())
                                                    ) {
                                                        currentEndTime = format(
                                                            parsed,
                                                            'HH:mm',
                                                        );
                                                    }
                                                }

                                                setBookingData({
                                                    ...bookingData,
                                                    start_time: `${dateStr}T${currentStartTime}`,
                                                    end_time: `${dateStr}T${currentEndTime}`,
                                                });
                                            }}
                                            disabled={(date) =>
                                                date <
                                                new Date(
                                                    new Date().setHours(
                                                        0,
                                                        0,
                                                        0,
                                                        0,
                                                    ),
                                                )
                                            }
                                            fromDate={new Date()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Time Section */}
                            <div className="bg-white p-4 dark:bg-gray-900">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    <div className="grid flex-1 gap-1.5">
                                        <Label className="text-xs text-gray-500">
                                            Start Time
                                        </Label>
                                        <Select
                                            value={(() => {
                                                if (!bookingData.start_time)
                                                    return undefined;
                                                const d = new Date(
                                                    bookingData.start_time,
                                                );
                                                return !isNaN(d.getTime())
                                                    ? format(d, 'HH:mm')
                                                    : undefined;
                                            })()}
                                            onValueChange={(time) => {
                                                // 1. Determine base date
                                                let baseDate = new Date();
                                                if (bookingData.start_time) {
                                                    const parsed = new Date(
                                                        bookingData.start_time.replace(
                                                            ' ',
                                                            'T',
                                                        ),
                                                    );
                                                    if (
                                                        !isNaN(parsed.getTime())
                                                    )
                                                        baseDate = parsed;
                                                }

                                                // 2. Construct new start using setHours/Minutes
                                                const [hours, minutes] = time
                                                    .split(':')
                                                    .map(Number);
                                                const newStartDateTime =
                                                    new Date(baseDate);
                                                newStartDateTime.setHours(
                                                    hours,
                                                    minutes,
                                                    0,
                                                    0,
                                                );

                                                if (
                                                    isNaN(
                                                        newStartDateTime.getTime(),
                                                    )
                                                ) {
                                                    console.error(
                                                        'Invalid start time calculated',
                                                    );
                                                    return;
                                                }

                                                // 3. Determine/Adjust end
                                                // Ensure end time is at least 30 mins after start default to 60 mins
                                                let newEndDateTime = addMinutes(
                                                    newStartDateTime,
                                                    60,
                                                );

                                                if (bookingData.end_time) {
                                                    const parsedEnd = new Date(
                                                        bookingData.end_time.replace(
                                                            ' ',
                                                            'T',
                                                        ),
                                                    );
                                                    // If valid end time, try to keep its time part
                                                    if (
                                                        !isNaN(
                                                            parsedEnd.getTime(),
                                                        )
                                                    ) {
                                                        const projectedEnd =
                                                            new Date(
                                                                newStartDateTime,
                                                            );
                                                        projectedEnd.setHours(
                                                            parsedEnd.getHours(),
                                                            parsedEnd.getMinutes(),
                                                            0,
                                                            0,
                                                        );

                                                        if (
                                                            !isNaN(
                                                                projectedEnd.getTime(),
                                                            ) &&
                                                            projectedEnd >
                                                                newStartDateTime
                                                        ) {
                                                            newEndDateTime =
                                                                projectedEnd;
                                                        }
                                                    }
                                                }

                                                if (
                                                    isNaN(
                                                        newEndDateTime.getTime(),
                                                    )
                                                ) {
                                                    console.error(
                                                        'Invalid end time calculated',
                                                    );
                                                    return;
                                                }

                                                setBookingData({
                                                    ...bookingData,
                                                    start_time: format(
                                                        newStartDateTime,
                                                        "yyyy-MM-dd'T'HH:mm",
                                                    ),
                                                    end_time: format(
                                                        newEndDateTime,
                                                        "yyyy-MM-dd'T'HH:mm",
                                                    ),
                                                });
                                            }}
                                        >
                                            <SelectTrigger className="h-10">
                                                <div className="flex items-center">
                                                    <IconClock className="mr-2 h-4 w-4 text-gray-400" />
                                                    <SelectValue placeholder="Start Time" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {Array.from({ length: 48 }).map(
                                                    (_, i) => {
                                                        const hour = Math.floor(
                                                            i / 2,
                                                        )
                                                            .toString()
                                                            .padStart(2, '0');
                                                        const minute =
                                                            i % 2 === 0
                                                                ? '00'
                                                                : '30';
                                                        const time = `${hour}:${minute}`;

                                                        // Availability Check logic
                                                        const isBusy = false;
                                                        let hasConflict = false;

                                                        if (
                                                            bookingData.start_time
                                                        ) {
                                                            const baseDate =
                                                                new Date(
                                                                    bookingData.start_time.replace(
                                                                        ' ',
                                                                        'T',
                                                                    ),
                                                                );
                                                            if (
                                                                !isNaN(
                                                                    baseDate.getTime(),
                                                                )
                                                            ) {
                                                                const dateStr =
                                                                    format(
                                                                        baseDate,
                                                                        'yyyy-MM-dd',
                                                                    );
                                                                const slotTime =
                                                                    new Date(
                                                                        `${dateStr}T${time}`,
                                                                    );

                                                                hasConflict =
                                                                    bookings.some(
                                                                        (b) => {
                                                                            if (
                                                                                b.room_id.toString() !==
                                                                                bookingData.room_id
                                                                            )
                                                                                return false;
                                                                            if (
                                                                                b.status !==
                                                                                'confirmed'
                                                                            )
                                                                                return false;
                                                                            if (
                                                                                editingBooking &&
                                                                                b.id ===
                                                                                    editingBooking.id
                                                                            )
                                                                                return false;

                                                                            const start =
                                                                                new Date(
                                                                                    b.start_time,
                                                                                );
                                                                            const end =
                                                                                new Date(
                                                                                    b.end_time,
                                                                                );
                                                                            return (
                                                                                slotTime >=
                                                                                    start &&
                                                                                slotTime <
                                                                                    end
                                                                            );
                                                                        },
                                                                    );
                                                            }
                                                        }

                                                        // Time Restriction Logic: Disable past times for today (unless editing?)
                                                        let isPastTime = false;
                                                        if (
                                                            bookingData.start_time
                                                        ) {
                                                            const baseDate =
                                                                new Date(
                                                                    bookingData.start_time.replace(
                                                                        ' ',
                                                                        'T',
                                                                    ),
                                                                );
                                                            if (
                                                                !isNaN(
                                                                    baseDate.getTime(),
                                                                ) &&
                                                                isSameDay(
                                                                    baseDate,
                                                                    new Date(),
                                                                )
                                                            ) {
                                                                const currentSlotTime =
                                                                    new Date(
                                                                        `${format(baseDate, 'yyyy-MM-dd')}T${time}`,
                                                                    );
                                                                // Add buffer if needed, but strictly: if slot < now => disabled
                                                                if (
                                                                    currentSlotTime <
                                                                    new Date()
                                                                ) {
                                                                    isPastTime = true;
                                                                }
                                                            }
                                                        }

                                                        return (
                                                            <SelectItem
                                                                key={time}
                                                                value={time}
                                                                disabled={
                                                                    hasConflict ||
                                                                    isPastTime
                                                                }
                                                                className={cn(
                                                                    hasConflict
                                                                        ? 'text-red-400 focus:text-red-400'
                                                                        : '',
                                                                    isPastTime &&
                                                                        'text-gray-400 opacity-50',
                                                                )}
                                                            >
                                                                <span className="flex w-full min-w-[80px] items-center justify-between">
                                                                    {time}
                                                                    {hasConflict && (
                                                                        <span className="ml-2 text-[10px] font-semibold">
                                                                            BUSY
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </SelectItem>
                                                        );
                                                    },
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {bookingErrors.start_time && (
                                            <span className="text-xs text-red-500">
                                                {bookingErrors.start_time}
                                            </span>
                                        )}
                                    </div>

                                    {/* Duration Indicator */}
                                    <div className="hidden pt-5 sm:block">
                                        <div className="h-px w-4 bg-gray-300 dark:bg-gray-600"></div>
                                    </div>

                                    <div className="grid flex-1 gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs text-gray-500">
                                                End Time
                                            </Label>
                                            {bookingData.start_time &&
                                                bookingData.end_time && (
                                                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                        {(() => {
                                                            const start =
                                                                new Date(
                                                                    bookingData.start_time.replace(
                                                                        ' ',
                                                                        'T',
                                                                    ),
                                                                );
                                                            const end =
                                                                new Date(
                                                                    bookingData.end_time.replace(
                                                                        ' ',
                                                                        'T',
                                                                    ),
                                                                );
                                                            const diff =
                                                                differenceInMinutes(
                                                                    end,
                                                                    start,
                                                                );
                                                            const hours =
                                                                Math.floor(
                                                                    diff / 60,
                                                                );
                                                            const mins =
                                                                diff % 60;
                                                            return `${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : ''}`;
                                                        })()}
                                                    </span>
                                                )}
                                        </div>
                                        <Select
                                            value={(() => {
                                                if (!bookingData.end_time)
                                                    return undefined;
                                                const d = new Date(
                                                    bookingData.end_time.replace(
                                                        ' ',
                                                        'T',
                                                    ),
                                                );
                                                return !isNaN(d.getTime())
                                                    ? format(d, 'HH:mm')
                                                    : undefined;
                                            })()}
                                            onValueChange={(time) => {
                                                let baseDate = new Date();
                                                if (bookingData.start_time) {
                                                    const parsed = new Date(
                                                        bookingData.start_time.replace(
                                                            ' ',
                                                            'T',
                                                        ),
                                                    );
                                                    if (
                                                        !isNaN(parsed.getTime())
                                                    )
                                                        baseDate = parsed;
                                                }

                                                const [hours, minutes] = time
                                                    .split(':')
                                                    .map(Number);
                                                const newEndDateTime = new Date(
                                                    baseDate,
                                                );
                                                newEndDateTime.setHours(
                                                    hours,
                                                    minutes,
                                                    0,
                                                    0,
                                                );

                                                if (
                                                    isNaN(
                                                        newEndDateTime.getTime(),
                                                    )
                                                ) {
                                                    console.error(
                                                        'Invalid end time calculated',
                                                    );
                                                    return;
                                                }

                                                setBookingData(
                                                    'end_time',
                                                    format(
                                                        newEndDateTime,
                                                        'yyyy-MM-dd HH:mm:ss',
                                                    ),
                                                );
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select time" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px]">
                                                {Array.from({ length: 48 }).map(
                                                    (_, i) => {
                                                        const hour = Math.floor(
                                                            i / 2,
                                                        )
                                                            .toString()
                                                            .padStart(2, '0');
                                                        const minute =
                                                            i % 2 === 0
                                                                ? '00'
                                                                : '30';
                                                        const time = `${hour}:${minute}`;

                                                        // Filter out times that are not after start_time
                                                        if (
                                                            bookingData.start_time
                                                        ) {
                                                            const start =
                                                                new Date(
                                                                    bookingData.start_time.replace(
                                                                        ' ',
                                                                        'T',
                                                                    ),
                                                                );
                                                            if (
                                                                !isNaN(
                                                                    start.getTime(),
                                                                )
                                                            ) {
                                                                const currentSlotTime =
                                                                    new Date(
                                                                        `${format(start, 'yyyy-MM-dd')}T${time}`,
                                                                    );
                                                                if (
                                                                    currentSlotTime <=
                                                                    start
                                                                ) {
                                                                    return null;
                                                                }
                                                            }
                                                        }

                                                        return (
                                                            <SelectItem
                                                                key={time}
                                                                value={time}
                                                            >
                                                                {time}
                                                            </SelectItem>
                                                        );
                                                    },
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {bookingErrors.end_time && (
                                            <span className="text-xs text-red-500">
                                                {bookingErrors.end_time}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Visualizer - integrated at bottom */}
                            {bookingData.start_time &&
                                !isNaN(
                                    new Date(
                                        bookingData.start_time.replace(
                                            ' ',
                                            'T',
                                        ),
                                    ).getTime(),
                                ) && (
                                    <div className="border-t border-gray-200 bg-gray-100/50 p-3 text-xs dark:border-gray-700 dark:bg-gray-800/20">
                                        {/* Content from previous visualizer logic */}
                                        <div className="mb-2 flex items-center gap-2 text-gray-500">
                                            <IconCalendar size={12} />
                                            <span className="font-medium">
                                                Other bookings this day
                                            </span>
                                        </div>
                                        <div className="max-h-24 space-y-1 overflow-y-auto pr-2">
                                            {bookings
                                                .filter(
                                                    (b) =>
                                                        b.room_id.toString() ===
                                                            bookingData.room_id &&
                                                        b.status ===
                                                            'confirmed' &&
                                                        b.id !==
                                                            editingBooking?.id &&
                                                        isSameDay(
                                                            new Date(
                                                                b.start_time.replace(
                                                                    ' ',
                                                                    'T',
                                                                ),
                                                            ),
                                                            new Date(
                                                                bookingData.start_time.replace(
                                                                    ' ',
                                                                    'T',
                                                                ),
                                                            ),
                                                        ),
                                                )
                                                .sort(
                                                    (a, b) =>
                                                        new Date(
                                                            a.start_time.replace(
                                                                ' ',
                                                                'T',
                                                            ),
                                                        ).getTime() -
                                                        new Date(
                                                            b.start_time.replace(
                                                                ' ',
                                                                'T',
                                                            ),
                                                        ).getTime(),
                                                )
                                                .map((b) => (
                                                    <div
                                                        key={b.id}
                                                        className="flex items-center justify-between rounded border border-gray-200 bg-white p-1.5 dark:border-gray-700 dark:bg-gray-800"
                                                    >
                                                        <span className="font-mono text-gray-600 dark:text-gray-400">
                                                            {format(
                                                                new Date(
                                                                    b.start_time,
                                                                ),
                                                                'HH:mm',
                                                            )}{' '}
                                                            -{' '}
                                                            {format(
                                                                new Date(
                                                                    b.end_time,
                                                                ),
                                                                'HH:mm',
                                                            )}
                                                        </span>
                                                        <span className="ml-2 max-w-[150px] truncate text-gray-900 dark:text-gray-200">
                                                            {b.title}
                                                        </span>
                                                    </div>
                                                ))}
                                            {bookings.filter(
                                                (b) =>
                                                    b.room_id.toString() ===
                                                        bookingData.room_id &&
                                                    b.status === 'confirmed' &&
                                                    b.id !==
                                                        editingBooking?.id &&
                                                    isSameDay(
                                                        new Date(
                                                            b.start_time.replace(
                                                                ' ',
                                                                'T',
                                                            ),
                                                        ),
                                                        new Date(
                                                            bookingData.start_time.replace(
                                                                ' ',
                                                                'T',
                                                            ),
                                                        ),
                                                    ),
                                            ).length === 0 && (
                                                <p className="pl-1 text-gray-400 italic">
                                                    No conflicts. You are clear!
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>
                        {/* ... */}

                        {/* Recurrence Section */}
                        {!editingBooking && (
                            <div className="flex items-start space-x-2 pt-2">
                                <Checkbox
                                    id="repeat_weekly"
                                    checked={bookingData.repeat_weekly}
                                    onCheckedChange={(checked) =>
                                        setBookingData(
                                            'repeat_weekly',
                                            checked as boolean,
                                        )
                                    }
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label
                                        htmlFor="repeat_weekly"
                                        className="flex items-center gap-2 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        <IconRepeat
                                            size={14}
                                            className="text-gray-500"
                                        />
                                        Repeat weekly
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        Book this slot for consecutive weeks.
                                    </p>

                                    {bookingData.repeat_weekly && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-sm">For</span>
                                            <Input
                                                type="number"
                                                className="h-8 w-20"
                                                min="1"
                                                max="12"
                                                value={bookingData.repeat_count}
                                                onChange={(e) =>
                                                    setBookingData(
                                                        'repeat_count',
                                                        parseInt(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                            />
                                            <span className="text-sm">
                                                weeks
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="description">
                                Description (Optional)
                            </Label>
                            <Textarea
                                id="description"
                                value={bookingData.description}
                                onChange={(e) =>
                                    setBookingData(
                                        'description',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <DialogFooter className="gap-2 sm:justify-between">
                            {editingBooking &&
                            editingBooking.status === 'confirmed' &&
                            user &&
                            (editingBooking.user_id === user.id ||
                                can('bookings.delete')) ? (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => {
                                        handleCancelBooking(editingBooking);
                                        setIsBookingModalOpen(false);
                                    }}
                                >
                                    Cancel Booking
                                </Button>
                            ) : (
                                <div />
                            )}

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsBookingModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processingBooking}
                                >
                                    {editingBooking
                                        ? 'Update Booking'
                                        : 'Confirm Booking'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!scheduleRoom}
                onOpenChange={(open) => !open && setScheduleRoom(null)}
            >
                <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: scheduleRoom?.color }}
                            />
                            {scheduleRoom?.name} Schedule
                        </DialogTitle>
                        <DialogDescription>
                            Upcoming bookings for this week.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {(() => {
                            if (!scheduleRoom) return null;
                            const roomBookings = bookings
                                .filter(
                                    (b) =>
                                        b.room_id === scheduleRoom.id &&
                                        b.status === 'confirmed' &&
                                        new Date(
                                            b.end_time.replace(' ', 'T'),
                                        ) >= new Date(),
                                )
                                .sort(
                                    (a, b) =>
                                        new Date(
                                            a.start_time.replace(' ', 'T'),
                                        ).getTime() -
                                        new Date(
                                            b.start_time.replace(' ', 'T'),
                                        ).getTime(),
                                );

                            if (roomBookings.length === 0) {
                                return (
                                    <div className="py-4 text-center text-gray-500">
                                        No bookings found for this week.
                                    </div>
                                );
                            }

                            const grouped = roomBookings.reduce(
                                (acc, booking) => {
                                    const dateKey = format(
                                        new Date(
                                            booking.start_time.replace(
                                                ' ',
                                                'T',
                                            ),
                                        ),
                                        'yyyy-MM-dd',
                                    );
                                    if (!acc[dateKey]) acc[dateKey] = [];
                                    acc[dateKey].push(booking);
                                    return acc;
                                },
                                {} as Record<string, Booking[]>,
                            );

                            return Object.keys(grouped)
                                .sort()
                                .map((dateKey) => {
                                    const date = new Date(dateKey);
                                    const isToday = isSameDay(date, new Date());
                                    return (
                                        <div
                                            key={dateKey}
                                            className="relative border-l-2 border-gray-100 pl-4 dark:border-gray-800"
                                        >
                                            <div
                                                className={cn(
                                                    'absolute top-0 -left-[5px] h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-950',
                                                    isToday
                                                        ? 'bg-indigo-500'
                                                        : 'bg-gray-300 dark:bg-gray-700',
                                                )}
                                            />
                                            <h5
                                                className={cn(
                                                    'mb-3 flex items-center gap-2 text-sm font-semibold',
                                                    isToday
                                                        ? 'text-indigo-600 dark:text-indigo-400'
                                                        : 'text-gray-500',
                                                )}
                                            >
                                                {isToday
                                                    ? 'Today'
                                                    : format(date, 'EEEE')}
                                                <span className="text-xs font-normal text-gray-400">
                                                    {format(date, 'MMM d')}
                                                </span>
                                            </h5>
                                            <div className="space-y-2">
                                                {grouped[dateKey].map(
                                                    (booking) => (
                                                        <div
                                                            key={booking.id}
                                                            className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-900/50"
                                                        >
                                                            <div className="mb-1 flex items-start justify-between">
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {format(
                                                                        new Date(
                                                                            booking.start_time,
                                                                        ),
                                                                        'HH:mm',
                                                                    )}{' '}
                                                                    -{' '}
                                                                    {format(
                                                                        new Date(
                                                                            booking.end_time,
                                                                        ),
                                                                        'HH:mm',
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="truncate text-xs text-gray-600 dark:text-gray-400">
                                                                {booking.title}{' '}
                                                                <span className="mx-1 text-gray-400">
                                                                    •
                                                                </span>{' '}
                                                                {
                                                                    booking.user
                                                                        .name
                                                                }
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                        })()}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setScheduleRoom(null)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Room Modal */}
            <Dialog
                open={isRoomModalOpen}
                onOpenChange={(open) => {
                    if (!open) resetRoomForm();
                    setIsRoomModalOpen(open);
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingRoom
                                ? 'Edit Meeting Room'
                                : 'Add New Meeting Room'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingRoom
                                ? 'Update room details.'
                                : 'Create a new space for your team.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitRoom} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="room_name">Room Name</Label>
                            <Input
                                id="room_name"
                                value={roomData.name}
                                onChange={(e) =>
                                    setRoomData('name', e.target.value)
                                }
                                placeholder="e.g. The Glass House"
                                required
                            />
                            {roomErrors.name && (
                                <span className="text-xs text-red-500">
                                    {roomErrors.name}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="capacity">Capacity</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={roomData.capacity}
                                    onChange={(e) =>
                                        setRoomData(
                                            'capacity',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    required
                                    min="1"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="color">Color Code</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="color"
                                        type="color"
                                        className="h-10 w-12 p-1"
                                        value={roomData.color}
                                        onChange={(e) =>
                                            setRoomData('color', e.target.value)
                                        }
                                    />
                                    <Input
                                        type="text"
                                        value={roomData.color}
                                        onChange={(e) =>
                                            setRoomData('color', e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={roomData.location}
                                onChange={(e) =>
                                    setRoomData('location', e.target.value)
                                }
                                placeholder="e.g. 2nd Floor, West Wing"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="room_description">
                                Description
                            </Label>
                            <Textarea
                                id="room_description"
                                value={roomData.description}
                                onChange={(e) =>
                                    setRoomData('description', e.target.value)
                                }
                                placeholder="e.g. Equipped with high-end video conferencing gear."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Amenities (Comma separated)</Label>
                            <Input
                                placeholder="TV, Whiteboard, Coffee Machine"
                                onChange={(e) =>
                                    setRoomData(
                                        'amenities',
                                        e.target.value
                                            .split(',')
                                            .map((s) => s.trim()),
                                    )
                                }
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeRoomModal}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processingRoom}>
                                Create Room
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* User Info Dialog */}
            <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>User Information</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-6">
                            <Avatar className="h-24 w-24">
                                <AvatarImage
                                    src={selectedUser.avatar}
                                    alt={selectedUser.name}
                                />
                                <AvatarFallback className="text-xl">
                                    {selectedUser.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase()
                                        .substring(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {selectedUser.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Booking Contact
                                </p>
                            </div>

                            <div className="flex w-full flex-col gap-2 px-6">
                                {selectedUser.email && (
                                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                <IconMail size={16} />
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-xs text-gray-500">
                                                    Email
                                                </span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {selectedUser.email}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                        >
                                            <a
                                                href={`mailto:${selectedUser.email}`}
                                                title="Send Email"
                                            >
                                                <IconMail size={16} />
                                            </a>
                                        </Button>
                                    </div>
                                )}

                                {selectedUser.phone && (
                                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                <IconPhone size={16} />
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-xs text-gray-500">
                                                    Phone
                                                </span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {selectedUser.phone}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                        >
                                            <a
                                                href={`tel:${selectedUser.phone}`}
                                                title="Call"
                                            >
                                                <IconPhone size={16} />
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsUserModalOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
