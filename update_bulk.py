import re

with open('app/Http/Controllers/Admin/TicketController.php', 'r') as f:
    content = f.read()

new_method = """    public function bulkUpdate(Request $request, TicketService $ticketService): RedirectResponse
    {
        $request->validate([
            'ticket_ids' => ['required', 'array', 'min:1'],
            'ticket_ids.*' => ['exists:tickets,id'],
            'action' => ['required', 'string', 'in:status,priority,assign_agent,assign_team,add_tags,remove_tags'],
            'value' => ['required'],
        ]);

        $ticketIds = $request->input('ticket_ids');
        $action = $request->input('action');
        $value = $request->input('value');
        $user = \Auth::user();

        // Check permission based on action type
        if (in_array($action, ['assign_agent', 'assign_team'])) {
            abort_unless($user->can('tickets.assign'), 403, 'You do not have permission to assign tickets.');
        } else {
            abort_unless($user->can('tickets.edit'), 403, 'You do not have permission to edit tickets.');
        }

        $tickets = \App\Models\Ticket::whereIn('id', $ticketIds)->get();
        $updatedCount = 0;
        $failedCount = 0;
        $failedMessages = [];

        \Log::info('TicketController::bulkUpdate - Starting bulk update', [
            'action' => $action,
            'value' => $value,
            'ticket_count' => count($tickets),
        ]);

        foreach ($tickets as $ticket) {
            $changed = false;
            $data = [];

            try {
                switch ($action) {
                    case 'status':
                        if (app/Services/TicketService.phpuser->can('changeStatus', [$ticket, $value])) {
                            $msg = $ticket->requester_id === $user->id 
                                ? 'As the requester, you can only close or cancel your tickets.' 
                                : 'You can only change the status of tickets assigned to you or your team.';
                            throw new \Exception($msg);
                        }
                        if (in_array($value, \App\Models\Ticket::STATUSES)) {
                            $data['status'] = $value;
                        }
                        break;

                    case 'priority':
                        $this->authorize('update', $ticket);
                        if (in_array($value, \App\Models\Ticket::PRIORITIES)) {
                            $data['priority'] = $value;
                        }
                        break;

                    case 'assign_agent':
                        if (app/Services/TicketService.phpuser->can('assignAgent', [$ticket, $value])) {
                            $msg = $value == $user->id
                                ? 'You can only pick tickets assigned to your team or unassigned tickets.'
                                : 'You can only assign tickets to yourself. Only managers and admins can assign tickets to others.';
                            throw new \Exception($msg);
                        }
                        $data['assigned_agent_id'] = $value;
                        if ($user->can('tickets.assign') && $ticket->assigned_agent_id != $value) {
                            $data['assigned_team_id'] = null;
                        }
                        break;

                    case 'assign_team':
                        if (app/Services/TicketService.phpuser->can('tickets.assign')) {
                            throw new \Exception("You don't have permission to assign tickets to teams.");
                        }
                        $data['assigned_team_id'] = $value;
                        $data['assigned_agent_id'] = null;
                        break;

                    case 'add_tags':
                        $this->authorize('update', $ticket);
                        $existingTags = $ticket->tags()->pluck('tags.id')->toArray();
                        $newTags = is_array($value) ? $value : [$value];
                        $mergedTags = array_unique(array_merge($existingTags, $newTags));
                        $this->syncRelations($ticket, ['tag_ids' => $mergedTags]);
                        
                        $addedTags = array_diff($mergedTags, $existingTags);
                        if (!empty($addedTags)) {
                            $tagNames = \App\Models\Tag::whereIn('id', $addedTags)->pluck('name')->join(', ');
                            $ticket->histories()->create([
                                'user_id' => $user->id,
                                'action' => 'tagged',
                                'field_name' => 'tags',
                                'old_value' => null,
                                'new_value' => $tagNames,
                                'description' => "Added tags: {$tagNames}",
                                'created_at' => now(),
                            ]);
                            $changed = true;
                        }
                        break;

                    case 'remove_tags':
                        $this->authorize('update', $ticket);
                        $existingTags = $ticket->tags()->pluck('tags.id')->toArray();
                        $removeTags = is_array($value) ? $value : [$value];
                        $remainingTags = array_diff($existingTags, $removeTags);
                        $this->syncRelations($ticket, ['tag_ids' => $remainingTags]);
                        
                        $removedTags = array_intersect($existingTags, $removeTags);
                        if (!empty($removedTags)) {
                            $tagNames = \App\Models\Tag::whereIn('id', $removedTags)->pluck('name')->join(', ');
                            $ticket->histories()->create([
                                'user_id' => $user->id,
                                'action' => 'untagged',
                                'field_name' => 'tags',
                                'old_value' => $tagNames,
                                'new_value' => null,
                                'description' => "Removed tags: {$tagNames}",
                                'created_at' => now(),
                            ]);
                            $changed = true;
                        }
                        break;
                }

                if (!empty($data)) {
                    $ticketService->updateTicket($ticket, $data, $user, false);
                    $changed = true;
                }

                if ($changed) {
                    $updatedCount++;
                }

            } catch (\Exception $e) {
                $failedCount++;
                $failedMessages[] = "Ticket #{$ticket->ticket_number}: " . $e->getMessage();
            }
        }

        app(SearchService::class)->clearCache();

        if ($failedCount > 0 && $updatedCount > 0) {
            $message = "Successfully updated {$updatedCount} ticket(s). {$failedCount} ticket(s) could not be updated.";
            if (!empty($failedMessages)) {
                $message .= " " . implode(' ', array_slice($failedMessages, 0, 3));
                if (count($failedMessages) > 3) {
                    $message .= " (and " . (count($failedMessages) - 3) . " more)";
                }
            }
            return redirect()
                ->route('admin.tickets.index')
                ->with('warning', $message)
                ->with('error_details', $failedMessages);
        } elseif ($failedCount > 0) {
            $message = "Failed to update {$failedCount} ticket(s).";
            if (!empty($failedMessages)) {
                $message .= " " . implode(' ', array_slice($failedMessages, 0, 2));
                if (count($failedMessages) > 2) {
                    $message .= " (and " . (count($failedMessages) - 2) . " more)";
                }
            }
            return redirect()
                ->route('admin.tickets.index')
                ->with('error', $message)
                ->with('error_details', $failedMessages);
        } elseif ($updatedCount > 0) {
            return redirect()
                ->route('admin.tickets.index')
                ->with('success', "Successfully updated {$updatedCount} ticket(s).");
        }
        
        return redirect()
            ->route('admin.tickets.index')
            ->with('info', "No tickets were updated.");
    }

"""

pattern = re.compile(r'    public function bulkUpdate\(Request \$request\): RedirectResponse\n    {\n(.*?)\n    }\n\n    public function bulkDelete', re.DOTALL)
new_content = pattern.sub(new_method + "    public function bulkDelete", content)

with open('app/Http/Controllers/Admin/TicketController.php', 'w') as f:
    f.write(new_content)
