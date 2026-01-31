<?php

namespace Database\Seeders;

use App\Models\Amenity;
use Illuminate\Database\Seeder;

class AmenitySeeder extends Seeder
{
    public function run(): void
    {
        $amenities = [
            ['name' => 'WiFi', 'icon' => 'wifi'],
            ['name' => 'Air Conditioning', 'icon' => 'ac'],
            ['name' => 'TV', 'icon' => 'tv'],
            ['name' => 'Mini Fridge', 'icon' => 'fridge'],
            ['name' => 'Private Bathroom', 'icon' => 'bath'],
            ['name' => 'Balcony', 'icon' => 'balcony'],
            ['name' => 'Extra Beds', 'icon' => 'bed'],
        ];

        foreach ($amenities as $amenity) {
            Amenity::firstOrCreate(
                ['name' => $amenity['name']],
                $amenity
            );
        }
    }
}
