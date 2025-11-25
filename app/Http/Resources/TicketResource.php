<?php

namespace App\Http\Resources;

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
        return [
            'id' => $this->id,
            'ticket_number' => $this->ticket_number,
            'subject' => $this->subject,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'source' => $this->source,
            'requester' => $this->whenLoaded('requester'),
            'assigned_team' => $this->whenLoaded('assignedTeam'),
            'assigned_agent' => $this->whenLoaded('assignedAgent'),
            'category' => $this->whenLoaded('category'),
            'project' => $this->whenLoaded('project'),
            'sla_policy' => $this->whenLoaded('slaPolicy'),
            'tags' => $this->whenLoaded('tags'),
            'watchers' => $this->whenLoaded('watchers'),
            'comments' => $this->whenLoaded('comments'),
            'attachments' => $this->whenLoaded('attachments'),
            'histories' => $this->whenLoaded('histories'),
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


