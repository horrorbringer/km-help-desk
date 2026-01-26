import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { IconPlus, IconTrash, IconCalendar } from "@tabler/icons-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMinutes, parse, isPast, addWeeks, subWeeks, startOfWeek, endOfWeek, isSameDay, isWithinInterval, differenceInMinutes } from "date-fns";
import { IconClock, IconRepeat } from "@tabler/icons-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { IconChevronLeft, IconChevronRight, IconPencil } from "@tabler/icons-react";

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
    };
}

interface Props {
    rooms: Room[];
    bookings: Booking[];
    currentDate: string;
    roomStatuses: Record<number, { status: 'busy' | 'available', message: string }>;
}

export default function BookingIndex({ rooms, bookings, currentDate, roomStatuses }: Props) {
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false); // New state for room modal
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const { auth } = usePage().props as any;

    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [scheduleRoom, setScheduleRoom] = useState<Room | null>(null); // For viewing schedule

    const { data: bookingData, setData: setBookingData, post: postBooking, put: putBooking, processing: processingBooking, errors: bookingErrors, reset: resetBooking, clearErrors: clearBookingErrors } = useForm({
        room_id: '',
        title: '',
        start_time: '',
        end_time: '',
        description: '',
        repeat_weekly: false,
        repeat_count: 1
    });

    // Separate form for creating rooms
    const { data: roomData, setData: setRoomData, post: postRoom, put: putRoom, processing: processingRoom, errors: roomErrors, reset: resetRoom, clearErrors: clearRoomErrors, delete: deleteRoom } = useForm({
        name: '',
        capacity: 10,
        location: '',
        color: '#6366f1',
        description: '',
        amenities: [] as string[] // Explicitly typed as string[]
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
                    toast.success("Booking updated successfully!");
                },
                onError: () => {
                    toast.error("Failed to update booking.");
                }
            });
        } else {
            postBooking(route('admin.bookings.store'), {
                onSuccess: () => {
                    setIsBookingModalOpen(false);
                    resetBookingForm();
                    toast.success("Room booked successfully!");
                },
                onError: () => {
                    toast.error("Failed to book room.");
                }
            });
        }
    };

    const handleEditBooking = (booking: Booking) => {
        setEditingBooking(booking);
        // Find the full room object
        const room = rooms.find(r => r.id === booking.room_id);
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
            amenities: room.amenities || []
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
                    toast.success("Room updated successfully!");
                },
                onError: () => toast.error("Failed to update room.")
            });
        } else {
            postRoom(route('admin.rooms.store'), {
                onSuccess: () => {
                    setIsRoomModalOpen(false);
                    // Reset will be handled by onOpenChange
                    toast.success("New room added!");
                },
                onError: () => toast.error("Failed to add room.")
            });
        }
    };

    const resetRoomForm = () => {
        resetRoom();
        clearRoomErrors();
        setEditingRoom(null);
    }

    const handleDeleteRoom = (roomId: number) => {
        if (confirm("Are you sure? This action cannot be undone.")) {
            deleteRoom(route('admin.rooms.destroy', roomId), {
                onSuccess: () => toast.success("Room deleted.")
            });
        }
    }

    const handleCancelBooking = (booking: Booking) => {
        if (confirm("Are you sure you want to cancel this booking?")) {
            router.post(route('admin.bookings.cancel', booking.id), {}, {
                onSuccess: () => toast.success("Booking cancelled.")
            });
        }
    };

    const handlePrevWeek = () => {
        const prevDate = subWeeks(new Date(currentDate), 1);
        router.visit(route('admin.bookings.index', { date: format(prevDate, 'yyyy-MM-dd') }), {
            preserveState: true,
            preserveScroll: true,
            only: ['bookings', 'currentDate']
        });
    };

    const handleNextWeek = () => {
        const nextDate = addWeeks(new Date(currentDate), 1);
        router.visit(route('admin.bookings.index', { date: format(nextDate, 'yyyy-MM-dd') }), {
            preserveState: true,
            preserveScroll: true,
            only: ['bookings', 'currentDate']
        });
    };

    const weekStart = new Date(currentDate);
    const weekEnd = endOfWeek(weekStart);

    const breadcrumbs = [
        {
            title: 'Dashboard',
            href: route('dashboard'),
        },
        {
            title: 'Meeting Rooms',
            href: route('admin.bookings.index'),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Meeting Rooms" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">

                    {/* Header Actions */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Available Rooms</h2>
                        {/* Only show if admin using a simple check or permissions if available (simplified here) */}
                        {auth.user && (
                            <Button onClick={() => setIsRoomModalOpen(true)} className="gap-2">
                                <IconPlus className="w-4 h-4" />
                                Add Room
                            </Button>
                        )}
                    </div>

                    {/* Room Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                        {rooms.map((room) => {
                            const status = roomStatuses[room.id] || { status: 'available', message: 'Check availability' };
                            const isBusy = status.status === 'busy';

                            return (
                                <div
                                    key={room.id}
                                    className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg border-l-4 transition hover:shadow-md flex flex-col relative group"
                                    style={{ borderLeftColor: room.color }}
                                >
                                    {/* Status Badge */}
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <Badge variant={isBusy ? "destructive" : "default"} className={cn("text-xs font-normal", !isBusy && "bg-emerald-500 hover:bg-emerald-600")}>
                                            {status.message}
                                        </Badge>

                                        {/* Admin Actions (only visible on hover and if authorized) */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button
                                                onClick={() => handleEditRoom(room)}
                                                className="p-1 text-gray-400 hover:text-indigo-600 bg-white dark:bg-gray-800 rounded-full shadow-sm"
                                                title="Edit Room"
                                            >
                                                <IconPencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRoom(room.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 bg-white dark:bg-gray-800 rounded-full shadow-sm"
                                                title="Delete Room"
                                            >
                                                <IconTrash size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 flex-1">
                                        {/* ... existing card content ... */}
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{room.name}</h3>
                                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                {room.capacity} ppl
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{room.location}</p>
                                        {room.description && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 line-clamp-2">{room.description}</p>
                                        )}

                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {room.amenities?.map((amenity, idx) => (
                                                <span key={idx} className="text-[10px] uppercase font-semibold tracking-wider text-gray-500 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded">
                                                    {amenity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 mt-auto px-6 pb-6">
                                        <Button
                                            onClick={() => handleBookClick(room)}
                                            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90"
                                        >
                                            Book Now
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setScheduleRoom(room)}
                                            className="w-full"
                                        >
                                            View Schedule
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Upcoming List with Filter */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Weekly Bookings</h3>
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevWeek}>
                                        <IconChevronLeft size={16} />
                                    </Button>
                                    <span className="text-sm font-medium px-2 min-w-[140px] text-center">
                                        {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                                    </span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextWeek}>
                                        <IconChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>
                            <div className="w-[180px]">
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Bookings</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {(() => {
                                // 1. Filter bookings
                                const filteredBookings = bookings.filter(b => filterStatus === 'all' || b.status === filterStatus);

                                // 2. Group by Date
                                const groupedBookings = filteredBookings.reduce((groups, booking) => {
                                    const dateKey = format(new Date(booking.start_time), 'yyyy-MM-dd');
                                    if (!groups[dateKey]) {
                                        groups[dateKey] = [];
                                    }
                                    groups[dateKey].push(booking);
                                    return groups;
                                }, {} as Record<string, Booking[]>);

                                // 3. Sort Dates
                                const sortedDates = Object.keys(groupedBookings).sort();

                                if (filteredBookings.length === 0) {
                                    return <p className="text-center text-gray-500 py-8">No bookings found for this week.</p>;
                                }

                                return sortedDates.map(dateKey => (
                                    <div key={dateKey}>
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">
                                            {format(new Date(dateKey), 'EEEE, MMM d')}
                                        </h4>
                                        <div className="space-y-3">
                                            {groupedBookings[dateKey]
                                                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                                                .map(booking => (
                                                    <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-center min-w-[80px]">
                                                                <div className="font-bold text-gray-900 dark:text-white">
                                                                    {format(new Date(booking.start_time), 'HH:mm')}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    to {format(new Date(booking.end_time), 'HH:mm')}
                                                                </div>
                                                            </div>

                                                            {/* Vertical Divider */}
                                                            <div className="h-10 w-px bg-gray-200 dark:bg-gray-600"></div>

                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{booking.title}</h4>
                                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rooms.find(r => r.id === booking.room_id)?.color || '#ccc' }}></div>
                                                                        {booking.room?.name || 'Unknown Room'}
                                                                    </span>
                                                                    {booking.status !== 'confirmed' && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <Badge variant={
                                                                                booking.status === 'cancelled' ? 'destructive' : 'secondary'
                                                                            } className="capitalize text-[10px] h-5 px-1.5">
                                                                                {booking.status}
                                                                            </Badge>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="text-right hidden sm:block">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.user.name}</div>
                                                            </div>

                                                            {/* Actions */}
                                                            {booking.status === 'confirmed' && auth.user && (booking.user_id === auth.user.id || auth.user.roles?.includes('admin')) && (
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleEditBooking(booking)}
                                                                        className="h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                                    >
                                                                        <IconPencil size={16} />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleCancelBooking(booking)}
                                                                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                    >
                                                                        <IconTrash size={16} />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal (existing) using isBookingModalOpen */}
            <Dialog open={isBookingModalOpen} onOpenChange={(open) => {
                if (!open) resetBookingForm(); // Reset on close
                setIsBookingModalOpen(open);
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingBooking ? 'Edit Booking' : 'Book Room'}</DialogTitle>
                        <DialogDescription>
                            {editingBooking
                                ? `Modify booking for ${selectedRoom?.name}`
                                : `Create a new booking for ${selectedRoom?.name}`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBookingSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Meeting Title</Label>
                            <Input
                                id="title"
                                value={bookingData.title}
                                onChange={(e) => setBookingData('title', e.target.value)}
                                placeholder="e.g., Weekly Sync"
                                required
                            />
                            {bookingErrors.title && <span className="text-red-500 text-xs">{bookingErrors.title}</span>}
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Date Section */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-11 text-base shadow-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900",
                                                !bookingData.start_time && "text-muted-foreground"
                                            )}
                                        >
                                            <IconCalendar className="mr-3 h-5 w-5 opacity-70" />
                                            {bookingData.start_time ? (
                                                <span className="font-medium">{format(new Date(bookingData.start_time), "EEEE, MMMM do, yyyy")}</span>
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={bookingData.start_time ? new Date(bookingData.start_time) : undefined}
                                            onSelect={(date) => {
                                                if (!date) return;
                                                const dateStr = format(date, 'yyyy-MM-dd');
                                                // Preserve time if exists, else defaults
                                                const currentStartTime = bookingData.start_time ? format(new Date(bookingData.start_time), 'HH:mm') : '09:00';
                                                const currentEndTime = bookingData.end_time ? format(new Date(bookingData.end_time), 'HH:mm') : '10:00';

                                                setBookingData({
                                                    ...bookingData,
                                                    start_time: `${dateStr}T${currentStartTime}`,
                                                    end_time: `${dateStr}T${currentEndTime}`
                                                });
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Time Section */}
                            <div className="p-4 bg-white dark:bg-gray-900">
                                <div className="flex items-center gap-4">
                                    <div className="grid gap-1.5 flex-1">
                                        <Label className="text-xs text-gray-500">Start Time</Label>
                                        <Select
                                            value={(() => {
                                                if (!bookingData.start_time) return undefined;
                                                const d = new Date(bookingData.start_time);
                                                return !isNaN(d.getTime()) ? format(d, 'HH:mm') : undefined;
                                            })()}
                                            onValueChange={(time) => {
                                                // 1. Determine base date
                                                let baseDate = new Date();
                                                if (bookingData.start_time) {
                                                    const parsed = new Date(bookingData.start_time);
                                                    if (!isNaN(parsed.getTime())) baseDate = parsed;
                                                }
                                                const dateStr = format(baseDate, 'yyyy-MM-dd');

                                                // 2. Construct new start
                                                const newStartDateTime = new Date(`${dateStr}T${time}`);

                                                // 3. Determine/Adjust end
                                                // Ensure end time is at least 30 mins after start default to 60 mins
                                                let newEndDateTime = addMinutes(newStartDateTime, 60);

                                                if (bookingData.end_time) {
                                                    const parsedEnd = new Date(bookingData.end_time);
                                                    // If valid end time, try to keep its time part
                                                    if (!isNaN(parsedEnd.getTime())) {
                                                        const endTimeStr = format(parsedEnd, 'HH:mm');
                                                        // Reconstruct end on the same date as start
                                                        const projectedEnd = new Date(`${dateStr}T${endTimeStr}`);
                                                        if (projectedEnd > newStartDateTime) {
                                                            newEndDateTime = projectedEnd;
                                                        }
                                                    }
                                                }

                                                setBookingData({
                                                    ...bookingData,
                                                    start_time: format(newStartDateTime, "yyyy-MM-dd'T'HH:mm"),
                                                    end_time: format(newEndDateTime, "yyyy-MM-dd'T'HH:mm")
                                                });
                                            }}
                                        >
                                            <SelectTrigger className="h-10">
                                                <div className="flex items-center">
                                                    <IconClock className="w-4 h-4 mr-2 text-gray-400" />
                                                    <SelectValue placeholder="Start Time" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {Array.from({ length: 48 }).map((_, i) => {
                                                    const hour = Math.floor(i / 2).toString().padStart(2, '0');
                                                    const minute = (i % 2 === 0 ? '00' : '30');
                                                    const time = `${hour}:${minute}`;

                                                    // Availability Check logic
                                                    let isBusy = false;
                                                    let hasConflict = false;

                                                    if (bookingData.start_time) {
                                                        const baseDate = new Date(bookingData.start_time);
                                                        if (!isNaN(baseDate.getTime())) {
                                                            const dateStr = format(baseDate, 'yyyy-MM-dd');
                                                            const slotTime = new Date(`${dateStr}T${time}`);

                                                            hasConflict = initialBookings.some(b => {
                                                                if (b.room_id.toString() !== bookingData.room_id) return false;
                                                                if (b.status !== 'confirmed') return false;
                                                                if (editingBooking && b.id === editingBooking.id) return false;

                                                                const start = new Date(b.start_time);
                                                                const end = new Date(b.end_time);
                                                                return slotTime >= start && slotTime < end;
                                                            });
                                                        }
                                                    }

                                                    return (
                                                        <SelectItem key={time} value={time} disabled={hasConflict} className={hasConflict ? "text-red-400 focus:text-red-400" : ""}>
                                                            <span className="flex items-center justify-between w-full min-w-[80px]">
                                                                {time}
                                                                {hasConflict && <span className="text-[10px] ml-2 font-semibold">BUSY</span>}
                                                            </span>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        {bookingErrors.start_time && <span className="text-red-500 text-xs">{bookingErrors.start_time}</span>}
                                    </div>

                                    {/* Duration Indicator */}
                                    <div className="pt-5 hidden sm:block">
                                        <div className="h-px w-4 bg-gray-300 dark:bg-gray-600"></div>
                                    </div>

                                    <div className="grid gap-1.5 flex-1">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs text-gray-500">End Time</Label>
                                            {bookingData.start_time && bookingData.end_time && (
                                                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                                                    {(() => {
                                                        const start = new Date(bookingData.start_time);
                                                        const end = new Date(bookingData.end_time);
                                                        const diff = differenceInMinutes(end, start);
                                                        const hours = Math.floor(diff / 60);
                                                        const mins = diff % 60;
                                                        return `${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : ''}`;
                                                    })()}
                                                </span>
                                            )}
                                        </div>
                                        <Select
                                            value={(() => {
                                                if (!bookingData.end_time) return undefined;
                                                const d = new Date(bookingData.end_time);
                                                return !isNaN(d.getTime()) ? format(d, 'HH:mm') : undefined;
                                            })()}
                                            onValueChange={(time) => {
                                                let baseDate = new Date();
                                                if (bookingData.start_time) {
                                                    const parsed = new Date(bookingData.start_time);
                                                    if (!isNaN(parsed.getTime())) baseDate = parsed;
                                                }
                                                const dateStr = format(baseDate, 'yyyy-MM-dd');
                                                setBookingData('end_time', `${dateStr}T${time}`);
                                            }}
                                        >
                                            <SelectTrigger className="h-10">
                                                <div className="flex items-center">
                                                    <IconClock className="w-4 h-4 mr-2 text-gray-400" />
                                                    <SelectValue placeholder="End Time" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {Array.from({ length: 48 }).map((_, i) => {
                                                    const hour = Math.floor(i / 2).toString().padStart(2, '0');
                                                    const minute = (i % 2 === 0 ? '00' : '30');
                                                    const time = `${hour}:${minute}`;

                                                    // Filter out times that are not after start_time
                                                    if (bookingData.start_time) {
                                                        const start = new Date(bookingData.start_time);
                                                        if (!isNaN(start.getTime())) {
                                                            const currentSlotTime = new Date(`${format(start, 'yyyy-MM-dd')}T${time}`);
                                                            if (currentSlotTime <= start) {
                                                                return null;
                                                            }
                                                        }
                                                    }

                                                    return (
                                                        <SelectItem key={time} value={time}>
                                                            {time}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        {bookingErrors.end_time && <span className="text-red-500 text-xs">{bookingErrors.end_time}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Visualizer - integrated at bottom */}
                            {bookingData.start_time && !isNaN(new Date(bookingData.start_time).getTime()) && (
                                <div className="bg-gray-100/50 dark:bg-gray-800/20 p-3 text-xs border-t border-gray-200 dark:border-gray-700">
                                    {/* Content from previous visualizer logic */}
                                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                                        <IconCalendar size={12} />
                                        <span className="font-medium">Other bookings this day</span>
                                    </div>
                                    <div className="space-y-1 max-h-24 overflow-y-auto pr-2">
                                        {initialBookings
                                            .filter(b =>
                                                b.room_id.toString() === bookingData.room_id &&
                                                b.status === 'confirmed' &&
                                                b.id !== editingBooking?.id &&
                                                isSameDay(new Date(b.start_time), new Date(bookingData.start_time))
                                            )
                                            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                                            .map(b => (
                                                <div key={b.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-1.5 rounded border border-gray-200 dark:border-gray-700">
                                                    <span className="font-mono text-gray-600 dark:text-gray-400">
                                                        {format(new Date(b.start_time), 'HH:mm')} - {format(new Date(b.end_time), 'HH:mm')}
                                                    </span>
                                                    <span className="truncate max-w-[150px] text-gray-900 dark:text-gray-200 ml-2">{b.title}</span>
                                                </div>
                                            ))}
                                        {initialBookings.filter(b =>
                                            b.room_id.toString() === bookingData.room_id &&
                                            b.status === 'confirmed' &&
                                            b.id !== editingBooking?.id &&
                                            isSameDay(new Date(b.start_time), new Date(bookingData.start_time))
                                        ).length === 0 && (
                                                <p className="text-gray-400 italic pl-1">No conflicts. You are clear!</p>
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
                                    onCheckedChange={(checked) => setBookingData('repeat_weekly', checked as boolean)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label
                                        htmlFor="repeat_weekly"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                    >
                                        <IconRepeat size={14} className="text-gray-500" />
                                        Repeat weekly
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        Book this slot for consecutive weeks.
                                    </p>

                                    {bookingData.repeat_weekly && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-sm">For</span>
                                            <Input
                                                type="number"
                                                className="w-20 h-8"
                                                min="1"
                                                max="12"
                                                value={bookingData.repeat_count}
                                                onChange={(e) => setBookingData('repeat_count', parseInt(e.target.value))}
                                            />
                                            <span className="text-sm">weeks</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={bookingData.description}
                                onChange={(e) => setBookingData('description', e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsBookingModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processingBooking}>
                                {editingBooking ? 'Update Booking' : 'Confirm Booking'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!scheduleRoom} onOpenChange={(open) => !open && setScheduleRoom(null)}>
                <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scheduleRoom?.color }} />
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
                                .filter(b => b.room_id === scheduleRoom.id && b.status === 'confirmed')
                                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                            if (roomBookings.length === 0) {
                                return <div className="text-center text-gray-500 py-4">No bookings found for this week.</div>;
                            }

                            const grouped = roomBookings.reduce((acc, booking) => {
                                const dateKey = format(new Date(booking.start_time), 'yyyy-MM-dd');
                                if (!acc[dateKey]) acc[dateKey] = [];
                                acc[dateKey].push(booking);
                                return acc;
                            }, {} as Record<string, Booking[]>);

                            return Object.keys(grouped).sort().map(dateKey => {
                                const date = new Date(dateKey);
                                const isToday = isSameDay(date, new Date());
                                return (
                                    <div key={dateKey} className="relative pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                                        <div className={cn(
                                            "absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-950",
                                            isToday ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-700"
                                        )} />
                                        <h5 className={cn(
                                            "font-semibold mb-3 text-sm flex items-center gap-2",
                                            isToday ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500"
                                        )}>
                                            {isToday ? "Today" : format(date, 'EEEE')}
                                            <span className="font-normal text-gray-400 text-xs">
                                                {format(date, 'MMM d')}
                                            </span>
                                        </h5>
                                        <div className="space-y-2">
                                            {grouped[dateKey].map(booking => (
                                                <div key={booking.id} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md text-sm">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                                            {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-600 dark:text-gray-400 truncate text-xs">
                                                        {booking.title} <span className="text-gray-400 mx-1">•</span> {booking.user.name}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setScheduleRoom(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Room Modal */}
            <Dialog open={isRoomModalOpen} onOpenChange={(open) => {
                if (!open) resetRoomForm();
                setIsRoomModalOpen(open);
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingRoom ? 'Edit Meeting Room' : 'Add New Meeting Room'}</DialogTitle>
                        <DialogDescription>
                            {editingRoom ? 'Update room details.' : 'Create a new space for your team.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitRoom} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="room_name">Room Name</Label>
                            <Input
                                id="room_name"
                                value={roomData.name}
                                onChange={(e) => setRoomData('name', e.target.value)}
                                placeholder="e.g. The Glass House"
                                required
                            />
                            {roomErrors.name && <span className="text-red-500 text-xs">{roomErrors.name}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="capacity">Capacity</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={roomData.capacity}
                                    onChange={(e) => setRoomData('capacity', parseInt(e.target.value))}
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
                                        className="w-12 p-1 h-10"
                                        value={roomData.color}
                                        onChange={(e) => setRoomData('color', e.target.value)}
                                    />
                                    <Input
                                        type="text"
                                        value={roomData.color}
                                        onChange={(e) => setRoomData('color', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={roomData.location}
                                onChange={(e) => setRoomData('location', e.target.value)}
                                placeholder="e.g. 2nd Floor, West Wing"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="room_description">Description</Label>
                            <Textarea
                                id="room_description"
                                value={roomData.description}
                                onChange={(e) => setRoomData('description', e.target.value)}
                                placeholder="e.g. Equipped with high-end video conferencing gear."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Amenities (Comma separated)</Label>
                            <Input
                                placeholder="TV, Whiteboard, Coffee Machine"
                                onChange={(e) => setRoomData('amenities', e.target.value.split(',').map(s => s.trim()))}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeRoomModal}>Cancel</Button>
                            <Button type="submit" disabled={processingRoom}>Create Room</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout >
    );
}


