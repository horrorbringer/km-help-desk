import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CustomField {
  id: number;
  name: string;
  label: string;
  field_type: string;
  options?: { label: string; value: string }[];
  default_value?: string;
  is_required: boolean;
  placeholder?: string;
  help_text?: string;
}

interface CustomFieldsFormProps {
  fields: CustomField[];
  values: Record<number, any>;
  onChange: (fieldId: number, value: any) => void;
  errors?: Record<string, string>;
}

export function CustomFieldsForm({
  fields,
  values,
  onChange,
  errors,
}: CustomFieldsFormProps) {
  const renderField = (field: CustomField) => {
    const fieldName = `custom_fields.${field.id}`;
    const value = values[field.id] ?? field.default_value ?? '';
    const error = errors?.[fieldName];

    switch (field.field_type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.is_required}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldName}
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.is_required}
              rows={4}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="number"
              value={value}
              onChange={(e) => onChange(field.id, e.target.value ? parseFloat(e.target.value) : null)}
              placeholder={field.placeholder}
              required={field.is_required}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value || '__none'}
              onValueChange={(val) => onChange(field.id, val === '__none' ? '' : val)}
              required={field.is_required}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {!field.is_required && <SelectItem value="__none">None</SelectItem>}
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={Array.isArray(value) && value.length > 0 ? value[0] : '__none'}
              onValueChange={(val) => {
                const current = Array.isArray(value) ? value : [];
                if (val === '__none') {
                  onChange(field.id, []);
                } else if (!current.includes(val)) {
                  onChange(field.id, [...current, val]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select options...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {Array.isArray(value) && value.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {value.map((val) => {
                  const option = field.options?.find((opt) => opt.value === val);
                  return (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded"
                    >
                      {option?.label || val}
                      <button
                        type="button"
                        onClick={() => {
                          const newValue = value.filter((v) => v !== val);
                          onChange(field.id, newValue);
                        }}
                        className="hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="date"
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              required={field.is_required}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'datetime':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="datetime-local"
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              required={field.is_required}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={fieldName}
                checked={Boolean(value)}
                onCheckedChange={(checked) => onChange(field.id, checked)}
                required={field.is_required}
              />
              <Label htmlFor={fieldName} className="text-sm font-normal cursor-pointer">
                {field.label}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {field.help_text && (
              <p className="text-xs text-muted-foreground ml-6">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Custom Fields</h3>
      {fields.map((field) => renderField(field))}
    </div>
  );
}

