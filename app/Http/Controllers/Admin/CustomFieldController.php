<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomFieldRequest;
use App\Models\CustomField;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomFieldController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'field_type', 'is_active']);

        $customFields = CustomField::query()
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('label', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->when(isset($filters['field_type']), function ($query) use ($filters) {
                $query->where('field_type', $filters['field_type']);
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            })
            ->ordered()
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($field) => [
                'id' => $field->id,
                'name' => $field->name,
                'slug' => $field->slug,
                'label' => $field->label,
                'field_type' => $field->field_type,
                'is_required' => $field->is_required,
                'is_active' => $field->is_active,
                'display_order' => $field->display_order,
                'created_at' => $field->created_at->toDateTimeString(),
            ]);

        return Inertia::render('Admin/CustomFields/Index', [
            'customFields' => $customFields,
            'filters' => $filters,
            'fieldTypes' => CustomField::FIELD_TYPES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/CustomFields/Form', [
            'customField' => null,
            'fieldTypes' => CustomField::FIELD_TYPES,
        ]);
    }

    public function store(CustomFieldRequest $request): RedirectResponse
    {
        CustomField::create($request->validated());

        return redirect()
            ->route('admin.custom-fields.index')
            ->with('success', 'Custom field created successfully.');
    }

    public function edit(CustomField $customField): Response
    {
        // Transform options from associative array to array of objects
        $options = [];
        if ($customField->options && is_array($customField->options)) {
            // Check if options is already in the correct format (array of objects)
            if (isset($customField->options[0]) && is_array($customField->options[0]) && isset($customField->options[0]['label'])) {
                $options = $customField->options;
            } else {
                // Transform associative array to array of objects
                foreach ($customField->options as $key => $value) {
                    $options[] = [
                        'label' => $value,
                        'value' => is_numeric($key) ? $value : $key,
                    ];
                }
            }
        }
        
        return Inertia::render('Admin/CustomFields/Form', [
            'customField' => [
                'id' => $customField->id,
                'name' => $customField->name,
                'slug' => $customField->slug,
                'label' => $customField->label,
                'description' => $customField->description,
                'field_type' => $customField->field_type,
                'options' => $options,
                'default_value' => $customField->default_value,
                'is_required' => $customField->is_required,
                'is_active' => $customField->is_active,
                'display_order' => $customField->display_order,
                'validation_rules' => $customField->validation_rules ?? [],
                'placeholder' => $customField->placeholder,
                'help_text' => $customField->help_text,
            ],
            'fieldTypes' => CustomField::FIELD_TYPES,
        ]);
    }

    public function update(CustomFieldRequest $request, CustomField $customField): RedirectResponse
    {
        $customField->update($request->validated());

        return redirect()
            ->route('admin.custom-fields.index')
            ->with('success', 'Custom field updated successfully.');
    }

    public function destroy(CustomField $customField): RedirectResponse
    {
        // Check if field has values
        if ($customField->ticketValues()->count() > 0) {
            return redirect()
                ->route('admin.custom-fields.index')
                ->with('error', 'Cannot delete custom field that has values. Please delete all values first.');
        }

        $customField->delete();

        return redirect()
            ->route('admin.custom-fields.index')
            ->with('success', 'Custom field deleted successfully.');
    }
}

