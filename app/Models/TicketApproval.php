<?php

namespace App\Models;

use App\Constants\ApprovalLevelConstants;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'approval_level',
        'approver_id',
        'status',
        'comments',
        'approved_at',
        'rejected_at',
        'routed_to_team_id',
        'sequence',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    /**
     * Default approval levels (backward compatible)
     * 
     * @deprecated Use ApprovalLevelConstants::getDefaultLevels() instead
     * @var array<string>
     */
    public const LEVELS = [
        ApprovalLevelConstants::LINE_MANAGER,
        ApprovalLevelConstants::HEAD_OF_DEPARTMENT,
        ApprovalLevelConstants::CEO,
    ];

    public const STATUSES = ['pending', 'approved', 'rejected'];

    /**
     * Get approval level label for display
     */
    public function getLevelLabelAttribute(): string
    {
        return ApprovalLevelConstants::getLabel($this->approval_level);
    }

    /**
     * Get roles that can approve at this level
     */
    public function getApproverRoles(): array
    {
        return ApprovalLevelConstants::getRolesForLevel($this->approval_level);
    }

    /**
     * Relationships
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function routedToTeam(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'routed_to_team_id');
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeForLevel($query, string $level)
    {
        return $query->where('approval_level', $level);
    }

    /**
     * Check if approval is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if approval is approved
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if approval is rejected
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
}
