<?php

namespace Database\Seeders;

use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    public function run(): void
    {
        $roomTypes = RoomType::all();

        foreach ($roomTypes as $roomType) {
            for ($i = 1; $i <= 3; $i++) {
                Room::firstOrCreate(
                    [
                        'room_type_id' => $roomType->id,
                        'room_number' => (string)(100 + $i),
                    ],
                    [
                        'status' => $i === 3 ? 'occupied' : 'available',
                    ]
                );
            }
        }
    }
}
