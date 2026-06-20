<?php

namespace App\Support;

final class NotificationType
{
    public const TICKET_CREATED = 'ticket_created';

    public const TICKET_ASSIGNED = 'ticket_assigned';

    public const TICKET_UPDATED = 'ticket_updated';

    public const TICKET_RESOLVED = 'ticket_resolved';

    public const TICKET_CLOSED = 'ticket_closed';

    public const TICKET_COMMENTED = 'ticket_commented';

    public const TICKET_MENTIONED = 'ticket_mentioned';

    public const TICKET_WATCHED = 'ticket_watched';

    public const TICKET_ROUTED_TO_TEAM = 'ticket_routed_to_team';

    public const TEAMMATE_TICKET_CREATED = 'teammate_ticket_created';

    public const COMMENT_ADDED = 'comment_added';

    public const COMMENT_INTERNAL = 'comment_internal';

    public const SLA_BREACHED = 'sla_breached';

    public const SLA_WARNING = 'sla_warning';

    public const LICENSE_EXPIRING = 'license_expiring';

    public const APPROVAL_REQUESTED = 'approval_requested';

    public const APPROVAL_APPROVED = 'approval_approved';

    public const APPROVAL_REJECTED = 'approval_rejected';

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [
            self::TICKET_CREATED,
            self::TICKET_ASSIGNED,
            self::TICKET_UPDATED,
            self::TICKET_RESOLVED,
            self::TICKET_CLOSED,
            self::TICKET_COMMENTED,
            self::TICKET_MENTIONED,
            self::TICKET_WATCHED,
            self::TICKET_ROUTED_TO_TEAM,
            self::TEAMMATE_TICKET_CREATED,
            self::COMMENT_ADDED,
            self::COMMENT_INTERNAL,
            self::SLA_BREACHED,
            self::SLA_WARNING,
            self::LICENSE_EXPIRING,
            self::APPROVAL_REQUESTED,
            self::APPROVAL_APPROVED,
            self::APPROVAL_REJECTED,
        ];
    }
}
