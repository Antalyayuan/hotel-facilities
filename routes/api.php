<?php

use App\Http\Controllers\Api\RoomTypeController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AmenityController;
use App\Http\Controllers\Api\RoomController;

Route::get('/ping', function () {
    return response()->json([
        'ok' => true,
        'time' => now()->toDateTimeString(),
    ]);
});

Route::get('amenities', [AmenityController::class, 'index']);

Route::apiResource('room-types', RoomTypeController::class);

Route::get('room-types/{roomType}/rooms', [RoomController::class, 'index']);
Route::post('room-types/{roomType}/rooms', [RoomController::class, 'store']);

Route::put('rooms/{room}', [RoomController::class, 'update']);
Route::delete('rooms/{room}', [RoomController::class, 'destroy']);
