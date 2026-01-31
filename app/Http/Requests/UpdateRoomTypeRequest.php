<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price_per_night' => ['sometimes', 'required', 'numeric', 'min:0', 'max:999999.99'],
            'status' => ['sometimes', 'required', 'in:active,inactive'],
            'image_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'max_occupancy' => ['sometimes', 'required', 'integer', 'min:1', 'max:20'],
            'image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],

            'amenity_ids' => ['sometimes', 'array'],
            'amenity_ids.*' => ['integer', 'exists:amenities,id'],
        ];
    }
}
