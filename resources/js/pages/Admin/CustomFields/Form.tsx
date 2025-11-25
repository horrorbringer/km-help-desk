import React, { FormEvent } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { IconPlus, IconTrash } from '@tabler/icons-react';

import AppLayout from '@/layouts/app-layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PageProps } from '@/types';

interface CustomFieldFormProps {
  customField?: {
    id: number;
    name: string;
    slug: string;
    label: string;
    description?: string;
    field_type: string;
    options?: { label: string; value: string }[];
    default_value?: string;
    is_required: boolean;
    is_active: boolean;
    display_order: number;
    validation_rules?: string[];
    placeholder?: string;
    help_text?: string;
  };
  fieldTypes: Record<string, string>;
}

export default function CustomFieldForm({ customField, fieldTypes }: CustomFieldFormProps) {
  const isEdit = !!customField;
  const { errors } = usePage<PageProps>().props;

  const { data, setData, post, put, processing } = useForm({
    name: customField?.name ?? '',
    slug: customField?.slug ?? '',
    label: customField?.label ?? '',
    description: customField?.description ?? '',
    field_type: customField?.field_type ?? 'text',
    options: (customField?.options ?? []) as { label: string; value: string }[],
    default_value: customField?.default_value ?? '',
    is_required: customField?.is_required ?? false,
    is_active: customField?.is_active ?? true,
    display_order: customField?.display_order ?? 0,
    validation_rules: (customField?.validation_rules ?? []) as string[],
    placeholder: customField?.placeholder ?? '',
    help_text: customField?.help_text ?? '',
  });

  const addOption = () => {
    setData('options', [...data.options, { label: '', value: '' }]);
  };

  const removeOption = (index: number) => {
    setData('options', data.options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: 'label' | 'value', value: string) => {
    const updated = [...data.options];
    updated[index] = { ...updated[index], [field]: value };
    setData('options', updated);
  };

  const needsOptions = ['select', 'multiselect'].includes(data.field_type);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Clear options if not needed
    if (!needsOptions) {
      setData('options', []);
    }

    if (isEdit && customField) {
      put(route('admin.custom-fields.update', customField.id));
    } else {
      post(route('admin.custom-fields.store'));
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit Custom Field' : 'New Custom Field'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Edit Custom Field' : 'New Custom Field'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update the custom field.'
                : 'Create a custom field to capture additional ticket information.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.custom-fields.index')}>← Back</Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Field Information</CardTitle>
                <CardDescription>
                  {isEdit
                    ? 'Update the custom field details below.'
                    : 'Fill in the information to create a new custom field.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Field Name *</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. equipment_serial_number"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Internal name (used in code, lowercase, underscores)
                  </p>
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Label */}
                <div className="space-y-2">
                  <Label htmlFor="label">Field Label *</Label>
                  <Input
                    id="label"
                    value={data.label}
                    onChange={(e) => setData('label', e.target.value)}
                    placeholder="e.g. Equipment Serial Number"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Display label shown to users
                  </p>
                  {errors.label && <p className="text-xs text-red-500">{errors.label}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Describe what this field is for..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description}</p>
                  )}
                </div>

                {/* Field Type */}
                <div className="space-y-2">
                  <Label htmlFor="field_type">Field Type *</Label>
                  <Select
                    value={data.field_type}
                    onValueChange={(value) => setData('field_type', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(fieldTypes).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.field_type && (
                    <p className="text-xs text-red-500">{errors.field_type}</p>
                  )}
                </div>

                {/* Options (for select/multiselect) */}
                {needsOptions && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Options *</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addOption}>
                        <IconPlus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    {data.options.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Add at least one option for select/multiselect fields
                      </p>
                    )}
                    {data.options.map((option, index) => (
                      <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Label"
                            value={option.label}
                            onChange={(e) => updateOption(index, 'label', e.target.value)}
                            required
                          />
                          <Input
                            placeholder="Value"
                            value={option.value}
                            onChange={(e) => updateOption(index, 'value', e.target.value)}
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {errors.options && (
                      <p className="text-xs text-red-500">{errors.options}</p>
                    )}
                  </div>
                )}

                {/* Default Value */}
                <div className="space-y-2">
                  <Label htmlFor="default_value">Default Value</Label>
                  <Input
                    id="default_value"
                    value={data.default_value}
                    onChange={(e) => setData('default_value', e.target.value)}
                    placeholder="Default value for this field"
                  />
                  {errors.default_value && (
                    <p className="text-xs text-red-500">{errors.default_value}</p>
                  )}
                </div>

                {/* Placeholder */}
                <div className="space-y-2">
                  <Label htmlFor="placeholder">Placeholder Text</Label>
                  <Input
                    id="placeholder"
                    value={data.placeholder}
                    onChange={(e) => setData('placeholder', e.target.value)}
                    placeholder="e.g. Enter serial number..."
                  />
                  {errors.placeholder && (
                    <p className="text-xs text-red-500">{errors.placeholder}</p>
                  )}
                </div>

                {/* Help Text */}
                <div className="space-y-2">
                  <Label htmlFor="help_text">Help Text</Label>
                  <Textarea
                    id="help_text"
                    value={data.help_text}
                    onChange={(e) => setData('help_text', e.target.value)}
                    placeholder="Additional help text shown below the field..."
                    rows={2}
                  />
                  {errors.help_text && (
                    <p className="text-xs text-red-500">{errors.help_text}</p>
                  )}
                </div>

                {/* Display Order */}
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order *</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={data.display_order}
                    onChange={(e) => setData('display_order', parseInt(e.target.value) || 0)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers appear first (0 = first)
                  </p>
                  {errors.display_order && (
                    <p className="text-xs text-red-500">{errors.display_order}</p>
                  )}
                </div>

                {/* Required */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_required"
                    checked={data.is_required}
                    onCheckedChange={(checked) => setData('is_required', Boolean(checked))}
                  />
                  <Label htmlFor="is_required" className="text-sm font-normal cursor-pointer">
                    Field is required
                  </Label>
                </div>

                {/* Active */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                  />
                  <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                    Field is active
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Inactive fields won't appear in ticket forms
                </p>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href={route('admin.custom-fields.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Saving...' : isEdit ? 'Update Field' : 'Create Field'}
                </Button>
              </CardFooter>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle>Field Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Text</p>
                  <p className="text-muted-foreground">Single line text input</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Textarea</p>
                  <p className="text-muted-foreground">Multi-line text input</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Number</p>
                  <p className="text-muted-foreground">Numeric input</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Select</p>
                  <p className="text-muted-foreground">Dropdown with options</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Multi-select</p>
                  <p className="text-muted-foreground">Multiple option selection</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Date/DateTime</p>
                  <p className="text-muted-foreground">Date or date-time picker</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Checkbox</p>
                  <p className="text-muted-foreground">Boolean true/false</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

