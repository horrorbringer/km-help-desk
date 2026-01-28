# Feature Roadmap: IT Asset Management (GLPI-like features)

## Overview
The user asked if the system has server interaction features like **GLPI**.
Currently, **KM Help Desk** is focused on **Service Management (Tickets)** and **Resource Booking**. It does **not** have the automated **IT Asset Management (ITAM)** features (e.g., OCS Inventory / FusionInventory agents) that GLPI uses to automatically scan and update server details.

However, we can build a **Manual Asset Management Module** to bridge this gap.

## Proposed "Assets" Module
To provide GLPI-like functionality, we can implement the following:

### 1. New Models
*   **Asset**: Represents a device (Server, Laptop, Printer).
    *   Fields: `name`, `type` (server/pc), `serial_number`, `ip_address`, `status`, `location_id`.
*   **AssetModel**: To group assets by manufacturer/model.

### 2. Ticket Integration
*   **Link Assets to Tickets**: When creating a ticket (e.g., "Server Down"), allow selecting the specific `Asset` from the database. This is a core GLPI feature.

### 3. Basic "Server Interaction" (Future)
*   While we won't build a full binary agent (like FusionInventory), we could add:
    *   **Ping Status**: A scheduled task to ping server IPs and update their status (Online/Offline).
    *   **API Import**: An API endpoint to let an external script (bash/powershell) push server details to KM Help Desk.

## Implementation Steps (If approved)
1.  **Create Migration**: `create_assets_table`.
2.  **Create Model**: `App\Models\Asset`.
3.  **Create UI**: "Assets" menu item in the sidebar with List/Create/Edit views.
4.  **Update Ticket Form**: Add an "Affected Asset" dropdown.

---
*Would you like to proceed with building this Asset Management module?*
