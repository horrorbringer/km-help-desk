<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Workflow Template Model
 * 
 * Stores workflow definitions for ticket approval processes.
 * Supports category-specific and department-specific workflows.
 */
class WorkflowTemplate extends Model
{
    protected $fillable = [
        'name',
        'description',
        'category_id',
        'department_id',
        'workflow_steps',
        'routing_rules',
        'approval_rules',
        'is_active',
        'priority',
    ];

    protected $casts = [
        'workflow_steps' => 'array',
        'routing_rules' => 'array',
        'approval_rules' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the category this workflow applies to
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(TicketCategory::class);
    }

    /**
     * Get the department this workflow applies to
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Find workflow template for a ticket
     * 
     * Priority order:
     * 1. Category + Department specific
     * 2. Category specific
     * 3. Department specific
     * 4. Default workflow (no category/department)
     */
    public static function forTicket(Ticket $ticket): ?self
    {
        return static::where('is_active', true)
            ->where(function ($query) use ($ticket) {
                $query->whereNull('category_id')
                    ->orWhere('category_id', $ticket->category_id);
            })
            ->where(function ($query) use ($ticket) {
                $query->whereNull('department_id')
                    ->orWhere('department_id', $ticket->requester?->department_id);
            })
            ->orderBy('priority', 'desc')
            ->orderByRaw('CASE 
                WHEN category_id IS NOT NULL AND department_id IS NOT NULL THEN 1
                WHEN category_id IS NOT NULL THEN 2
                WHEN department_id IS NOT NULL THEN 3
                ELSE 4
            END')
            ->first();
    }

    /**
     * Scope: Active workflows only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: For specific category
     */
    public function scopeForCategory($query, ?int $categoryId)
    {
        return $query->where(function ($q) use ($categoryId) {
            $q->whereNull('category_id')
              ->orWhere('category_id', $categoryId);
        });
    }

    /**
     * Scope: For specific department
     */
    public function scopeForDepartment($query, ?int $departmentId)
    {
        return $query->where(function ($q) use ($departmentId) {
            $q->whereNull('department_id')
              ->orWhere('department_id', $departmentId);
        });
    }
}
