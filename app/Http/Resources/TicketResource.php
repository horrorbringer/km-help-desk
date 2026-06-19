<?php

namespace App\Http\Resources;

use App\Models\Ticket;
use App\Services\ApprovalWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $approvalWorkflow = app(ApprovalWorkflowService::class);
        $canViewInternal = $user?->can('tickets.manage-comments') ?? false;

        return [
            'id' => $this->id,
            'ticket_number' => $this->ticket_number,
            'subject' => $this->subject,
            'description' => $this->description,
            'internal_note' => $this->when($request->user()?->can('tickets.assign'), $this->internal_note),
            'status' => $this->status,
            'status_label' => $this->statusLabel(),
            'approval_status' => $this->approvalStatus(),
            'resolution_summary' => $this->resolution_summary,
            'capabilities' => [
                'update_details' => $user?->can('update', $this->resource) ?? false,
                'change_priority' => $user?->can('tickets.change-priority') ?? false,
                'comment' => $user?->can('tickets.comment') ?? false,
                'manage_comments' => $user?->can('tickets.manage-comments') ?? false,
                'assign' => $user?->can('tickets.assign') ?? false,
                'resubmit' => $user?->can('resubmit', $this->resource) ?? false,
            ],
            'allowed_statuses' => $user
                ? collect(Ticket::STATUSES)
                    ->reject(fn (string $status) => $status === $this->status)
                    ->filter(fn (string $status) => $user->can('changeStatus', [$this->resource, $status]))
                    ->values()
                    ->all()
                : [],
            'priority' => $this->priority,
            'estimated_cost' => $this->estimated_cost,
            'source' => $this->source,
            'requester' => $this->whenLoaded('requester', function () {
                return $this->requester ? [
                    'id' => $this->requester->id,
                    'name' => $this->requester->name,
                    'email' => $this->requester->email,
                    'avatar' => $this->requester->avatar,
                ] : null;
            }),
            'assigned_team' => $this->whenLoaded('assignedTeam'),
            'assigned_agent' => $this->whenLoaded('assignedAgent', function () {
                return $this->assignedAgent ? [
                    'id' => $this->assignedAgent->id,
                    'name' => $this->assignedAgent->name,
                    'email' => $this->assignedAgent->email,
                    'avatar' => $this->assignedAgent->avatar,
                ] : null;
            }),
            'category' => $this->whenLoaded('category'),
            'project' => $this->whenLoaded('project'),
            'sla_policy' => $this->whenLoaded('slaPolicy'),
            'tags' => $this->whenLoaded('tags'),
            'watchers' => $this->whenLoaded('watchers'),
            'custom_field_values' => $this->whenLoaded('customFieldValues', function () {
                return $this->customFieldValues->map(function ($cfv) {
                    // Transform options from associative array to array of objects
                    $options = [];
                    if ($cfv->customField->options && is_array($cfv->customField->options)) {
                        // Check if options is already in the correct format (array of objects)
                        if (isset($cfv->customField->options[0]) && is_array($cfv->customField->options[0]) && isset($cfv->customField->options[0]['label'])) {
                            $options = $cfv->customField->options;
                        } else {
                            // Transform associative array to array of objects
                            foreach ($cfv->customField->options as $key => $value) {
                                $options[] = [
                                    'label' => $value,
                                    'value' => is_numeric($key) ? $value : $key,
                                ];
                            }
                        }
                    }

                    return [
                        'id' => $cfv->id,
                        'custom_field_id' => $cfv->custom_field_id,
                        'value' => $cfv->value,
                        'custom_field' => [
                            'id' => $cfv->customField->id,
                            'name' => $cfv->customField->name,
                            'label' => $cfv->customField->label,
                            'field_type' => $cfv->customField->field_type,
                            'options' => $options,
                        ],
                    ];
                });
            }),
            'comments' => $this->whenLoaded('comments', function () use ($canViewInternal) {
                return $this->comments
                    ->when(! $canViewInternal, fn ($comments) => $comments->where('is_internal', false))
                    ->values()
                    ->map(function ($comment) use ($canViewInternal) {
                        return [
                            'id' => $comment->id,
                            'body' => $comment->body,
                            'is_internal' => $comment->is_internal,
                            'type' => $comment->type,
                            'parent_id' => $comment->parent_id,
                            'created_at' => $comment->created_at,
                            'user' => $comment->user ? [
                                'id' => $comment->user->id,
                                'name' => $comment->user->name,
                                'email' => $comment->user->email,
                                'avatar' => $comment->user->avatar,
                            ] : null,
                            'replies' => $comment->replies ? $comment->replies
                                ->when(! $canViewInternal, fn ($replies) => $replies->where('is_internal', false))
                                ->values()
                                ->map(function ($reply) {
                                    return [
                                        'id' => $reply->id,
                                        'body' => $reply->body,
                                        'is_internal' => $reply->is_internal,
                                        'created_at' => $reply->created_at,
                                        'user' => $reply->user ? [
                                            'id' => $reply->user->id,
                                            'name' => $reply->user->name,
                                            'email' => $reply->user->email,
                                            'avatar' => $reply->user->avatar,
                                        ] : null,
                                    ];
                                }) : [],
                        ];
                    });
            }),
            'attachments' => $this->whenLoaded('attachments', function () {
                return $this->attachments->map(function ($attachment) {
                    return [
                        'id' => $attachment->id,
                        'filename' => $attachment->filename,
                        'original_filename' => $attachment->original_filename,
                        'file_path' => $attachment->file_path,
                        'mime_type' => $attachment->mime_type,
                        'file_size' => $attachment->file_size,
                        'created_at' => $attachment->created_at?->toDateTimeString(),
                        'uploader' => $attachment->uploader ? [
                            'id' => $attachment->uploader->id,
                            'name' => $attachment->uploader->name,
                            'email' => $attachment->uploader->email,
                            'avatar' => $attachment->uploader->avatar,
                        ] : null,
                    ];
                });
            }),
            'histories' => $this->whenLoaded('histories', function () {
                return $this->histories->map(function ($history) {
                    return [
                        'id' => $history->id,
                        'action' => $history->action,
                        'field_name' => $history->field_name,
                        'old_value' => $history->old_value,
                        'new_value' => $history->new_value,
                        'description' => $history->description,
                        'created_at' => $history->created_at?->toDateTimeString(),
                        'user' => $history->user ? [
                            'id' => $history->user->id,
                            'name' => $history->user->name,
                            'email' => $history->user->email,
                            'avatar' => $history->user->avatar,
                        ] : null,
                    ];
                });
            }),
            'approvals' => $this->whenLoaded('approvals', function () use ($approvalWorkflow, $canViewInternal, $user) {
                return $this->approvals->map(function ($approval) use ($approvalWorkflow, $canViewInternal, $user) {
                    return [
                        'id' => $approval->id,
                        'approval_level' => $approval->approval_level,
                        'status_label' => $approval->status_label,
                        'status' => $approval->status,
                        'comments' => $canViewInternal || $approval->status === 'rejected'
                            ? $approval->comments
                            : null,
                        'approved_at' => $approval->approved_at,
                        'rejected_at' => $approval->rejected_at,
                        'sequence' => $approval->sequence,
                        'can_approve' => $user
                            && $approval->status === 'pending'
                            && $approvalWorkflow->canApprove($approval, $user),
                        'approver' => $approval->approver ? [
                            'id' => $approval->approver->id,
                            'name' => $approval->approver->name,
                            'email' => $canViewInternal ? $approval->approver->email : null,
                            'avatar' => $approval->approver->avatar,
                        ] : null,
                        'routed_to_team' => $approval->routedToTeam ? [
                            'id' => $approval->routedToTeam->id,
                            'name' => $approval->routedToTeam->name,
                        ] : null,
                        'created_at' => $approval->created_at,
                    ];
                });
            }),
            'current_approval' => $this->whenLoaded('approvals', function () use ($approvalWorkflow, $canViewInternal, $user) {
                $current = $this->currentApproval();
                if (! $current) {
                    return null;
                }

                return [
                    'id' => $current->id,
                    'approval_level' => $current->approval_level,
                    'status_label' => $current->status_label,
                    'status' => $current->status,
                    'can_approve' => $user
                        && $current->status === 'pending'
                        && $approvalWorkflow->canApprove($current, $user),
                    'approver' => $current->approver ? [
                        'id' => $current->approver->id,
                        'name' => $current->approver->name,
                        'email' => $canViewInternal ? $current->approver->email : null,
                    ] : null,
                ];
            }),
            'rejected_approval' => $this->whenLoaded('approvals', function () use ($canViewInternal) {
                $rejected = $this->rejectedApproval();
                if (! $rejected) {
                    return null;
                }

                return [
                    'id' => $rejected->id,
                    'approval_level' => $rejected->approval_level,
                    'status' => $rejected->status,
                    'comments' => $rejected->comments,
                    'rejected_at' => $rejected->rejected_at,
                    'approver' => $rejected->approver ? [
                        'id' => $rejected->approver->id,
                        'name' => $rejected->approver->name,
                        'email' => $canViewInternal ? $rejected->approver->email : null,
                    ] : null,
                ];
            }),
            'rejected_approval_count' => $this->whenLoaded('approvals', function () {
                return $this->approvals()->where('status', 'rejected')->count();
            }, 0),
            'first_response_at' => $this->first_response_at,
            'first_response_due_at' => $this->first_response_due_at,
            'resolution_due_at' => $this->resolution_due_at,
            'resolved_at' => $this->resolved_at,
            'closed_at' => $this->closed_at,
            'response_sla_breached' => $this->response_sla_breached,
            'resolution_sla_breached' => $this->resolution_sla_breached,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
