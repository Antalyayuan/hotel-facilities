<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\RoomType */
class RoomTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $rooms = $this->whenLoaded('rooms');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'price_per_night' => (string) $this->price_per_night,
            'status' => $this->status,
            'image_url' => $this->image_url,
            'max_occupancy' => $this->max_occupancy,

            'total_rooms' => $rooms ? $rooms->count() : 0,
            'available_rooms' => $rooms ? $rooms->where('status', 'available')->count() : 0,

            'amenities' => $this->whenLoaded('amenities', function () {
                return $this->amenities->map(fn ($a) => [
                    'id' => $a->id,
                    'name' => $a->name,
                    'icon' => $a->icon,
                ])->values();
            }),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
