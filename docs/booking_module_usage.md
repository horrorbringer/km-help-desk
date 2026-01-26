# Booking Module Usage Guide

## Overview
The Booking Module allows employees to reserve meeting rooms efficiently. It features a visual card-based interface, conflict detection to prevent double-booking, and tools for managing both bookings and rooms.

## 1. Accessing the Module
Navigate to the **Sidebar** and click on **"Bookings"** (Icon: Calendar).
The default view shows all available rooms and a list of bookings for the current week.

## 2. Booking a Room
To make a reservation:
1.  **View Availability**: Browse the "Available Rooms" cards. Each card displays the room's name, capacity, location, and amenities.
2.  **Initiate Booking**: Click the black **"Book Now"** button on your desired room.
3.  **Fill Details**:
    *   **Meeting Title**: Give your meeting a recognizable name.
    *   **Date**: Click "Pick a date" to open the calendar.
    *   **Time**: Select a **Start Time**. The **End Time** will automatically adjust to be at least 1 hour later, but you can change it.
    *   **Description**: (Optional) Add notes about the meeting purpose.
4.  **Confirm**: Click "Confirm Booking". The system will check for conflicts. If another booking exists at that time, you will see an error.

## 3. Managing Your Bookings
Scroll down to the **"Weekly Bookings"** section.

### Viewing Schedule
*   **Navigation**: Use the **`<`** and **`>`** arrows next to the title to switch between weeks.
*   **Filter**: Use the dropdown top-right to filter by status:
    *   **All**: Show everything.
    *   **Confirmed**: Active upcoming meetings (Blue/Black badge).
    *   **Cancelled**: Meetings that were called off (Red badge).
    *   **Completed**: Past meetings (Gray badge).

### Editing & Cancelling
Find your booking in the list. You (and Admins) will see action buttons on the right:
*   **Edit (Pencil Icon)**: Click to change the Time, Title, or Room.
*   **Cancel**: Click "Cancel" to release the room. The booking status changes to "Cancelled" but remains in history.

## 4. Managing Rooms (Admin Features)
If you have permission, you can manage the rooms themselves.

### Adding a Room
*   Click the **"+ Add Room"** button at the top right of the page.
*   **Shape & Style**: Enter the Name, Capacity, and Location.
*   **Color**: Pick a color code (e.g., `#3B82F6`)—this colors the sidebar of the room card for easy visual identification.
*   **Amenities**: Add items like "TV, Whiteboard, Video Conference", separated by commas.

### Editing & Deleting Rooms
Hover your mouse over any Room Card to reveal admin actions in the top-right corner:
*   **Edit (Pencil Icon)**: Modify the room's name, facilities, or color.
*   **Delete (Trash Icon)**: Permanently remove the room. *Note: You cannot delete a room if it has active future bookings.*
