<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
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
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'location' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'amenities' => 'nullable|array',
            'color' => 'nullable|string|max:7', // Hex color
        ]);

        // Default aesthetic color if none provided
        if (empty($validated['color'])) {
            $validated['color'] = '#3B82F6'; // Default Blue
        }

        Room::create($validated);

        return redirect()->back()->with('success', 'Room created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Room $room)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'location' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'amenities' => 'nullable|array',
            'color' => 'nullable|string|max:7',
            'is_active' => 'boolean'
        ]);

        $room->update($validated);

        return redirect()->back()->with('success', 'Room updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Room $room)
    {
        // Check for active bookings to prevent orphaned data
        if ($room->bookings()->where('end_time', '>', now())->exists()) {
            return redirect()->back()->with('error', 'Cannot delete room with active future bookings.');
        }

        $room->delete();

        return redirect()->back()->with('success', 'Room deleted successfully.');
    }
}
