# Workflow Templates Module Documentation

## 1. Overview
The **Workflow Template Module** serves as the "decision engine" for the Help Desk system. It allows administrators to define automated processes ("blueprints") for how tickets should be handled, approved, and routed based on their category, department, or other criteria.

Instead of hard-coding logic (e.g., *"If Category is Hardware, send email to Bob"*), this module provides a visual interface to build flexible, multi-step workflows that the system executes automatically.

---

## 2. core Concepts

### 2.1 The "Blueprint" (Template)
A **Workflow Template** is a set of instructions linked to specific criteria. When a user creates a ticket, the system looks for a matching template.
-   **Criteria**: You can link a template to a specific **Category** (e.g., IT Support) and/or **Department** (e.g., Sales).
-   **Priority**: If multiple templates match a ticket (e.g., one for "All IT" and one specifically for "Server Outage"), the one with the higher **Priority** score is used.

### 2.2 Workflow Steps
A workflow consists of a sequence of **Steps**. Each step performs a specific action and then passes control to the next step (or stops the flow).

#### Available Step Types:

1.  **Approval (`approval`)**
    *   **Function**: Pauses the workflow until a specific person approves the request.
    *   **Configuration**:
        *   *Approver Type*: `Line Manager` (User's direct boss) or `Role` (e.g., "IT Director").
        *   *Approval Level*: Defines the seniority required (e.g., "Line Manager" or "Department Head").
    *   **Outcome**: If approved, proceeds to the next step. If rejected, the ticket status changes to `Rejected` and the workflow stops.

2.  **Conditional Check (`conditional_approval`)**
    *   **Function**: Checks a specific condition (currently focused on dynamic logic like "Is this high cost?").
    *   **Configuration**:
        *   *If False Action*: `Skip Step` (continue as if nothing happened) or `Route Directly` (jump to a specific team).

3.  **Notification (`notification`)**
    *   **Function**: Sends an email or alert to someone without stopping the workflow.
    *   **Usage**: "Notify the Security Team that a new employee badge was requested."

4.  **Routing (`routing`)**
    *   **Function**: Moves the ticket to a different "Queue" or "Team".
    *   **Usage**: "Move this ticket from the 'General Help Desk' queue to the 'Network Engineering' queue."

5.  **Assignment (`assignment`)**
    *   **Function**: Assigns the ticket to a specific *individual* user.
    *   **Options**:
        *   `Approver`: Assigns the ticket back to the person who just approved it.
        *   `Line Manager`: Assigns it to the user's manager.

---

## 3. Real-World Usage Example

### Scenario: "New Laptop Purchase"
**Goal**: An employee needs a new laptop. This requires their boss's approval. If it's expensive, the IT Director must also approve it. Finally, it goes to the Procurement Team.

**Configuration:**
1.  **Template Settings**:
    *   *Name*: "Laptop Request Flow"
    *   *Category*: Hardware
    *   *Priority*: 90

2.  **Steps**:
    *   **Step 1: Approval**
        *   *Type*: `Line Manager`
        *   *Action*: Wait for the requestor's boss to say "Yes".
    *   **Step 2: Conditional Approval**
        *   *Condition*: "Cost > $1000" (Hypothetical logic)
        *   *Action*: If true, trigger **Step 3**. If false, skip to **Step 4**.
    *   **Step 3: Approval (Role)**
        *   *Type*: `IT Director`
        *   *Action*: Wait for the Director to sign off.
    *   **Step 4: Routing**
        *   *Target*: `Procurement Team`
        *   *Action*: Move ticket to their queue to buy the device.
    *   **Step 5: Notification**
        *   *Target*: `User`
        *   *Message*: "Your order has been placed."

---

## 4. Technical Implementation Notes
*   **Storage**: Defined in `workflow_templates` table (store general info) and `workflow_steps` (store the JSON array of steps).
*   **Execution**: The backend `WorkflowEngine` service reads the JSON steps array sequentially.
*   **State**: The current position of a ticket in a workflow is tracked via `current_step_id` or `status` columns on the `Ticket` model.
