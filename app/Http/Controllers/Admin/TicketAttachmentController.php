<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TicketAttachmentController extends Controller
{
    /**
     * Upload a ticket attachment
     */
    public function store(Request $request, Ticket $ticket): RedirectResponse
    {
        // Check if user has permission to edit tickets
        abort_unless(Auth::user()->can('tickets.edit'), 403);

        $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => [
                'required',
                'file',
                'max:10240', // 10MB max per file
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png,gif,zip,rar,7z',
            ],
        ]);

        $uploadedCount = 0;

        foreach ($request->file('files') as $file) {
            $originalFilename = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $extension;
            $filePath = 'tickets/' . $ticket->id . '/' . $filename;

            // Store the file
            $storedPath = Storage::putFileAs('tickets/' . $ticket->id, $file, $filename);

            // Create attachment record
            TicketAttachment::create([
                'ticket_id' => $ticket->id,
                'uploaded_by' => Auth::id(),
                'filename' => $filename,
                'original_filename' => $originalFilename,
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'file_path' => $storedPath,
            ]);

            $uploadedCount++;
        }

        return redirect()
            ->back()
            ->with('success', "Successfully uploaded {$uploadedCount} file(s).");
    }

    /**
     * Download a ticket attachment
     */
    public function download(TicketAttachment $attachment): StreamedResponse
    {
        // Check if user has permission to view tickets
        abort_unless(Auth::user()->can('tickets.view'), 403);

        // Check if file exists on the default disk (local)
        if (!Storage::exists($attachment->file_path)) {
            abort(404, 'File not found');
        }

        // Download the file with the original filename
        return Storage::download(
            $attachment->file_path,
            $attachment->original_filename
        );
    }

    /**
     * Delete a ticket attachment
     */
    public function destroy(TicketAttachment $attachment): RedirectResponse
    {
        // Check if user has permission to edit tickets
        abort_unless(Auth::user()->can('tickets.edit'), 403);

        // Delete the file from storage
        if (Storage::exists($attachment->file_path)) {
            Storage::delete($attachment->file_path);
        }

        // Delete the attachment record
        $attachment->delete();

        return redirect()
            ->back()
            ->with('success', 'Attachment deleted successfully.');
    }
}

