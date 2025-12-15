# How to Use Workflow Templates - Step by Step Guide

## 🎯 Quick Start

### Step 1: Access Workflow Templates

1. Log in to your admin panel
2. Navigate to: **`/admin/workflow-templates`**
   - Or click "Workflow Templates" in the admin menu (if added)

### Step 2: Create Your First Template

1. Click **"Create Workflow Template"** button
2. Fill in the form:
   - **Name**: e.g., "IT Hardware Purchase Workflow"
   - **Description**: e.g., "Standard workflow for IT hardware purchases"
   - **Category** (Optional): Select "IT Support" or leave blank for all categories
   - **Department** (Optional): Select a department or leave blank for all departments
   - **Priority**: Set to `10` (higher = evaluated first)

3. **Add Workflow Steps** (This is where you customize approval order):

   **Example: Standard Order (LM → HOD → CEO)**
   - Click **"Add Step"**
   - Step 1:
     - Type: `Approval`
     - Approval Level: `Line Manager (lm)`
     - Approver Type: `Line Manager`
   - Click **"Add Step"** again
   - Step 2:
     - Type: `Approval`
     - Approval Level: `Head of Department (hod)`
     - Approver Type: `Head of Department`
   - Click **"Add Step"** again
   - Step 3:
     - Type: `Approval`
     - Approval Level: `CEO`
     - Approver Type: `Head of Department` (or create CEO approver type)

4. Click **"Create Template"**

---

## 📋 Real-World Examples

### Example 1: Reverse Approval Order (HOD First, Then LM)

**Use Case:** For high-value purchases, HOD needs to approve before LM.

**Steps:**
1. Create template: "HOD First Workflow"
2. Add Step 1:
   - Type: `Approval`
   - Approval Level: `Head of Department (hod)`
   - Approver Type: `Head of Department`
3. Add Step 2:
   - Type: `Approval`
   - Approval Level: `Line Manager (lm)`
   - Approver Type: `Line Manager`
4. Save

**Result:** Tickets will require HOD approval first, then LM approval.

---

### Example 2: Skip LM for Low-Cost Items

**Use Case:** Items under $100 don't need LM approval, go straight to HOD.

**Steps:**
1. Create template: "Low Cost Skip LM"
2. Add Step 1:
   - Type: `Conditional Approval`
   - Approval Level: `Line Manager (lm)`
   - Approver Type: `Line Manager`
   - If False: `Skip Step`
   - (Note: Condition logic will be added in future enhancement)
3. Add Step 2:
   - Type: `Approval`
   - Approval Level: `Head of Department (hod)`
   - Approver Type: `Head of Department`
4. Save

**Result:** LM approval is skipped for low-cost items, goes directly to HOD.

---

### Example 3: IT-Specific Workflow

**Use Case:** IT tickets need IT Manager approval before HOD.

**Steps:**
1. Create template: "IT Department Workflow"
2. Set **Category**: "IT Support"
3. Set **Department**: "IT Department"
4. Add Step 1:
   - Type: `Approval`
   - Approval Level: `Line Manager (lm)`
   - Approver Type: `Line Manager`
5. Add Step 2:
   - Type: `Routing`
   - Route To: `category_default_team` (routes to IT team)
6. Add Step 3:
   - Type: `Approval`
   - Approval Level: `Head of Department (hod)`
   - Approver Type: `Head of Department`
7. Save

**Result:** IT tickets follow this specific workflow.

---

### Example 4: CEO Approval for High-Value Items

**Use Case:** Items over $10,000 need CEO approval after HOD.

**Steps:**
1. Create template: "High Value Purchase Workflow"
2. Add Step 1:
   - Type: `Approval`
   - Approval Level: `Line Manager (lm)`
   - Approver Type: `Line Manager`
3. Add Step 2:
   - Type: `Approval`
   - Approval Level: `Head of Department (hod)`
   - Approver Type: `Head of Department`
4. Add Step 3:
   - Type: `Approval`
   - Approval Level: `CEO`
   - Approver Type: `Head of Department` (or CEO approver type)
5. Save

**Result:** High-value purchases require LM → HOD → CEO approval.

---

## 🔄 Reordering Steps

**To change approval order:**

1. Click **"Edit"** on a template
2. Use the **↑ (Up)** and **↓ (Down)** buttons next to each step
3. Steps execute in the order shown (top to bottom)
4. Click **"Update Template"**

**Example:** To make HOD approve before LM:
- Move HOD step above LM step using ↑ button

---

## 🎛️ Step Types Explained

### 1. Approval
**What it does:** Creates an approval request that must be approved.

**When to use:** Standard approval steps (LM, HOD, CEO)

**Fields:**
- **Approval Level**: `lm`, `hod`, or `ceo`
- **Approver Type**: `line_manager`, `head_of_department`, `hod`

---

### 2. Conditional Approval
**What it does:** Creates approval only if condition is met.

**When to use:** Skip approval for certain conditions (e.g., low cost, low priority)

**Fields:**
- Same as Approval
- **If False**: `skip_step` (skip if condition false) or `route_directly` (route without approval)

**Note:** Condition logic will be added in future enhancement.

---

### 3. Routing
**What it does:** Routes ticket to a team/department.

**When to use:** Assign ticket to specific team before/after approval

**Fields:**
- **Route To**: `category_default_team` (use category's default team) or specific team ID

---

### 4. Conditional Routing
**What it does:** Routes ticket only if condition is met.

**When to use:** Route to different teams based on ticket properties

**Fields:**
- Same as Routing
- **Condition**: JSON condition (future enhancement)

---

## 🔍 How Templates Are Matched

When a ticket is created, the system finds the best matching template:

**Priority Order:**
1. **Category + Department** specific (highest priority)
2. **Category** specific
3. **Department** specific
4. **Default** (no category/department)

**Example:**
- Ticket: IT Support category, IT Department
- Templates:
  1. "IT Workflow" (Category: IT Support, Department: IT) ✅ **Matches!**
  2. "IT Category Workflow" (Category: IT Support) - Not used (lower priority)
  3. "Default Workflow" (no category/department) - Not used

---

## ✅ Managing Templates

### Edit Template
1. Go to `/admin/workflow-templates`
2. Click **"Edit"** button on any template
3. Modify steps, reorder, add/remove
4. Click **"Update Template"**

### Delete Template
1. Go to `/admin/workflow-templates`
2. Click **"Delete"** button (trash icon)
3. Confirm deletion

### Activate/Deactivate
1. Go to `/admin/workflow-templates`
2. Click **"Power"** button (⚡ icon)
3. Only **Active** templates are used

### Search & Filter
- **Search**: Type in search box to find templates by name
- **Filter by Category**: Select category from dropdown
- **Filter by Department**: Select department from dropdown

---

## 🎯 Best Practices

1. **Name Templates Clearly**
   - Use descriptive names: "IT Hardware Purchase", "HR Leave Request"

2. **Set Appropriate Priority**
   - More specific templates (Category + Department) should have higher priority
   - Default templates should have lower priority (0-10)

3. **Test Templates**
   - Create a test ticket to verify workflow order
   - Check that approvals are created in correct sequence

4. **Document Templates**
   - Use description field to explain when template is used
   - Note any special conditions

5. **Start Simple**
   - Begin with basic approval steps
   - Add conditional logic later when needed

---

## 🚨 Common Issues

### Template Not Being Used

**Problem:** Ticket doesn't use your template

**Solutions:**
1. Check template is **Active** (green badge)
2. Check **Category/Department** match ticket
3. Check **Priority** is high enough
4. Verify no other template has higher priority match

### Approval Order Wrong

**Problem:** Approvals happen in wrong order

**Solutions:**
1. Edit template
2. Use ↑/↓ buttons to reorder steps
3. Steps execute top to bottom

### Step Not Executing

**Problem:** Step is skipped

**Solutions:**
1. Check step type is correct
2. For conditional steps, verify condition logic
3. Check if step is in "skip_steps" in approval_rules

---

## 📝 Quick Reference

**URL:** `/admin/workflow-templates`

**Create:** Click "Create Workflow Template" → Fill form → Add steps → Save

**Edit:** Click "Edit" → Modify → Save

**Reorder:** Use ↑/↓ buttons on steps

**Delete:** Click trash icon → Confirm

**Activate/Deactivate:** Click power icon

---

## 🎉 You're Ready!

You can now customize approval order for any ticket category or department. Start with a simple template and expand as needed!
