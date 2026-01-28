<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $rooms = \App\Models\Room::query()
            ->where('is_active', true)
            ->get();

        $date = $request->input('date') ? \Carbon\Carbon::parse($request->input('date')) : now();
        $startOfWeek = $date->copy()->startOfWeek();
        $endOfWeek = $date->copy()->endOfWeek();

        $query = Booking::query()
            ->with(['user', 'room'])
            ->where('end_time', '>=', $startOfWeek)
            ->where('start_time', '<=', $endOfWeek)
            ->orderBy('start_time');

        $bookings = $query->get();

        // Fetch booking history for the heatmap (last 365 days)
        $bookingHistory = Booking::query()
            ->selectRaw('DATE(start_time) as date, count(*) as count')
            ->where('start_time', '>=', now()->subYear())
            ->groupBy('date')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->date => $item->count];
            });

        // Calculate detailed status for each room for "Today" (Phnom Penh time)
        $now = now('Asia/Phnom_Penh');
        $todayBookings = Booking::query()
            ->where('status', 'confirmed')
            ->where('end_time', '>', $now) // Only future ending bookings matter
            ->where('start_time', '<', $now->copy()->endOfDay())
            ->orderBy('start_time')
            ->get()
            ->groupBy('room_id');

        $roomStatuses = [];
        foreach ($rooms as $room) {
            $roomBookings = $todayBookings->get($room->id, collect());

            // Check if currently busy
            $currentBooking = $roomBookings->first(function ($booking) use ($now) {
                return $booking->start_time <= $now && $booking->end_time > $now;
            });

            if ($currentBooking) {
                $roomStatuses[$room->id] = [
                    'status' => 'busy',
                    'message' => 'Busy until '.$currentBooking->end_time->setTimezone('Asia/Phnom_Penh')->format('H:i'),
                ];
            } else {
                // Check next booking today
                $futureBookings = $roomBookings->filter(function ($booking) use ($now) {
                    return $booking->start_time > $now;
                });

                $nextBooking = $futureBookings->first();

                if ($nextBooking) {
                    $count = $futureBookings->count();
                    $roomStatuses[$room->id] = [
                        'status' => 'available',
                        'message' => 'Available until '.$nextBooking->start_time->setTimezone('Asia/Phnom_Penh')->format('H:i')." ($count upcoming)",
                    ];
                } else {
                    $roomStatuses[$room->id] = [
                        'status' => 'available',
                        'message' => 'Available (Free for rest of day)',
                    ];
                }
            }
        }

        return \Inertia\Inertia::render('bookings/Index', [
            'rooms' => $rooms,
            'bookings' => $bookings,
            'bookingHistory' => $bookingHistory,
            'currentDate' => $startOfWeek->format('Y-m-d'),
            'roomStatuses' => $roomStatuses,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'title' => 'required|string|max:255',
            'start_time' => 'required|date|after:now',
            'end_time' => 'required|date|after:start_time',
            'description' => 'nullable|string',
            'repeat_weekly' => 'boolean',
            'repeat_count' => 'nullable|integer|min:1|max:12', // Limit to 12 weeks
        ]);

        $isRecurring = $request->boolean('repeat_weekly');
        $repeatCount = $isRecurring ? (int) $request->input('repeat_count', 0) : 0;

        $bookingsToCreate = [];
        $startTime = \Carbon\Carbon::parse($validated['start_time']);
        $endTime = \Carbon\Carbon::parse($validated['end_time']);

        // 1. Calculate all time slots
        for ($i = 0; $i <= $repeatCount; $i++) {
            $bookingsToCreate[] = [
                'current_start' => $startTime->copy()->addWeeks($i),
                'current_end' => $endTime->copy()->addWeeks($i),
            ];
        }

        // 2. Check conflicts for ALL slots
        foreach ($bookingsToCreate as $period) {
            $conflicts = Booking::query()
                ->where('room_id', $validated['room_id'])
                ->where('status', 'confirmed')
                ->where(function ($query) use ($period) {
                    $query->whereBetween('start_time', [$period['current_start'], $period['current_end']])
                        ->orWhereBetween('end_time', [$period['current_start'], $period['current_end']])
                        ->orWhere(function ($q) use ($period) {
                            $q->where('start_time', '<=', $period['current_start'])
                                ->where('end_time', '>=', $period['current_end']);
                        });
                })
                ->exists();

            if ($conflicts) {
                // Determine conflicting date for error message
                $conflictDate = $period['current_start']->format('M jS');

                return back()->withErrors(['start_time' => "Conflict detected on {$conflictDate}. No bookings were created."]);
            }
        }

        // 3. Create Bookings Transactionally
        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $validated, $bookingsToCreate, $isRecurring) {
            $parentBooking = null;

            foreach ($bookingsToCreate as $index => $period) {
                $booking = $request->user()->bookings()->create([
                    'room_id' => $validated['room_id'],
                    'title' => $validated['title'],
                    'start_time' => $period['current_start'],
                    'end_time' => $period['current_end'],
                    'description' => $validated['description'],
                    'status' => 'confirmed',
                    'parent_id' => $parentBooking ? $parentBooking->id : null,
                ]);

                // First one is the parent
                if ($index === 0 && $isRecurring) {
                    $parentBooking = $booking;
                }
            }
        });

        $msg = $isRecurring
            ? 'Recurring booking created for '.($repeatCount + 1).' weeks!'
            : 'Room booked successfully!';

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Display the specified resource.
     */
    public function show(Booking $booking)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Booking $booking)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id && ! $request->user()->can('bookings.edit')) {
            abort(403, 'You are not authorized to update this booking.');
        }

        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'title' => 'required|string|max:255',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'description' => 'nullable|string',
        ]);

        // Check for conflicts (excluding current booking)
        $conflicts = Booking::query()
            ->where('room_id', $validated['room_id'])
            ->where('status', 'confirmed')
            ->where('id', '!=', $booking->id)
            ->where(function ($query) use ($validated) {
                $query->whereBetween('start_time', [$validated['start_time'], $validated['end_time']])
                    ->orWhereBetween('end_time', [$validated['start_time'], $validated['end_time']])
                    ->orWhere(function ($q) use ($validated) {
                        $q->where('start_time', '<=', $validated['start_time'])
                            ->where('end_time', '>=', $validated['end_time']);
                    });
            })
            ->exists();

        if ($conflicts) {
            return back()->withErrors(['start_time' => 'This room is already booked for the selected time slot.']);
        }

        $booking->update([
            'room_id' => $validated['room_id'],
            'title' => $validated['title'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'description' => $validated['description'],
        ]);

        return redirect()->back()->with('success', 'Booking updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Booking $booking)
    {
        // For standard "delete" action, we might want to hard delete.
        // But for "cancelling", we should use the cancel method.
        // If the user triggers destroy, we'll assume hard delete for now or check authorization.

        if ($booking->user_id !== $request->user()->id && ! $request->user()->can('bookings.delete')) {
            abort(403, 'You are not authorized to delete this booking.');
        }

        $booking->delete();

        return redirect()->back()->with('success', 'Booking deleted successfully.');
    }

    /**
     * Cancel the booking.
     */
    public function cancel(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id && ! $request->user()->can('bookings.delete')) {
            abort(403, 'You are not authorized to cancel this booking.');
        }

        $booking->update(['status' => 'cancelled']);

        return redirect()->back()->with('success', 'Booking cancelled successfully.');
    }
}
