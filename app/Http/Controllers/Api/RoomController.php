<?php

namespace App\Http\Controllers\Api;
use Illuminate\Database\QueryException;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index(RoomType $roomType)
    {
        $rooms = $roomType->rooms()
            ->orderBy('room_number')
            ->get(['id', 'room_type_id', 'room_number', 'status', 'created_at', 'updated_at']);

        return response()->json([
            'room_type' => [
                'id' => $roomType->id,
                'name' => $roomType->name,
                'price_per_night' => (string) $roomType->price_per_night,
                'status' => $roomType->status,
                'max_occupancy' => $roomType->max_occupancy,
                'image_url' => $roomType->image_url,
            ],
            'rooms' => $rooms,
        ]);
    }

    public function store(Request $request, RoomType $roomType)
    {
        $data = $request->validate([
            'room_number' => ['required','string','max:50'],
            'status' => ['nullable','in:available,occupied,maintenance'],
        ]);

        try {
            $room = $roomType->rooms()->create([
                'room_number' => $data['room_number'],
                'status' => $data['status'] ?? 'available',
            ]);

            return response()->json($room, 201);
        } catch (QueryException $e) {
            // MySQL duplicate entry: SQLSTATE[23000] Integrity constraint violation (1062)
            if (($e->errorInfo[0] ?? null) === '23000') {
                return response()->json([
                    'message' => 'Room number already exists.',
                ], 409);
            }

            throw $e; // 其他异常继续抛出，方便你开发期发现问题
        }
    }


    public function update(Request $request, Room $room)
    {
        $data = $request->validate([
            'room_number' => ['sometimes','required','string','max:50'],
            'status' => ['sometimes','required','in:available,occupied,maintenance'],
        ]);

        $room->update($data);

        return response()->json($room);
    }

    public function destroy(Room $room)
    {
        if ($room->status === 'occupied') {
            return response()->json([
                'message' => 'Cannot delete an occupied room. Change status first.',
            ], 409);
        }

        $room->delete();
        return response()->noContent();
    }

}
