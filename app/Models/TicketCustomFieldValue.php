<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketCustomFieldValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'custom_field_id',
        'value',
    ];

    /**
     * Relationships
     */
    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function customField()
    {
        return $this->belongsTo(CustomField::class);
    }

    /**
     * Get the value based on field type
     */
    public function getFormattedValueAttribute()
    {
        if (!$this->customField) {
            return $this->value;
        }

        switch ($this->customField->field_type) {
            case 'multiselect':
                return json_decode($this->value, true) ?? [];
            case 'boolean':
                return (bool) $this->value;
            case 'number':
                return is_numeric($this->value) ? (float) $this->value : null;
            case 'date':
            case 'datetime':
                return $this->value ? \Carbon\Carbon::parse($this->value) : null;
            default:
                return $this->value;
        }
    }

    /**
     * Set the value based on field type
     */
    public function setValueAttribute($value)
    {
        if (!$this->customField) {
            $this->attributes['value'] = $value;
            return;
        }

        switch ($this->customField->field_type) {
            case 'multiselect':
                $this->attributes['value'] = is_array($value) ? json_encode($value) : $value;
                break;
            case 'boolean':
                $this->attributes['value'] = $value ? '1' : '0';
                break;
            case 'number':
                $this->attributes['value'] = $value !== null ? (string) $value : null;
                break;
            default:
                $this->attributes['value'] = $value;
        }
    }
}

