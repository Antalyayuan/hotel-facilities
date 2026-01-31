<?php

namespace Database\Seeders;

use App\Models\Amenity;
use App\Models\RoomType;
use Illuminate\Database\Seeder;

class RoomTypeSeeder extends Seeder
{
    public function run(): void
    {
        $roomTypes = [
            [
                'name' => 'Deluxe Suite',
                'description' => 'Luxurious suite with separate living area',
                'price_per_night' => 249.00,
                'max_occupancy' => 4,
                'amenities' => ['WiFi', 'Air Conditioning', 'TV', 'Mini Fridge', 'Private Bathroom', 'Balcony'],
            ],
            [
                'name' => 'Deluxe Suite Premium',
                'description' => 'Premium luxury suite with extra comfort',
                'price_per_night' => 299.00,
                'max_occupancy' => 4,
                'amenities' => ['WiFi', 'Air Conditioning', 'TV', 'Mini Fridge', 'Private Bathroom', 'Balcony'],
            ],
            [
                'name' => 'Family Room',
                'description' => 'Large room ideal for families with children',
                'price_per_night' => 189.00,
                'max_occupancy' => 5,
                'amenities' => ['WiFi', 'Air Conditioning', 'TV', 'Mini Fridge', 'Private Bathroom', 'Extra Beds'],
            ],
        ];

        foreach ($roomTypes as $data) {
            $amenityNames = $data['amenities'];
            unset($data['amenities']);

            $roomType = RoomType::firstOrCreate(
                ['name' => $data['name']],
                $data
            );

            $amenityIds = Amenity::whereIn('name', $amenityNames)->pluck('id');
            $roomType->amenities()->sync($amenityIds);
        }
    }
}
