<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class CustomField extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'label',
        'description',
        'field_type',
        'options',
        'default_value',
        'is_required',
        'is_active',
        'display_order',
        'validation_rules',
        'placeholder',
        'help_text',
    ];

    protected $casts = [
        'options' => 'array',
        'validation_rules' => 'array',
        'is_required' => 'boolean',
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    public const FIELD_TYPES = [
        'text' => 'Text',
        'textarea' => 'Textarea',
        'number' => 'Number',
        'select' => 'Select',
        'multiselect' => 'Multi-select',
        'date' => 'Date',
        'datetime' => 'Date & Time',
        'boolean' => 'Checkbox',
        'file' => 'File Upload',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($field) {
            if (empty($field->slug)) {
                $field->slug = Str::slug($field->name);
            }
        });
    }

    /**
     * Relationships
     */
    public function ticketValues()
    {
        return $this->hasMany(TicketCustomFieldValue::class);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('name');
    }

    /**
     * Get validation rules for this field
     */
    public function getValidationRules(): array
    {
        $rules = [];

        if ($this->is_required) {
            $rules[] = 'required';
        } else {
            $rules[] = 'nullable';
        }

        switch ($this->field_type) {
            case 'text':
                $rules[] = 'string';
                $rules[] = 'max:255';
                break;
            case 'textarea':
                $rules[] = 'string';
                break;
            case 'number':
                $rules[] = 'numeric';
                break;
            case 'select':
                if ($this->options) {
                    $rules[] = 'in:' . implode(',', array_column($this->options, 'value'));
                }
                break;
            case 'multiselect':
                $rules[] = 'array';
                if ($this->options) {
                    $rules[] = 'in:' . implode(',', array_column($this->options, 'value'));
                }
                break;
            case 'date':
                $rules[] = 'date';
                break;
            case 'datetime':
                $rules[] = 'date';
                break;
            case 'boolean':
                $rules[] = 'boolean';
                break;
        }

        // Add custom validation rules if provided
        if ($this->validation_rules) {
            $rules = array_merge($rules, $this->validation_rules);
        }

        return $rules;
    }
}

